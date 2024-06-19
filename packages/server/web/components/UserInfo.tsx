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

import { For, Show, createResource, createSignal, onMount } from "solid-js";
import { type UserInfo as UserInfoT, useUserContext } from "../App";
import { copyToClipboard, getGravatarUrl } from "../utils";
import axios, { AxiosError } from "axios";
import { A } from "@solidjs/router";

export interface UserInfoProps extends Exclude<UserInfoT, "avatarUrl"> {
  editable: boolean;
  onUpdate?: () => void;
}

export function UserInfo(props: UserInfoProps) {
  const [avatarUrl] = createResource(() => getGravatarUrl(props.email, 200));
  const [invitationCodes, setInvitationCodes] = createSignal<any[]>([]);
  const [editingPassword, setEditingPassword] = createSignal(false);
  const [editingName, setEditingName] = createSignal(false);
  const [nameInputEl, setNameInputEl] = createSignal<HTMLInputElement>();

  const refreshInvitationCodes = async () => {
    const { data } = await axios.get("invitationCodes");
    setInvitationCodes(data);
  };

  const createInvitationCode = async () => {
    await axios.post("invitationCodes");
    refreshInvitationCodes();
  };

  const deleteInvitationCode = async (id: number) => {
    await axios.delete(`invitationCodes/${id}`);
    refreshInvitationCodes();
  };

  onMount(() => {
    if (props.rank === 0) {
      refreshInvitationCodes();
    }
  });

  const startEditingName = () => {
    setEditingName(true);
    const nameInput = nameInputEl();
    if (nameInput) {
      nameInput.value = props.name ?? "";
      nameInput.focus();
    }
  };

  const submitName = async (e: SubmitEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: formData.get("name") as string,
    };
    try {
      await axios.put("users/me/name", payload);
      setEditingName(false);
      props.onUpdate?.();
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      }
    }
  };
  const submitPassword = async (e: SubmitEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = {
      password: formData.get("password") as string,
    };
    try {
      await axios.put("users/me/password", payload);
      setEditingPassword(false);
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      }
    }
  };

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
          <a
            href="https://gravatar.com/profile"
            target="_blank"
            class="text-blue hover:underline"
          >
            gravatar.com
          </a>{" "}
          修改您的头像。
        </p>
      </div>
      <div class="flex-grow flex flex-col items-start">
        <div class="flex items-end gap-2 mb-5">
          <h2 class="text-2xl font-bold">用户信息</h2>
          <span class="text-gray-4 text-sm font-300">ID: {props.id}</span>
        </div>
        <dl class="flex flex-row gap-4 items-center mb-2">
          <dt class="font-bold">邮箱</dt>
          <dd class="font-mono">{props.email}</dd>
        </dl>
        <dl class="flex flex-row gap-4 items-center mb-2">
          <dt class="font-bold">昵称</dt>
          <dd class="flex flex-row gap-4 items-center h-8">
            <Show
              when={editingName()}
              fallback={
                <>
                  {props.name ?? <em class="text-gray-4">未设置</em>}
                  <Show when={props.editable}>
                    <button
                      class="btn btn-ghost"
                      onClick={startEditingName}
                    >
                      <i class="i-mdi-pencil-outline" />
                    </button>
                  </Show>
                </>
              }
            >
              <form
                class="flex flex-row gap-2 items-center w-full"
                onSubmit={submitName}
              >
                <input
                  class="input input-outline max-w-80"
                  type="input"
                  name="name"
                  maxLength={32}
                  ref={setNameInputEl}
                  onFocus={(e) => e.target.select()}
                />
                <button
                  type="submit"
                  class="flex-shrink-0 btn btn-ghost-green"
                >
                  提交
                </button>
                <button
                  type="button"
                  class="flex-shrink-0 btn btn-ghost-red"
                  onClick={() => setEditingName(false)}
                >
                  取消
                </button>
              </form>
            </Show>
          </dd>
        </dl>
        <Show when={props.rank === 0}>
          <hr class="h-1 w-full text-gray-4 my-4" />
          <div class="flex flex-row gap-2 mb-2">
            <button
              class="btn btn-outline-green"
              onClick={createInvitationCode}
            >
              <i class="i-mdi-plus" />
              新建
            </button>
            <button class="btn btn-outline" onClick={refreshInvitationCodes}>
              <i class="i-mdi-refresh" />
              刷新
            </button>
          </div>
          <table class="[&_th,&_td]:py-1 [&_th,&_td]:px-2">
            <thead>
              <tr>
                <th class="font-bold">邀请码</th>
                <th class="font-bold">创建时间</th>
                <th class="font-bold">操作</th>
              </tr>
            </thead>
            <tbody>
              <For each={invitationCodes()}>
                {(item) => (
                  <tr>
                    <td>
                      <span class="font-mono" title={item.id}>
                        {item.code}
                      </span>
                      <button
                        class="btn btn-ghost"
                        onClick={() => copyToClipboard(item.code)}
                      >
                        <i class="i-mdi-content-copy" />
                      </button>
                    </td>
                    <td>{item.createdAt}</td>
                    <td>
                      <button
                        class="btn btn-ghost-red"
                        onClick={() => deleteInvitationCode(item.id)}
                      >
                        <i class="i-mdi-delete" />
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
        <Show when={props.editable}>
          <hr class="h-1 w-full text-gray-4 my-4" />
          <Show
            when={editingPassword()}
            fallback={
              <button
                class="btn btn-ghost"
                onClick={() => setEditingPassword(true)}
              >
                修改密码
              </button>
            }
          >
            <form
              class="flex flex-row gap-2 items-center w-full"
              onSubmit={submitPassword}
            >
              <input
                class="input input-outline max-w-80 h-8"
                type="password"
                name="password"
                minLength={6}
                maxLength={32}
                autocomplete="new-password"
                placeholder="键入新密码..."
              />
              <button
                type="submit"
                class="flex-shrink-0 btn btn-ghost-green"
              >
                提交
              </button>
              <button
                type="button"
                class="flex-shrink-0 btn btn-ghost-red"
                onClick={() => setEditingPassword(false)}
              >
                取消
              </button>
            </form>
          </Show>
          <hr class="h-1 w-full text-gray-4 my-4" />
          <A class="btn btn-ghost" href="/decks">
            我的牌组…
          </A>
        </Show>
      </div>
    </div>
  );
}
