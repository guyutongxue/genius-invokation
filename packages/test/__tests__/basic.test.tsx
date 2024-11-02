import { Character, ref, setup, State, Status } from "@/main";
import {
  SkywardSonnet,
  Venti,
} from "@gi-tcg/data/internal/characters/anemo/venti";
import { Satiated } from "@gi-tcg/data/internal/commons";

import { expect, test } from "bun:test";

test("basic", async () => {
  const target = ref();
  const c = await setup(
    <State>
      <Character opp active ref={target}>
        <Status def={Satiated} />
      </Character>
      <Character my active def={Venti} />
    </State>,
  );
  await c.me.skill(SkywardSonnet);
  expect(target);
});
