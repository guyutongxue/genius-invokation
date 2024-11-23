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
