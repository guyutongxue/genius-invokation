import { createCard, createStatus } from "../../src/builders";


const Satiated = createStatus(303300)
  .withDuration(1)
  .build()

createCard(333002, ["character"])
  .costVoid(2)
  .doWith(function (c) {
    c.createStatus(Satiated, this[0].asTarget())
    c.createStatus(AdeptusTemptationStatus, this[0].asTarget())
  })
const AdeptusTemptationStatus = createStatus(333002)
  .on("useSkill", (c) => {
    if (c.info.type === "burst" && c.damage) {
      c.damage.addDamage(3);
      return true;
    }
    return false;
  })
  .build();
