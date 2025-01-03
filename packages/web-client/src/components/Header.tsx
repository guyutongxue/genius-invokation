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
import { IS_BETA } from "@gi-tcg/config";
import { getAvatarUrl } from "../utils";

export function Header() {
  const navigate = useNavigate();
  const { user, refresh } = useUserContext();
  const logout = async () => {
    localStorage.removeItem("guestName");
    localStorage.removeItem("accessToken");
    await refresh();
    navigate("/");
  };
  return (
    <header class="fixed top-0 left-0 w-full flex flex-row h-16 bg-white z-200 px-4 shadow-md items-center gap-4">
      <div class="flex-grow flex items-end gap-2">
        <h1 class="text-xl line-height-none font-bold ">
          <A href="/">七圣召唤模拟对战平台</A>
        </h1>
        <span class="text-10px badge badge-soft-warning">Public Beta</span>
        <Show when={IS_BETA}>
          <span class="text-10px badge badge-soft-error">
            Incl. unreleased data
          </span>
        </Show>
      </div>
      <Show when={user()}>
        {(info) => (
          <>
            <Show when={!info().isGuest}>
              <A href={`/user/${info().id}`}>
                <div class="rounded-full w-12 h-12 b-solid b-1 b-gray-200 flex items-center justify-center">
                  <img
                    src={getAvatarUrl(info().id as number)}
                    class="w-10 h-10 [clip-path:circle()]"
                  />
                </div>
              </A>
            </Show>
            <button
              class="btn btn-outline-red text-1em gap-0.5em"
              onClick={logout}
            >
              退出登录
            </button>
          </>
        )}
      </Show>
    </header>
  );
}
