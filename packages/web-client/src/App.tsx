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

import { Route, Router } from "@solidjs/router";
import {
  createContext,
  createResource,
  Resource,
  useContext,
} from "solid-js";
import { Home } from "./pages/Home";
import axios from "axios";
import { User } from "./pages/User";
import { Decks } from "./pages/Decks";
import { EditDeck } from "./pages/EditDeck";
import { Room } from "./pages/Room";
import { NotFound } from "./pages/NotFound";

export interface UserInfo {
  id: number;
  login: string;
  name?: string;
  avatarUrl: string;
}

export interface UserContextValue {
  user: Resource<UserInfo | null>;
  readonly refresh: () => unknown;
}

const UserContext = createContext<UserContextValue>();
export const useUserContext = () => useContext(UserContext)!;

export interface VersionContextValue {
  versionInfo: Resource<any>;
}

const VersionContext = createContext<VersionContextValue>();
export const useVersionContext = () => useContext(VersionContext)!;

function App() {
  const [user, { refetch }] = createResource<UserInfo | null>(async () => {
    try {
      const { data } = await axios.get<UserInfo>("users/me");
      data.name = data.name ?? data.login;
      return data;
    } catch (e) {
      return null;
    }
  });
  const [versionInfo] = createResource(() =>
    axios.get("version").then((res) => res.data),
  );
  const userContextValue: UserContextValue = {
    user,
    refresh: refetch,
  };
  const versionContextValue: VersionContextValue = {
    versionInfo,
  };
  return (
    <UserContext.Provider value={userContextValue}>
      <VersionContext.Provider value={versionContextValue}>
        <div class="h-full w-full flex flex-row">
          <Router base={import.meta.env.BASE_URL}>
            <Route path="/" component={Home} />
            <Route path="/user/:id" component={User} />
            <Route path="/decks/:id" component={EditDeck} />
            <Route path="/decks" component={Decks} />
            <Route path="/rooms/:code" component={Room} />
            <Route path="*" component={NotFound} />
          </Router>
        </div>
      </VersionContext.Provider>
    </UserContext.Provider>
  );
}

export default App;
