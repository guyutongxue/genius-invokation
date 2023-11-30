function costMap(s: string) {
  if (s === "GCG_COST_ENERGY") return "Energy";
  return s[14] + s.substring(15).toLowerCase();
}

export function isLegend(playcost: any) {
  return playcost.find((c: any) => c.costtype === "GCG_COST_LEGEND");
}

export function getCostCode(playCost: any): string {
  const playCost2 = playCost as any[];
  let resultArr = playCost2
    .filter((c) => c.costtype !== "GCG_COST_LEGEND")
    .map((c) => `.cost${costMap(c.costtype)}(${c.count})`);
  if (isLegend(playCost2)) {
    resultArr.push(".legend()");
  }
  if (resultArr.length > 0) {
    return `\n  ${resultArr.join("\n  ")}`;
  } else {
    return "";
  }
}
