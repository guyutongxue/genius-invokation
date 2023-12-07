import * as AST from "./ast";
import { QueryLexer } from "./lexer";
import { QueryParser } from "./parser";

const parserInstance = new QueryParser();

const BaseVisitorWithDefaults =
  parserInstance.getBaseCstVisitorConstructorWithDefaults();

class QueryVisitor extends BaseVisitorWithDefaults {
  constructor() {
    super();
    this.validateVisitor();
  }
  getter: AST.StateGetter = null!;

  query(ctx: any): AST.Query {
    return {
      type: "or",
      children: this.visit(ctx.orQuery[0]),
      orderBy: ctx.orderByClause
        ? ctx.orderByClause.map((c: any) => this.visit(c))
        : [],
      limit: ctx.limitClause ? this.visit(ctx.limitClause[0]) : Infinity
    };
  }

  orQuery(ctx: any): AST.AndQuery[] {
    return ctx.andQuery.map((c: any) => this.visit(c));
  }

  andQuery(ctx: any): AST.AndQuery {
    return {
      type: "and",
      children: ctx.relationQuery.map((c: any) => this.visit(c)),
    };
  }

  relationQuery(ctx: any): AST.RelationQuery {
    let length = ctx.entityRelationOperator?.length ?? 0;
    const pseudoRoot: AST.RelationQuery = {
      type: "relation",
      subtype: "has",
      subject: null!,
      object: null!,
    };
    let current = pseudoRoot;
    while (length > 0) {
      const subject = this.visit(ctx.prefixQuery.shift());
      const { children: opChildren } = ctx.entityRelationOperator.shift();
      current.object = {
        type: "relation",
        subtype: opChildren.Has ? "has" : "at",
        subject,
        object: null!,
      };
      current = current.object;
      length--;
    }
    current.object = {
      type: "relation",
      subtype: "leaf",
      query: this.visit(ctx.prefixQuery[0]),
    };
    return pseudoRoot.object;
  }

  prefixQuery(ctx: any): AST.PrefixQuery {
    const notList =
      (ctx.Not as unknown[])?.map((c: any) => ({
        value: "not" as const,
        idx: c.startOffset as number,
      })) ?? [];
    const recentList =
      (ctx.RecentFrom as unknown[])?.map((c: any) => ({
        value: "recentOpp" as const,
        idx: c.startOffset as number,
      })) ?? [];
    const prefixes = [...notList, ...recentList]
      .sort((a, b) => a.idx - b.idx)
      .map((c) => c.value);
    return {
      type: "prefix",
      prefixes,
      target: this.visit(ctx.atomicQuery),
    };
  }

  atomicQuery(ctx: any): AST.AtomicQuery {
    if (ctx.externalQuery) {
      return this.visit(ctx.externalQuery);
    }
    if (ctx.LParen) {
      return {
        type: "atomic",
        subtype: "paren",
        query: {
          type: "or",
          children: this.visit(ctx.orQuery[0]),
          orderBy: [],
          limit: Infinity
        }
      };
    }
    const [entityType, position, defeated] = this.visit(
      ctx.typeSpecifier,
    );
    return {
      type: "atomic",
      subtype: "atomic",
      who: this.visit(ctx.whoClause),
      entityType,
      position,
      defeated,
      rule: ctx.withClause ? this.visit(ctx.withClause) : null,
    };
  }

  externalQuery(ctx: any): AST.AtomicQuery {
    return {
      type: "external",
      identifiers: ctx.Identifier.map((c: any) => c.image)
    }
  }

  typeSpecifier(ctx: any): [AST.EntityType, AST.Position | null, AST.DefeatedOption] {
    let entityType: AST.EntityType = "character";
    let position: AST.Position | null = null;
    let defeated: AST.DefeatedOption = "no";
    if (ctx.characterSpecifier) {
      [position, defeated] = this.visit(ctx.characterSpecifier);
    } else {
      if (ctx.Any) {
        entityType = "any";
      } else if (ctx.Combat) {
        entityType = "combatStatus";
      } else if (ctx.Summon) {
        entityType = "summon";
      } else if (ctx.Status) {
        entityType = "status";
      } else if (ctx.Support) {
        entityType = "support";
      } else if (ctx.Equipment) {
        entityType = "equipment";
      }
    }
    return [entityType, position, defeated];
  }

  characterSpecifier(ctx: any): [AST.Position | null, AST.DefeatedOption] {
    return [
      ctx.positionSpecifier ? this.visit(ctx.positionSpecifier) : null,
      ctx.Includes ? "includes" : ctx.Defeated ? "only" : "no",
    ];
  }

  positionSpecifier(ctx: any): AST.Position | null {
    if (ctx.Active) {
      return "active";
    } else if (ctx.Prev) {
      return "prev";
    } else if (ctx.Next) {
      return "next";
    } else if (ctx.Standby) {
      return "standby";
    }
    return null;
  }

  whoClause(ctx: any): AST.Who {
    if (ctx.My) {
      return "my";
    } else if (ctx.Opp) {
      return "opp";
    } else if (ctx.All) {
      return "all";
    }
    return "my";
  }

