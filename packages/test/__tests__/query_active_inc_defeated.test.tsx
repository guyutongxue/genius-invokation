import { ref, setup, Character, State, Status } from "#test";
import { test } from "bun:test";

test("basic", async () => {
  const c = setup(
    <State>
      <Character my active alive={0} />
    </State>,
  );
  c.expect("my active").toBeArrayOfSize(0);
  c.expect("my active includes defeated").toBeArrayOfSize(1);
});
