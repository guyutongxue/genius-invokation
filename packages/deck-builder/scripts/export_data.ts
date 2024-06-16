import { characters, actionCards } from "@gi-tcg/static-data";

const chs = characters.filter((ch) => ch.obtainable);
const acs = actionCards.filter((ac) => ac.obtainable);

const allTags = [
  ...new Set([
    ...characters.flatMap((ch) => ch.tags),
    ...actionCards.flatMap((ac) => ac.tags),
  ]),
];

const allTypes = [...new Set([...acs.map((ac) => ac.type)])];

const data = {
  T: allTags,
  Y: allTypes,
  c: chs.map((ch) => ({
    i: ch.id,
    n: ch.name,
    t: ch.tags.map((t) => allTags.indexOf(t)),
  })),
  a: actionCards
    .filter((ac) => ac.obtainable)
    .map((ac) => ({
      i: ac.id,
      y: allTypes.indexOf(ac.type),
      t: ac.tags.map((t) => allTags.indexOf(t)),
      n: ac.name,
      rc: ac.relatedCharacterId ?? void 0,
      rt: (() => {
        const t = ac.relatedCharacterTags;
        if (t.length === 0) return void 0;
        else if (t.length !== 2 || t[0] !== t[1]) {
          throw new Error(`unsupported now`);
        } else {
          return allTags.indexOf(t[0]);
        }
      })(),
    })),
};

await Bun.write(
  `${import.meta.dirname}/../src/data.json`,
  JSON.stringify(data),
);
