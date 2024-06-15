import { test, expect } from "bun:test";
import { WithVersionInfo, findVersion } from "../base/version";

test("find version", () => {
  const versions: WithVersionInfo[] = [
    {
      id: 999,
      __definition: "test",
      version: {
        predicate: "since",
        version: "v3.5.0"
      },
    },
    {
      id: 400,
      __definition: "test",
      version: {
        predicate: "until",
        version: "v4.0.0"
      }
    },
    {
      id: 410,
      __definition: "test",
      version: {
        predicate: "until",
        version: "v4.1.0"
      }
    }
  ];
  expect(() => findVersion(versions, "v3.3.0")).toThrowError();
  expect(findVersion(versions, "v3.5.0").id).toBe(400);
  expect(findVersion(versions, "v4.0.0").id).toBe(400);
  expect(findVersion(versions, "v4.1.0").id).toBe(410);
  expect(findVersion(versions, "v4.2.0").id).toBe(999);
})
