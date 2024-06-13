/* @refresh reload */

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

import { render } from "solid-js/web";

import "./index.css";
import "@una-ui/preset/una.css";
import "@unocss/reset/tailwind-compat.css";

import App from "./App";
import axios from "axios";
import { BACKEND_BASE_URL } from "./config";

axios.defaults.baseURL = BACKEND_BASE_URL;
axios.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

const app = document.getElementById("app")!;

render(() => <App />, app);
