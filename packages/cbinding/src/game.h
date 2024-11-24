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
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

#pragma once
#ifndef GITCG_GAME_H
#define GITCG_GAME_H

#include <v8.h>

namespace gitcg {
inline namespace v1_0 {

class Environment;

using RpcHandler = void (*)(void* player_data, const char* request_data,
                            std::size_t request_len, char* response_data,
                            std::size_t* response_len) noexcept;

using NotificationHandler = void (*)(void* player_data,
                                     const char* notification_data,
                                     std::size_t notification_len) noexcept;

class Game {
  Environment* const environment;
  const int game_id;
  v8::UniquePersistent<v8::Object> instance;

  void* player_data[2]{};
  RpcHandler rpc_handler[2]{};
  NotificationHandler notification_handler[2]{};

public:
  Game(Environment* environment, int game_id, v8::Local<v8::Object> instance);

  Game(const Game&) = delete;
  Game& operator=(const Game&) = delete;
  Game(Game&&) = default;
  Game& operator=(Game&&) = default;

  void* get_player_data(int who) const noexcept {
    return player_data[who];
  }
  void set_player_data(int who, void* data) noexcept {
    player_data[who] = data;
  }
  RpcHandler get_rpc_handler(int who) const noexcept {
    return rpc_handler[who];
  }
  void set_rpc_handler(int who, RpcHandler handler) noexcept {
    rpc_handler[who] = handler;
  }
  NotificationHandler get_notification_handler(int who) const {
    return notification_handler[who];
  }
  void set_notification_handler(int who, NotificationHandler handler) noexcept {
    notification_handler[who] = handler;
  }

  void step();
};

}  // namespace v1_0
}  // namespace gitcg

#endif