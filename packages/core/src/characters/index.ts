import { CharacterConstructor } from "../context/decorators";
import Bennett from "./bennett";
import Keqing from "./keqing";
import Klee from "./klee";

const characterList: Record<number, unknown> = {
  0: Bennett,
  1: Keqing,
  2: Klee,
};

export default characterList as Record<number, CharacterConstructor>;
