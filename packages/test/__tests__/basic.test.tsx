import { ref, setup, Character, State, Status } from "#test";
import {
  SkywardSonnet,
  Venti,
} from "@gi-tcg/data/internal/characters/anemo/venti";
import { Satiated } from "@gi-tcg/data/internal/commons";
import { test } from "bun:test";

test("basic", async () => {
  const target = ref();
  const c = setup(
    <State>
      <Character opp active ref={target}>
        <Status def={Satiated} />
      </Character>
      <Character my active def={Venti} />
    </State>,
  );
  await c.me.skill(SkywardSonnet);
  await c.stepToNextAction();
  c.expect("opp active").withVariable("health", 8);
});
