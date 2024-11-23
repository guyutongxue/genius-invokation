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

void Game::test() const {
  std::printf("WE ARE IN TEST!\n");
  auto isolate = environment->get_isolate();
  auto handle_scope = v8::HandleScope(isolate);
  auto context = environment->get_context();
  auto instance = this->instance.Get(isolate);
  auto test_str = v8::String::NewFromUtf8Literal(isolate, "test");
  auto test_fn =
      instance->Get(context, test_str).ToLocalChecked().As<v8::Function>();
  auto test_result = test_fn->Call(context, instance, 0, nullptr)
                         .ToLocalChecked()
                         .As<v8::String>();
  auto test_result_str = v8::String::Utf8Value{isolate, test_result};
  std::printf("Test result: %s\n", *test_result_str);
}

}  // namespace v1_0
}  // namespace gitcg
