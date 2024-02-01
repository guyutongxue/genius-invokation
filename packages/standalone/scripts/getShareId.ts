import data from "@genshin-db/tcg/src/min/data.min.json";

const {
  data: {
    English: { tcgcharactercards, tcgactioncards },
  },
} = data as any;

const map = Object.fromEntries(
  [...Object.values(tcgactioncards), ...Object.values(tcgcharactercards)].map((card: any) => [
    card.shareid,
    card.id,
  ]),
);

const path = new URL("../src/shareId.json", import.meta.url);

Bun.write(path, JSON.stringify(map));
