import { CardPath } from "./entity.js";
import { PlayCardContextImpl, mixinExt } from "./context.js";
import { PlayCardTargetPath } from "./action.js";
import { Store } from "./store.js";

export function playCard(store: Store, path: CardPath, targets: PlayCardTargetPath[]) {
  const cardCtx = new PlayCardContextImpl(store, path, path.who, path, targets);
  return path.info.action(mixinExt(store, path, cardCtx));
}
