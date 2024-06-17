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

import { A, Route, Router } from "@solidjs/router";
import { Accessor, createContext, createSignal, onMount, useContext } from "solid-js";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Header } from "./components/Header";
import axios from "axios";
import { getGravatarUrl } from "./utils";
import { User } from "./pages/User";
import { Decks } from "./pages/Decks";
import { NewDeck } from "./pages/NewDeck";

export interface UserInfo {
  id: number;
  email: string;
  name: string | null;
  rank: number;
  createdAt: string;
  avatarUrl: string;
}

export interface UserContextValue {
  user: Accessor<UserInfo | null>;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>();
export const useUserContext = () => useContext(UserContext)!;

function App() {
  const [user, setUser] = createSignal<UserInfo | null>(null);
  const refresh = async () => {
    try {
      const { data } = await axios.get("users/me");
      data.avatarUrl = await getGravatarUrl(data.email);
      setUser(data);
      console.log(data);
    } catch {
      setUser(null);
    }
  };
  const userContextValue = {
    user,
    refresh,
  };

  onMount(() => {
    refresh();
  });
  return (
    <UserContext.Provider value={userContextValue}>
      <div class="h-full w-full flex flex-row">
        <Router base={import.meta.env.BASE_URL}>
          <Route path="/" component={Home} />
          <Route path="/user/:id" component={User} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/decks" component={Decks} />
          <Route path="/decks/new" component={NewDeck} />
        </Router>
      </div>
    </UserContext.Provider>
  );
}

export default App;
