import { CstParser } from "chevrotain";
import * as Token from "./lexer";
import { allTokens, QueryLexer } from "./lexer";

export class QueryParser extends CstParser {
  constructor() {
    super(allTokens);
    const $ = this as this & Record<any, any>;
    $.RULE("query", () => {
      $.SUBRULE($.orQuery);
    });
    $.RULE("tagClause", () => {
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
        $.CONSUME(Token.LParen);
        $.CONSUME(Token.Definition);
        $.CONSUME(Token.RParen);
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
    $.RULE("variableClause", () => {
      $.SUBRULE($.varname);
      $.SUBRULE($.relativeOperator);
      $.SUBRULE2($.varname);
    });
    $.RULE("withRule", () => {
      $.OPTION(() => $.CONSUME(Token.Not));
      $.CONSUME(Token.With),
        $.OR([
          { ALT: () => $.SUBRULE($.variableClause) },
          { ALT: () => $.SUBRULE($.tagClause) },
          { ALT: () => $.SUBRULE($.idClause) },
        ]);
    });
    $.RULE("idClause", () => {
      $.OPTION(() => $.CONSUME(Token.Definition));
      $.CONSUME(Token.Id);
      $.CONSUME(Token.Equal);
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
    $.RULE("whoRule", () => {
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
            $.SUBRULE($.whoRule);
            $.SUBRULE($.typeSpecifier);
            $.OPTION(() => $.SUBRULE($.withRule));
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
        ])
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

    this.performSelfAnalysis();
  }
}
