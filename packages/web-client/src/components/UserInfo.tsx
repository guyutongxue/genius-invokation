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

import { Show, createResource } from "solid-js";
import { UserInfo as UserInfoT } from "../App";
import { getGravatarUrl } from "../utils";

export interface UserInfoProps extends Exclude<UserInfoT, "avatarUrl"> {
  editable: boolean;
}

export function UserInfo(props: UserInfoProps) {
  const [avatarUrl] = createResource(() => getGravatarUrl(props.email, 200));
  return (
    <div class="flex flex-row container gap-4">
      <div class="flex flex-col w-45">
        <a href="https://gravatar.com/profile" target="_blank" title="修改头像">
          <div class="rounded-full w-40 h-40 b-solid b-1 b-gray-200 flex items-center justify-center mb-3">
            <Show when={avatarUrl()}>
              <img src={avatarUrl()} class="w-36 h-36 [clip-path:circle()]" />
            </Show>
          </div>
        </a>
        <p class="text-gray-500">
          您可以在{" "}
          <a href="https://gravatar.com/profile" target="_blank" class="text-blue hover:underline">
            gravatar.com
          </a>{" "}
          修改您的头像。
        </p>
      </div>
      <div class="flex flex-col items-start">
        <div class="flex items-end gap-2">
          <h2 class="text-2xl font-bold">用户信息</h2>
          <span class="text-gray-4 text-sm font-300">ID: {props.id}</span>
        </div>
        User {props.name}
        <Show when={props.editable}>
          <button class="btn btn-soft-green text-1em gap-0.5em">提交</button>
        </Show>
      </div>
    </div>
  );
}
