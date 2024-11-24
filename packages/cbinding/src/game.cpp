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

#include "environment.h"

namespace gitcg {
namespace v1_0 {

// namespace {
// template <typename T>
// [[gnu::always_inline]]
// v8::Local<T> to_local(v8::MaybeLocal<T> maybe_local) {
//   v8::Local<T> result;
//   if (!maybe_local.ToLocal(&result)) {
//     throw std::runtime_error("Failed to convert MaybeLocal to Local");
//   }
//   return result;
// }
// }

Game::Game(Environment* environment, int game_id,
           v8::Local<v8::Object> instance)
    : environment{environment}, game_id{game_id} {
  this->instance.Reset(environment->get_isolate(), instance);
}

void Game::step() {
  std::printf("WE ARE STEPPING!\n");
  auto isolate = environment->get_isolate();
  auto handle_scope = v8::HandleScope(isolate);
  auto context = environment->get_context();
  auto instance = this->instance.Get(isolate);
  auto test_str = v8::String::NewFromUtf8Literal(isolate, "step");
  auto test_fn =
      instance->Get(context, test_str).ToLocalChecked().As<v8::Function>();
  auto trycatch = v8::TryCatch{isolate};
  auto call_result =
      test_fn->Call(context, instance, 0, nullptr).ToLocalChecked();
  if (trycatch.HasCaught()) {
    auto exception = trycatch.Exception();
    auto message = v8::Exception::CreateMessage(isolate, exception);
    auto exception_str = v8::String::Utf8Value{isolate, message->Get()};
    throw std::runtime_error{*exception_str};
  }
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
