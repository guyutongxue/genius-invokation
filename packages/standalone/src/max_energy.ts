import data from "@gi-tcg/data";

export const maxEnergyData = Object.fromEntries([...data.character.values()].map((c) => [c.id, c.constants.maxEnergy]));
