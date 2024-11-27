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

#include "game.h"

namespace gitcg {
inline namespace v1_0 {

Game::Game(Environment* environment, int game_id,
           v8::Local<v8::Object> instance)
    : Object{environment, instance}, game_id{game_id} {}

State& Game::get_state() {
  auto isolate = env->get_isolate();
  auto handle_scope = v8::HandleScope(isolate);
  auto context = env->get_context();
  auto instance = this->instance.Get(isolate);
  auto state_obj = this->get<v8::Object>("state");
  auto state_obj_ptr = std::make_unique<State>(env, state_obj);
  return *env->own_object(std::move(state_obj_ptr));
}

void Game::step() {
  std::printf("WE ARE STEPPING!\n");
  auto isolate = env->get_isolate();
  auto handle_scope = v8::HandleScope(isolate);
  auto context = env->get_context();
  auto instance = this->instance.Get(isolate);
  auto test_fn = this->get<v8::Function>("step");
  auto trycatch = v8::TryCatch{isolate};
  auto call_result_maybe = test_fn->Call(context, instance, 0, nullptr);
  env->check_trycatch(trycatch);
  auto call_result = call_result_maybe.ToLocalChecked();
  if (!call_result->IsPromise()) {
    throw std::runtime_error("unreachable: step() should return a Promise");
  }
  auto promise = call_result.As<v8::Promise>();
  switch (promise->State()) {
    case v8::Promise::PromiseState::kFulfilled: {
      return;
    }
    case v8::Promise::PromiseState::kPending: {
      throw std::runtime_error(
          "unreachable: step() returned a promise still pending. A microtask "
          "bug?");
    }
    case v8::Promise::PromiseState::kRejected: {
      auto rejection = promise->Result();
      auto message = v8::Exception::CreateMessage(isolate, rejection);
      auto exception_str = v8::String::Utf8Value{isolate, message->Get()};
      throw std::runtime_error{*exception_str};
    }
  }
}

}  // namespace v1_0
}  // namespace gitcg
