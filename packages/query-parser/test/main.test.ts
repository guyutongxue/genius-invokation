import { test, expect } from "bun:test";

import { toAst } from "../src/index";
import { StateGetter } from "../src/ast";

const getter: StateGetter = {
  id: `$.id`,
  definitionId: `$.definition.id`,
  tags: `$.tags`,
  getConstant(name) {
    return `$.definition.constant[${JSON.stringify(name)}]`;
  },
  getVariableOrConstant(name) {
    const quoted = JSON.stringify(name);
    return `($.variable[${quoted}] ?? $.definition.constant[${quoted}])`;
  },
};

test("grammar check", () => {
  toAst("status with definition id 35001 at any with id -50000", getter);
});

test("order by semantic check", () => {
  const result = toAst("my characters order by maxHealth - health", getter);
  expect(result.orderBy[0].toString()).toInclude(
    `return ($.variable["health"] ?? $.definition.constant["health"]) - ($.variable["maxHealth"] ?? $.definition.constant["maxHealth"]);`,
  );
});

test("external rule check", () => {
  const result = toAst("@skill.caller", getter).children[0].children[0];
  expect(result.subtype === "leaf" && result.query.target.type === "external").toBe(true);
  const externalIds = (result as any).query.target.identifiers;
  expect(externalIds).toEqual(["skill", "caller"]);
})


test("limit clause", () => {
  const result = toAst("any limit 1", getter);
  expect(result.limit).toBe(1);
})

test("indirect tag rule", () => {
  const result = toAst("my characters with weapon tag of (opp active character)", getter);
})
