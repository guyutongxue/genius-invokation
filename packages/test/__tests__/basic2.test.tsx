import { Character, ref, State } from "@/main";
import { Venti } from "@gi-tcg/data/internal/characters/anemo/venti";
import { Diluc } from "@gi-tcg/data/internal/characters/pyro/diluc";

const target = ref();

const state = <State>
  <Character opp active ref={target} />
  <Character my active def={Venti} />
</State>

const ctx = setup({
  myCharacters: [Venti, _, _],
  oppCharacters: [target, _, _],
});
