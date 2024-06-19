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
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import type { JSX } from "solid-js";
import { Header } from "../components/Header";

export interface LayoutProps {
  children?: JSX.Element;
}

export function Layout(props: LayoutProps) {
  return (
    <div class="w-full h-full flex flex-col">
      <Header />
      <main class="min-h-0 flex-grow w-full p-8 mt-16">
      {props.children}
      </main>
    </div>
  );
}
