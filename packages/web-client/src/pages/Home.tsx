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

import { Show } from "solid-js";
import { useUserContext } from "../App";
import { Layout } from "../layouts/Layout";

export function Home() {
  const { user } = useUserContext();
  return (
    <Layout>
      Home
      <Show when={user()}>
        {(user) => <div>Hello {user().name ?? user().id}!</div>}
      </Show>
    </Layout>
  );
}
