import { ref, setup, Character, State, Status, Card } from "#test";
import { BondOfLife } from "@gi-tcg/data/internal/commons";
import { MondstadtHashBrown } from "@gi-tcg/data/internal/cards/event/food";
import { test } from "bun:test";

test("bond of life decrease the heal", async () => {
  const active = ref();
  const c = setup(
    <State>
      <Character my health={5} ref={active}>
        <Status def={BondOfLife} usage={1} />
      </Character>
      <Card my def={MondstadtHashBrown} />
    </State>,
  );
  await c.me.card(MondstadtHashBrown, active);
  await c.stepToNextAction();
  c.expect("my active").toHaveVariable("health", 6);
});
