import { ref, setup, State, Character } from "#test";
import { test } from "bun:test";

test("query: recent opp from", async () => {
  const c = setup(
    <State>
      <Character opp v={{ expected: 1 }} />
      <Character opp />
      <Character opp alive={0} />

      <Character my />
      <Character my />
      <Character my active />
    </State>,
  );
  c.expect("recent opp from my active").toHaveVariable("expected", 1);
});
