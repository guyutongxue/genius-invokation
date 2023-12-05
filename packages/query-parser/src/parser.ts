import { CstParser } from "chevrotain";
import * as Token from "./lexer";
import { allTokens, QueryLexer } from "./lexer";

export class QueryParser extends CstParser {
  constructor() {
    super(allTokens);
    const $ = this as this & Record<any, any>;
    $.RULE("query", () => {
      $.SUBRULE($.orQuery);
      $.OPTION(() => $.SUBRULE($.orderByClause));
    });
    $.RULE("tagRule", () => {
      $.CONSUME(Token.Tag);
      $.CONSUME(Token.LParen);
      $.AT_LEAST_ONE_SEP({
        SEP: Token.Comma,
        DEF: () => $.SUBRULE($.identifier),
      });
      $.CONSUME(Token.RParen);
    });
    $.RULE("identifier", () => {
      $.OR([
        { ALT: () => $.CONSUME(Token.Identifier) },
        { ALT: () => $.CONSUME(Token.StringLiteral) },
      ]);
    });
    $.RULE("varname", () => {
      $.OR([
        { ALT: () => $.CONSUME(Token.Identifier) },
        { ALT: () => $.CONSUME(Token.StringLiteral) },
        { ALT: () => $.CONSUME(Token.IntegerLiteral) },
      ]);
      $.OPTION(() => {
        $.CONSUME(Token.As);
        $.CONSUME(Token.Definition);
      });
    });
    $.RULE("relativeOperator", () => {
      $.OR([
        { ALT: () => $.CONSUME(Token.LessThan) },
        { ALT: () => $.CONSUME(Token.LessEqualThan) },
        { ALT: () => $.CONSUME(Token.Equal) },
        { ALT: () => $.CONSUME(Token.GreaterEqualThan) },
        { ALT: () => $.CONSUME(Token.GreaterThan) },
        { ALT: () => $.CONSUME(Token.NotEqual) },
      ]);
    });
    $.RULE("variableRule", () => {
      $.SUBRULE($.varname);
      $.SUBRULE($.relativeOperator);
      $.SUBRULE2($.varname);
    });
    $.RULE("withClause", () => {
      $.OPTION(() => $.CONSUME(Token.Not));
      $.CONSUME(Token.With),
        $.OR([
          { ALT: () => $.SUBRULE($.variableRule) },
          { ALT: () => $.SUBRULE($.tagRule) },
          { ALT: () => $.SUBRULE($.idRule) },
        ]);
    });
    $.RULE("idRule", () => {
      $.OPTION(() => $.CONSUME(Token.Definition));
      $.CONSUME(Token.Id);
      $.OPTION2(() => $.CONSUME(Token.Equal));
      $.CONSUME(Token.IntegerLiteral);
    });
    $.RULE("typeSpecifier", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.characterSpecifier) },
        { ALT: () => $.CONSUME(Token.Summon) },
        {
          ALT: () => {
            $.OPTION(() => $.CONSUME(Token.Combat));
            $.CONSUME(Token.Status);
          },
        },
        { ALT: () => $.CONSUME(Token.Support) },
        { ALT: () => $.CONSUME(Token.Equipment) },
        { ALT: () => $.CONSUME(Token.Any) },
      ]);
    });
    $.RULE("positionSpecifier", () => {
      $.OR([
        { ALT: () => $.CONSUME(Token.Active) },
        { ALT: () => $.CONSUME(Token.Prev) },
        { ALT: () => $.CONSUME(Token.Next) },
        { ALT: () => $.CONSUME(Token.Standby) },
      ]);
    });
    $.RULE("characterSpecifier", () => {
      $.OR([
        { ALT: () => $.CONSUME2(Token.Character) },
        {
          ALT: () => {
            $.SUBRULE($.positionSpecifier);
            $.OPTION(() => $.CONSUME(Token.Character));
            $.OPTION2(() => $.CONSUME(Token.IncludesDefeated));
          },
        },
      ]);
    });
    $.RULE("whoClause", () => {
      $.OPTION(() => $.CONSUME(Token.All));
      $.OPTION2(() => {
        $.OR([
          { ALT: () => $.CONSUME(Token.My) },
          { ALT: () => $.CONSUME(Token.Opp) },
        ]);
      });
    });
    $.RULE("atomicQuery", () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.whoClause);
            $.SUBRULE($.typeSpecifier);
            $.OPTION(() => $.SUBRULE($.withClause));
          },
        },
        {
          ALT: () => {
            $.CONSUME(Token.LParen);
            $.SUBRULE($.orQuery);
            $.CONSUME(Token.RParen);
          },
        },
      ]);
    });
    $.RULE("prefixQuery", () => {
      $.MANY(() =>
        $.OR([
          { ALT: () => $.CONSUME(Token.Not) },
          { ALT: () => $.CONSUME(Token.RecentFrom) },
        ]),
      );
      $.SUBRULE($.atomicQuery);
    });
    $.RULE("entityRelationOperator", () => {
      $.OR([
        { ALT: () => $.CONSUME(Token.Has) },
        { ALT: () => $.CONSUME(Token.At) },
      ]);
    });
    $.RULE("relationQuery", () => {
      $.SUBRULE($.prefixQuery);
      $.MANY(() => {
        $.SUBRULE($.entityRelationOperator);
        $.SUBRULE2($.prefixQuery);
      });
    });
    $.RULE("andQuery", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: Token.And,
        DEF: () => $.SUBRULE($.relationQuery),
      });
    });
    $.RULE("orQuery", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: Token.Or,
        DEF: () => $.SUBRULE($.andQuery),
      });
    });

    $.RULE("atomicExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.varname) },
        {
          ALT: () => {
            $.CONSUME(Token.LParen);
            $.SUBRULE($.expression);
            $.CONSUME(Token.RParen);
          },
        },
      ]);
    });
    $.RULE("multiplicativeOperator", () => {
      $.OR([
        { ALT: () => $.CONSUME(Token.Multiply) },
        { ALT: () => $.CONSUME(Token.Divide) },
      ]);
    })
    $.RULE("additiveOperator", () => {
      $.OR([
        { ALT: () => $.CONSUME(Token.Plus) },
        { ALT: () => $.CONSUME(Token.Minus) },
      ]);
    })
    $.RULE("multiplicativeExpression", () => {
      $.SUBRULE($.atomicExpression);
      $.MANY(() => {
        $.SUBRULE($.multiplicativeOperator);
        $.SUBRULE2($.atomicExpression);
      });
    });
    $.RULE("additiveExpression", () => {
      $.SUBRULE($.multiplicativeExpression);
      $.MANY(() => {
        $.SUBRULE($.additiveOperator);
        $.SUBRULE2($.multiplicativeExpression);
      });
    });
    $.RULE("expression", () => {
      $.SUBRULE($.additiveExpression);
    });
    $.RULE("orderByClause", () => {
      $.CONSUME(Token.OrderBy);
      // $.CONSUME(Token.LParen);
      $.AT_LEAST_ONE_SEP({
        SEP: Token.Comma,
        DEF: () => $.SUBRULE($.expression),
      });
      // $.CONSUME(Token.RParen);
    });
    this.performSelfAnalysis();
  }
}
