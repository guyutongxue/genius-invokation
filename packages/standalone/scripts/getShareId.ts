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
