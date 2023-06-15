import { Card, CardWith, Context, ICard, ICharacter, IStatus, Status, UseCardContext, register } from "@jenshin-tcg";

function commonFood(objectId: number, how: (c: Context, character: ICharacter) => void) {
  return @Card({
    objectId,
    type: "event",
    tags: ["food"],
    with: [{
      type: "character",
      who: 0,
    }]
  }) class implements ICard {
    disabledWith(c: CardWith) {
      return c.type === "character" && c.character.hasStatus(303300);
    }
    onUse(c: UseCardContext) {
      for (const w of c.with) {
        if (w.type === "character") {
          how(c, w.character);
          c.createStatus(Satiated, [], w.character.toTarget());
        }
      }
    }
  }
}

@Status({
  objectId: 303300,
  duration: 1,
})
class Satiated implements IStatus { 
}

const SweetMadame = commonFood(333005, (c, ch) => { c.heal(1, ch.toTarget()) });



register(Satiated);
