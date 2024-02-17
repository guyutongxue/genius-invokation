// Copyright (C) 2024 Guyutongxue
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

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
