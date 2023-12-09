import data from "@gi-tcg/data";

export const maxEnergyData: Record<number, number> = Object.fromEntries([...data.character.values()].map((c) => [c.id, c.constants.maxEnergy]));
export const visibleVarData: Record<number, string | null> = Object.fromEntries([...data.entity.values()].map((c) => [c.id, c.visibleVarName]));
