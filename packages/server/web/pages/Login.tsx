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

import { createSignal } from "solid-js";
import axios, { AxiosError } from "axios";
import { useNavigate } from "@solidjs/router";
import { useUserContext } from "../App";
import { Layout } from "../layouts/Layout";

export function Login() {
  const navigate = useNavigate();
  const { refresh } = useUserContext();
  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const formData = new FormData(target);
    const payload = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };
    try {
      const { data } = await axios.post(`auth/login`, payload);
      localStorage.setItem("accessToken", data.accessToken);
      navigate("/");
      refresh();
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      } else {
        throw e;
      }
    }
  };
  return (
    <Layout>
      <div class="w-full flex flex-col items-center mt-20">
        <form onSubmit={submit} class="w-120 p-6 rounded-4 b-1 b-solid">
          <h3 class="text-xl font-bold mb-3">请登录</h3>
          <div class="grid grid-cols-[auto_1fr] gap-3 items-center mb-3">
            <label for="email">邮箱</label>
            <input
              class="input input-outline"
              id="email"
              type="email"
              name="email"
              required
              autocomplete="username"
              onInput={(e) => e.target.setAttribute("data-dirty", "")}
            />
            <label for="password">密码</label>
            <input
              class="input input-outline"
              id="password"
              type="password"
              name="password"
              minLength={6}
              maxLength={32}
              required
              autocomplete="current-password"
              onInput={(e) => e.target.setAttribute("data-dirty", "")}
            />
          </div>
          <button type="submit" class="btn btn-solid-green text-1em gap-0.5em">
            登录
          </button>
        </form>
      </div>
    </Layout>
  );
}
