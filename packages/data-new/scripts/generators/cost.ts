function costMap(s: string) {
  if (s === "GCG_COST_ENERGY") return "Energy";
  return s[14] + s.substring(15).toLowerCase();
}

export function costCode(playCost: any): string {
  return playCost
    .map((c: any) => `.cost${costMap(c.costtype)}(${c.count})`)
    .join("\n  ");
}
