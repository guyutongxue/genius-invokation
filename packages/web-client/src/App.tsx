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
import { createContext, createResource, Resource, useContext } from "solid-js";
import { Home } from "./pages/Home";
import axios from "axios";
import { User } from "./pages/User";
import { DeckInfo, Decks } from "./pages/Decks";
import { EditDeck } from "./pages/EditDeck";
import { Room } from "./pages/Room";
import { NotFound } from "./pages/NotFound";
import { Deck } from "@gi-tcg/utils";
import { GuestInfo, useGuestInfo } from "./guest";

export interface UserInfo {
  isGuest: false;
  id: number;
  login: string;
  name?: string;
}

export interface UserContextValue {
  user: Resource<UserInfo | GuestInfo | undefined>;
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
  const guestInfo = useGuestInfo();
  const [user, { refetch }] = createResource<UserInfo | GuestInfo | undefined>(
    async () => {
      let result: UserInfo | GuestInfo | undefined = void 0;
      try {
        const { data } = await axios.get<UserInfo>("users/me");
        if (data) {
          result = {
            ...data,
            isGuest: false,
            name: data.name ?? data.login,
          };
        }
      } catch {}
      if (!result) {
        result = guestInfo() ?? void 0;
      }
      return result;
    },
  );
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
