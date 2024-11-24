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

/*
deck:
{
  characters: [ 1411, 1510, 2103 ],
  cards: [
    214111, 214111, 215101, 311503,
    312004, 312004, 312025, 312025,
    312029, 312029, 321002, 321011,
    321016, 321016, 322002, 322009,
    322009, 330008, 332002, 332002,
    332004, 332004, 332005, 332005,
    332006, 332006, 332018, 332025,
    333004, 333004
  ]
}
{
  characters: [ 1609, 2203, 1608 ],
  cards: [
    216091, 216091, 222031, 312004,
    312004, 312021, 312021, 312025,
    312025, 321002, 321002, 321011,
    322025, 323004, 323004, 330005,
    331601, 331601, 332002, 332003,
    332003, 332004, 332004, 332005,
    332005, 332006, 332025, 332025,
    333003, 333003
  ]
}
*/

int main(int argc, char** argv) {
  gitcg::initialize();
  {
    auto& env = gitcg::Environment::create();
    std::printf("11111\n");

    auto create_param = env.new_state_createparam();
    create_param.set_deck(0, GITCG_SET_DECK_CHARACTERS,
                          std::vector{1411, 1510, 2103}.data(), 3);
    create_param.set_deck(
        0, GITCG_SET_DECK_CARDS,
        std::vector{214111, 214111, 215101, 311503, 312004, 312004,
                    312025, 312025, 312029, 312029, 321002, 321011,
                    321016, 321016, 322002, 322009, 322009, 330008,
                    332002, 332002, 332004, 332004, 332005, 332005,
                    332006, 332006, 332018, 332025, 333004, 333004}
            .data(),
        30);
    create_param.set_deck(1, GITCG_SET_DECK_CHARACTERS,
                          std::vector{1609, 2203, 1608}.data(), 3);
    create_param.set_deck(
        1, GITCG_SET_DECK_CARDS,
        std::vector{
            216091, 216091, 222031, 312004, 312004, 312021, 312021, 312025,
            312025, 321002, 321002, 321011, 322025, 323004, 323004, 330005,
            331601, 331601, 332002, 332003, 332003, 332004, 332004, 332005,
            332005, 332006, 332025, 332025, 333003, 333003}
            .data(),
        30);
    auto state = env.state_from_createparam(create_param);
    auto game = env.new_game();
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