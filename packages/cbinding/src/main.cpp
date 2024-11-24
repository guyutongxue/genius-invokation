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

#include <libplatform/libplatform.h>
#include <v8.h>

#include <cstring>

#include "environment.h"
#include "game.h"

int main(int argc, char** argv) {
  gitcg::initialize();
  {
    auto& env = gitcg::Environment::create();
    std::printf("11111\n");
    auto game = env.create_game();
    game->set_rpc_handler(0, [](void* player_data, const char* request_data,
                                std::size_t request_len, char* response_data,
                                std::size_t* response_len) noexcept {
      for (std::size_t i = 0; i < request_len; ++i) {
        std::printf("%d ", static_cast<int>(request_data[i]));
      }
      std::printf("RPC handler called\n");
      std::memcpy(response_data, "Hello, I'm response!", 20);
      *response_len = 20;
    });
    game->step();
    std::printf("22222\n");
    gitcg::Environment::dispose();
  }
  gitcg::cleanup();
}