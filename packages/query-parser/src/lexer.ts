import { Lexer, createToken } from "chevrotain";

export const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-z]\w*/ });

export const My = createToken({
  name: "My",
  pattern: /my/i,
  longer_alt: Identifier,
});
export const Opp = createToken({
  name: "Opp",
  pattern: /opp/i,
  longer_alt: Identifier,
});
export const All = createToken({
  name: "All",
  pattern: /all/i,
  longer_alt: Identifier,
});
export const Character = createToken({
  name: "Character",
  pattern: /characters?/i,
  longer_alt: Identifier,
});
export const Summon = createToken({
  name: "Summon",
  pattern: /summons?/i,
  longer_alt: Identifier,
});
export const Combat = createToken({
  name: "Combat",
  pattern: /combat/i,
  longer_alt: Identifier,
});
export const Support = createToken({
  name: "Support",
  pattern: /supports?/i,
  longer_alt: Identifier,
});
export const Status = createToken({
  name: "Status",
  pattern: /status(es)?/i,
  longer_alt: Identifier,
});
export const Equipment = createToken({
  name: "Equipment",
  pattern: /equipments?/i,
  longer_alt: Identifier,
});
export const Any = createToken({
  name: "Any",
  pattern: /any/i,
  longer_alt: Identifier,
});

export const Active = createToken({
  name: "Active",
  pattern: /active/i,
  longer_alt: Identifier,
});
export const Next = createToken({
  name: "Next",
  pattern: /next/i,
  longer_alt: Identifier,
});
export const Prev = createToken({
  name: "Prev",
  pattern: /prev/i,
  longer_alt: Identifier,
});
export const Standby = createToken({
  name: "Standby",
  pattern: /standby/i,
  longer_alt: Identifier,
});

export const IncludesDefeated = createToken({
  name: "IncludesDefeated",
  pattern: /includes\s+defeated/i,
});
export const With = createToken({
  name: "With",
  pattern: /with/i,
  longer_alt: Identifier,
});
export const Tag = createToken({
  name: "Tag",
  pattern: /tag/i,
  longer_alt: Identifier,
});
export const Id = createToken({
  name: "Id",
  pattern: /id/i,
  longer_alt: Identifier,
});
export const Definition = createToken({
  name: "Definition",
  pattern: /definition/i,
  longer_alt: Identifier,
});
export const At = createToken({
  name: "At",
  pattern: /at/i,
  longer_alt: Identifier,
});
export const Has = createToken({
  name: "Has",
  pattern: /has/i,
  longer_alt: Identifier,
});
export const RecentFrom = createToken({
  name: "RecentFrom",
  pattern: /recent\s+opp\s+from/i,
});

export const OrderBy = createToken({
  name: "OrderBy",
  pattern: /order\s+by/i,
  longer_alt: Identifier,
});

export const Not = createToken({
  name: "Not",
  pattern: /not/i,
  longer_alt: Identifier,
});
export const And = createToken({
  name: "And",
  pattern: /and/i,
  longer_alt: Identifier,
});
export const Or = createToken({
  name: "Or",
  pattern: /or/i,
  longer_alt: Identifier,
});
export const As = createToken({
  name: "As",
  pattern: /as/i,
  longer_alt: Identifier,
});

export const IntegerLiteral = createToken({
  name: "IntegerLiteral",
  pattern: /0|-?[1-9]\d*/,
});
export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
});

export const GreaterEqualThan = createToken({
  name: "GreaterEqualThan",
  pattern: />=/,
});
export const LessEqualThan = createToken({ name: "LessEqualThan", pattern: /<=/ });
export const NotEqual = createToken({ name: "NotEqual", pattern: /!=/ });

export const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ });
export const LessThan = createToken({ name: "LessThan", pattern: /</ });
export const Equal = createToken({ name: "Equal", pattern: /=/ });

export const Plus = createToken({ name: "Add", pattern: /\+/ });
export const Minus = createToken({ name: "Subtract", pattern: /-/ });
export const Multiply = createToken({ name: "Multiply", pattern: /\*/ });
export const Divide = createToken({ name: "Divide", pattern: /\// });

export const LParen = createToken({ name: "LParen", pattern: /\(/ });
export const RParen = createToken({ name: "RParen", pattern: /\)/ });
export const Comma = createToken({ name: "Comma", pattern: /,/ });

export const Whitespace = createToken({
  name: "Whitespace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

export const allTokens = [
  Whitespace,
  // keywords
  My,
  Opp,
  All,
  Character,
  Summon,
  Combat,
  Support,
  Status,
  Equipment,
  Any,
  Active,
  Next,
  Prev,
  Standby,
  IncludesDefeated,
  With,
  Tag,
  Id,
  Definition,
  RecentFrom,
  OrderBy,
  At,
  Has,
  Not,
  And,
  Or,
  As,
  // Other
  IntegerLiteral,
  StringLiteral,
  Identifier,
  // dual-ch operators
  GreaterEqualThan,
  LessEqualThan,
  NotEqual,
  // single-ch operators
  GreaterThan,
  LessThan,
  Equal,
  LParen,
  RParen,
  Comma,
  Plus,
  Minus,
  Multiply,
  Divide
];

export const QueryLexer = new Lexer(allTokens);
