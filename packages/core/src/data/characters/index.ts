import { CharacterConstructor } from "../../context/decorators";
import Bennett from "./bennett";
import Keqing from "./keqing";
import Klee from "./klee";

const characterList: Record<number, unknown> = {
  10008: Bennett,
  10013: Keqing,
  10032: Klee,
};

export default characterList as Record<number, CharacterConstructor>;
