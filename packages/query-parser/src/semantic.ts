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

  query(ctx: any): AST.Query {
    return {
      type: "or",
      children: ctx.orQuery.map((c: any) => this.visit(c)),
    };
  }

  orQuery(ctx: any): AST.AndQuery {
    return this.visit(ctx.andQuery);
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
    if (ctx.LParen) {
      return {
        type: "atomic",
        subtype: "paren",
        query: this.visit(ctx.orQuery),
      };
    }
    const [entityType, position, includesDefeated] = this.visit(ctx.typeSpecifier);
    return {
      type: "atomic",
      subtype: "atomic",
      who: this.visit(ctx.whoRule),
      entityType,
      position,
      includesDefeated,
      rule: ctx.withRule ? this.visit(ctx.withRule) : null,
    };
  }

  typeSpecifier(ctx: any): [AST.EntityType, AST.Position | null, boolean] {
    let entityType: AST.EntityType = "character";
    let position: AST.Position | null = null;
    let includesDefeated = false;
    if (ctx.characterSpecifier) {
      [position, includesDefeated] = this.visit(ctx.characterSpecifier);
    } else {
      if (ctx.Combat) {
        entityType = "combatStatus";
      } if (ctx.Summon) {
        entityType = "summon";
      } else if (ctx.Status) {
        entityType = "status";
      } else if (ctx.Support) {
        entityType = "support";
      } else if (ctx.Equipment) {
        entityType = "equipment";
      }
    }
    return [entityType, position, includesDefeated];
  }

  characterSpecifier(ctx: any): [AST.Position | null, boolean] {
    return [
      ctx.positionSpecifier ? this.visit(ctx.positionSpecifier) : null,
      !!ctx.IncludesDefeated
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

  whoRule(ctx: any): AST.Who {
    if (ctx.My) {
      return "my";
    } else if (ctx.Opp) {
      return "opp";
    } else if (ctx.All) {
      return "all";
    }
    return "my";
  }

  withRule(ctx: any): AST.Rule {
    let ruleDetail: AST.RuleDetail;
    if (ctx.variableClause) {
      ruleDetail = this.visit(ctx.variableClause);
    } else if (ctx.tagClause) {
      ruleDetail = this.visit(ctx.tagClause);
    } else {
      ruleDetail = this.visit(ctx.idClause);
    }

    return {
      type: "rule",
      negative: !!ctx.Not,
      how: ruleDetail
    }
  }

  variableClause(ctx: any): AST.RuleDetail {
    return {
      type: "ruleDetail",
      subtype: "expression",
      lhs: this.visit(ctx.varname[0]),
      operator: this.visit(ctx.relativeOperator[0]),
      rhs: this.visit(ctx.varname[1]),
    };
  }

  relativeOperator(ctx: any): AST.Operator {
    return Object.values<any>(ctx)[0][0].image;
  }

  varname(ctx: any): AST.Variable {
    if (ctx.IntegerLiteral) {
      return {
        type: "variable",
        subtype: "number",
        value: this.parseLiteral(ctx.IntegerLiteral)
      };
    } else {
      return {
        type: "variable",
        subtype: ctx.Definition ? "constant" : "variable",
        value: ctx.Identifier ? ctx.Identifier[0].image : this.parseLiteral(ctx.StringLiteral),
      };
    }
  }

  parseLiteral(ctx: any): any {
    return new Function(`return ${ctx[0].image}`)();
  }
}

const visitorInstance = new QueryVisitor();

export function toAst(inputText: string): AST.Query {
  // Lex
  const lexResult = QueryLexer.tokenize(inputText);
  parserInstance.input = lexResult.tokens;

  // Automatic CST created when parsing
  // @ts-expect-error `query` is not typed
  const cst = parserInstance.query();
  if (parserInstance.errors.length > 0) {
    throw Error(
      "Sad sad panda, parsing errors detected!\n" +
        parserInstance.errors[0].message
    );
  }

  // Visit
  const ast = visitorInstance.visit(cst);
  return ast;
}