  withClause(ctx: any): AST.Rule {
    let ruleDetail: AST.WithRule;
    if (ctx.variableRule) {
      ruleDetail = this.visit(ctx.variableRule);
    } else if (ctx.tagRule) {
      ruleDetail = this.visit(ctx.tagRule);
    } else {
      ruleDetail = this.visit(ctx.idRule);
    }

    return {
      type: "rule",
      how: ctx.Not ? (st) => !ruleDetail(st) : ruleDetail,
    };
  }

  variableRule(ctx: any): AST.WithRule {
    const lhs = this.visit(ctx.varname[0]);
    const operator = this.visit(ctx.relativeOperator[0]);
    const rhs = this.visit(ctx.varname[1]);
    return new Function(
      "$",
      `return ${lhs} ${operator} ${rhs};`,
    ) as AST.WithRule;
  }

  tagRule(ctx: any): AST.WithRule {
    const identifiers: string[] = ctx.identifier.map((c: any) => this.visit(c));
    return new Function(
      "$",
      `for (const t of [${identifiers.map((i) => JSON.stringify(i)).join()}]) {
  if (!${this.getter.tags}.includes(t)) {
    return false;
  }
  return true;
}`,
    ) as AST.WithRule;
  }

  idRule(ctx: any): AST.WithRule {
    const idStr = ctx.Definition ? this.getter.definitionId : this.getter.id;
    const lit = ctx.IntegerLiteral[0].image;
    return new Function("$", `return ${idStr} === ${lit};`) as AST.WithRule;
  }

  relativeOperator(ctx: any): string {
    const str = Object.values<any>(ctx)[0][0].image;
    return str === "=" ? "==" : str;
  }

  varname(ctx: any): string {
    if (ctx.IntegerLiteral) {
      return ctx.IntegerLiteral[0].image;
    } else {
      const f = ctx.Definition
        ? this.getter.getConstant
        : this.getter.getVariableOrConstant;
      const name = this.parseIdentifier(ctx);
      return f.call(this.getter, name);
    }
  }
  identifier(ctx: any): string {
    return this.parseIdentifier(ctx);
  }

  parseIdentifier(ctx: any): string {
    if (ctx.Identifier) {
      return ctx.Identifier[0].image;
    } else if (ctx.StringLiteral) {
      return new Function(`return ${ctx.StringLiteral[0].image}`)();
    } else {
      throw Error("Unexpected identifier");
    }
  }

  orderByClause(ctx: any): AST.OrderBy {
    // console.log(ctx);
    return new Function(
      "$",
      `return ${this.visit(ctx.expression)};`,
    ) as AST.OrderBy;
  }

  limitClause(ctx: any): number {
    return Number(ctx.IntegerLiteral[0].image);
  }

  atomicExpression(ctx: any): string {
    if (ctx.expression) {
      return `(${this.visit(ctx.expression)})`;
    }
    return this.visit(ctx.varname);
  }
  expression(ctx: any): string {
    return this.visit(ctx.additiveExpression);
  }
  additiveExpression(ctx: any): string {
    const exprStrs: string[] = ctx.multiplicativeExpression.map((c: any) =>
      this.visit(c),
    );
    const operators: string[] =
      ctx.additiveOperator?.map((c: any) => this.visit(c)) ?? [];
    let result = exprStrs.pop()!;
    for (let i = 0; i < operators.length; i++) {
      result += ` ${operators[i]} ${exprStrs[i]}`;
    }
    return result;
  }
  multiplicativeExpression(ctx: any): string {
    const exprStrs: string[] = ctx.atomicExpression.map((c: any) =>
      this.visit(c),
    );
    const operators: string[] =
      ctx.multiplicativeOperator?.map((c: any) => this.visit(c)) ?? [];
    let result = exprStrs.pop()!;
    for (let i = 0; i < operators.length; i++) {
      result += ` ${operators[i]} ${exprStrs[i]}`;
    }
    return result;
  }

  additiveOperator(ctx: any): string {
    return Object.values<any>(ctx)[0][0].image;
  }
  multiplicativeOperator(ctx: any): string {
    return Object.values<any>(ctx)[0][0].image;
  }
}

const visitorInstance = new QueryVisitor();

export function toAst(inputText: string, getter: AST.StateGetter): AST.Query {
  // Lex
  const lexResult = QueryLexer.tokenize(inputText);
  parserInstance.input = lexResult.tokens;

  // Automatic CST created when parsing
  // @ts-expect-error `query` is not typed
  const cst = parserInstance.query();
  if (parserInstance.errors.length > 0) {
    const e = parserInstance.errors[0];
    const { startOffset, endOffset = startOffset } = e.token;
    const space = " ".repeat(startOffset);
    const squiggle = "~".repeat(endOffset - startOffset);
    throw Error(`Parsing query got error:
${inputText}
${space}^${squiggle}
${e.message}`);
  }

  // Visit
  visitorInstance.getter = getter;
  const ast = visitorInstance.visit(cst);
  return ast;
}
