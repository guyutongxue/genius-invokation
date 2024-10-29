import { Character, ref, setup, State, Status } from "@/main";
import { Venti } from "@gi-tcg/data/internal/characters/anemo/venti";
import { Satiated } from "@gi-tcg/data/internal/commons";

const target = ref();

const ctx = setup(
  <State>
    <Character opp active ref={target}>
      <Status def={Satiated} />
    </Character>
    <Character my active def={Venti} />
  </State>,
);
