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
#ifndef GITCG_ENVIRONMENT_H
#define GITCG_ENVIRONMENT_H

#include <libplatform/libplatform.h>
#include <v8.h>

#include "state_createparam.h"
#include "state.h"
#include "game.h"

namespace gitcg {
inline namespace v1_0 {

extern const char JS_CODE[];

void initialize();

void cleanup();

class Environment {
  std::unique_ptr<v8::Platform> platform;
  v8::Isolate::CreateParams create_params;
  v8::Isolate* isolate;
  v8::Persistent<v8::Context> context;

  std::unordered_set<std::unique_ptr<Object>> owning_objects;
  std::unordered_map<int, Game*> games;
  int next_game_id = 0;

  friend class StateCreateParam;
  friend class State;
  friend class Game;

  template <std::size_t N>
  v8::Local<v8::String> v8_string(const char (&str)[N]) {
    return v8::String::NewFromUtf8Literal(isolate, str);
  }
  void check_trycatch(v8::TryCatch& trycatch);
  void check_promise(v8::Local<v8::Promise> promise);

public:
  v8::Persistent<v8::Function> game_ctor; // temp workaround
  Environment();
  ~Environment();
  Environment(const Environment&) = delete;
  Environment& operator=(const Environment&) = delete;

  static Environment& create();
  static Environment& get_instance();
  static void dispose();

  Game& new_game(const State& state);
  Game* get_game(int game_id) noexcept;

  StateCreateParam& new_state_createparam();

  State& state_from_createparam(const StateCreateParam& param);
  State& state_from_json(const char* json);
  char* state_to_json(const State& state);

  v8::Isolate* get_isolate() {
    return isolate;
  }

  /**
   * Get v8::Local<v8::Context> of current execution context.
   * MUST be called under a handle_scope.
   */
  v8::Local<v8::Context> get_context() const {
    return context.Get(isolate);
  }
};

}  // namespace v1_0
}  // namespace gitcg

#endif
