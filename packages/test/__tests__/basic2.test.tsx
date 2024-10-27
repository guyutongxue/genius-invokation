import { setup, _, ref } from "@/main";
import { Venti } from "@gi-tcg/data/internal/characters/anemo/venti";
import { Diluc } from "@gi-tcg/data/internal/characters/pyro/diluc";

const target = ref(Diluc);

const a = <div></div>

const ctx = setup({
  myCharacters: [Venti, _, _],
  oppCharacters: [target, _, _],
});
