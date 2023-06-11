import { CharacterConstructor } from "../context/decorators";
import Bennett from "./bennett";

const characterList: Record<number, unknown> = {
  0: Bennett,
};

export default characterList as Record<number, CharacterConstructor>;
