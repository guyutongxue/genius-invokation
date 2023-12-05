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

test("semantic check", () => {
  const result = toAst("my characters order by maxHealth - health", getter);
  expect(result.orderBy[0].toString()).toInclude(
    `return ($.variable["health"] ?? $.definition.constant["health"]) - ($.variable["maxHealth"] ?? $.definition.constant["maxHealth"]);`,
  );
});
