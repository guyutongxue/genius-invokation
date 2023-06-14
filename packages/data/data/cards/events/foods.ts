import { IStatus, Status, register } from "@jenshin-tcg";

@Status({
  objectId: 7000,
  duration: 1,
})
class Satiated implements IStatus { 
}

// @CardWithCharacter() 333005
// class SweetMadame implements ICardWithCharacter {

//   enabledCharacter() {
//     return !character.hasStatus(Satiated);
//   }

//   onPlay(c) {
//     character.heal(1);
//     character.addStatus(Satiated);
//   }
// }

register(/* SweetMadame, */ Satiated);
