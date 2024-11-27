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

#include <cstdio>

#include "entity.h"
#include "environment.h"
#include "game.h"
#include "gitcg.h"
#include "state.h"
#include "state_createparam.h"

extern "C" {

void gitcg_initialize() {
  gitcg::initialize();
}

void gitcg_cleanup() {
  gitcg::cleanup();
}

#define PRINT_ERROR(msg) std::fprintf(stderr, "%s: %s\n", __func__, msg)

int gitcg_thread_initialize() try {
  gitcg::Environment::create();
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

void gitcg_thread_cleanup() {
  gitcg::Environment::dispose();
}

int gitcg_state_createparam_new(gitcg_state_createparam_t* param) try {
  auto& env = gitcg::Environment::get_instance();
  auto& create_param = env.new_state_createparam();
  *param = reinterpret_cast<gitcg_state_createparam_t>(&create_param);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_state_createparam_free(gitcg_state_createparam_t param) try {
  auto create_param = reinterpret_cast<gitcg::StateCreateParam*>(param);
  auto& env = gitcg::Environment::get_instance();
  env.free_object(create_param);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_state_createparam_set_attr_string(gitcg_state_createparam_t param,
                                            int key, const char* value) try {
  auto create_param = reinterpret_cast<gitcg::StateCreateParam*>(param);
  create_param->set_attribute(key, value);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_state_createparam_set_attr_int(gitcg_state_createparam_t param,
                                         int key, int value) try {
  auto create_param = reinterpret_cast<gitcg::StateCreateParam*>(param);
  create_param->set_attribute(key, value);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_state_createparam_set_deck(gitcg_state_createparam_t param, int who,
                                     int character_or_card, const int* deck,
                                     int size) try {
  auto create_param = reinterpret_cast<gitcg::StateCreateParam*>(param);
  create_param->set_deck(who, character_or_card, deck, size);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_state_new(gitcg_state_createparam_t param, gitcg_state_t* state) try {
  auto create_param = reinterpret_cast<gitcg::StateCreateParam*>(param);
  auto& env = gitcg::Environment::get_instance();
  auto& state_obj = env.state_from_createparam(*create_param);
  *state = reinterpret_cast<gitcg_state_t>(&state_obj);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_state_free(gitcg_state_t state) try {
  auto state_obj = reinterpret_cast<gitcg::State*>(state);
  auto& env = gitcg::Environment::get_instance();
  env.free_object(state_obj);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_state_from_json(const char* json, gitcg_state_t* state) try {
  auto& env = gitcg::Environment::get_instance();
  auto& state_obj = env.state_from_json(json);
  *state = reinterpret_cast<gitcg_state_t>(&state_obj);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_state_to_json(gitcg_state_t state, char** json) try {
  auto state_obj = reinterpret_cast<gitcg::State*>(state);
  *json = state_obj->to_json();
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_state_get_attr_int(gitcg_state_t state, int key, int* value) try {
  auto state_obj = reinterpret_cast<gitcg::State*>(state);
  *value = state_obj->get_attribute(key);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_state_get_dice(gitcg_state_t state, int who, int* dice) try {
  auto state_obj = reinterpret_cast<gitcg::State*>(state);
  auto dices = state_obj->get_dice(who);
  std::ranges::copy(dices, dice);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_state_query(gitcg_state_t state, int who, const char* query_string,
                      gitcg_entity_t** result, size_t* result_size) try {
  auto state_obj = reinterpret_cast<gitcg::State*>(state);
  auto entities = state_obj->query(who, query_string);
  auto buffer = static_cast<void**>(
      std::malloc(entities.size() * sizeof(gitcg_entity_t)));
  if (buffer == nullptr) {
    throw std::runtime_error("Failed to allocate memory");
  }
  std::ranges::copy(entities, buffer);
  *result_size = entities.size();
  *result = reinterpret_cast<gitcg_entity_t*>(buffer);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_entity_get_id(gitcg_entity_t entity, int* id) try {
  auto entity_obj = reinterpret_cast<gitcg::Entity*>(entity);
  *id = entity_obj->get_id();
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_entity_get_definition_id(gitcg_entity_t entity, int* definition_id) try {
  auto entity_obj = reinterpret_cast<gitcg::Entity*>(entity);
  *definition_id = entity_obj->get_definition_id();
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_entity_get_variable(gitcg_entity_t entity, const char* variable_name,
                              int* result) try {
  auto entity_obj = reinterpret_cast<gitcg::Entity*>(entity);
  *result = entity_obj->get_variable(variable_name);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_game_new(gitcg_state_t state, gitcg_game_t* game) try {
  auto state_obj = reinterpret_cast<gitcg::State*>(state);
  auto& env = gitcg::Environment::get_instance();
  auto& game_obj = env.new_game(*state_obj);
  *game = reinterpret_cast<gitcg_game_t>(&game_obj);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_game_free(gitcg_game_t game) try {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  auto& env = gitcg::Environment::get_instance();
  env.free_object(game_obj);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

void gitcg_game_set_notification_handler(gitcg_game_t game, int who,
                                         gitcg_notification_handler handler) {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  game_obj->set_notification_handler(who, handler);
}

void gitcg_game_set_rpc_handler(gitcg_game_t game, int who,
                                gitcg_rpc_handler handler) {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  game_obj->set_rpc_handler(who, handler);
}

void gitcg_game_set_io_error_handler(gitcg_game_t game, int who,
                                     gitcg_io_error_handler handler) {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  game_obj->set_io_error_handler(who, handler);
}

void* gitcg_game_set_player_data(gitcg_game_t game, int who, void* data) {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  auto old_data = game_obj->get_player_data(who);
  game_obj->set_player_data(who, data);
  return old_data;
}

int gitcg_game_set_attr_int(gitcg_game_t game, int key, int value) try {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  game_obj->set_attribute(key, value);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_game_get_attr_int(gitcg_game_t game, int key, int* value) try {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  *value = game_obj->get_attribute(key);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_game_step(gitcg_game_t game) try {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  game_obj->step();
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_game_giveup(gitcg_game_t game, int who) try {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  game_obj->giveup(who);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return 1;
}

int gitcg_game_get_state(gitcg_game_t game, gitcg_state_t* state) try {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  auto& state_obj = game_obj->get_state();
  *state = reinterpret_cast<gitcg_state_t>(&state_obj);
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_game_get_status(gitcg_game_t game, int* status) try {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  *status = game_obj->get_status();
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_game_is_resumable(gitcg_game_t game, int* resumable) try {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  *resumable = game_obj->is_resumable();
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_game_get_winner(gitcg_game_t game, int* winner) try {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  *winner = game_obj->get_winner();
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

int gitcg_game_get_error(gitcg_game_t game, char** error) try {
  auto game_obj = reinterpret_cast<gitcg::Game*>(game);
  *error = game_obj->get_error();
  return 0;
} catch (const std::exception& e) {
  PRINT_ERROR(e.what());
  return -1;
}

}  // extern "C"
