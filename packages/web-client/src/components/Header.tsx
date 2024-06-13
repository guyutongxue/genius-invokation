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

import { A, useNavigate } from "@solidjs/router";
import { useUserContext } from "../App";
import { Show } from "solid-js";

export function Header() {
  const navigate = useNavigate();
  const { user, refresh } = useUserContext();
  const logout = async () => {
    localStorage.removeItem("accessToken");
    await refresh();
    navigate("/");
  };
  return (
    <header class="flex flex-row p-4 shadow-md items-center gap-4">
      <h1 class="flex-grow text-xl line-height-none font-bold flex items-center">
        <A href="/">七圣召唤模拟对战平台</A>
      </h1>
      <Show
        when={user()}
        fallback={
          <ul class="flex flex-rol gap-2">
            <li>
              <A href="/login">
                <button class="btn btn-solid-green text-1em gap-0.5em">
                  登录
                </button>
              </A>
            </li>
            <li>
              <A href="/register">
                <button class="btn btn-link-black text-1em gap-0.5em">
                  注册
                </button>
              </A>
            </li>
          </ul>
        }
      >
        <button class="btn btn-outline-red text-1em gap-0.5em" onClick={logout}>
          退出登录
        </button>
      </Show>
    </header>
  );
}
