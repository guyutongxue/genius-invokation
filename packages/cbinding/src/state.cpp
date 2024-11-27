#include "state.h"

#include <cstdlib>
#include <cstring>

namespace gitcg {
inline namespace v1_0 {

char* State::to_json() const {
  auto isolate = env->get_isolate();
  auto handle_scope = v8::HandleScope(isolate);
  auto context = env->get_context();
  auto instance = this->get_instance();
  auto json_fn = this->get<v8::Function>("toJson");
  auto trycatch = v8::TryCatch{isolate};
  auto json_value_maybe = json_fn->Call(context, instance, 0, nullptr);
  env->check_trycatch(trycatch);
  auto json_value = json_value_maybe.ToLocalChecked();
  auto json_str = v8::String::Utf8Value{isolate, json_value};
  auto size = json_str.length();
  auto buf = static_cast<char*>(std::malloc(size));
  std::memcpy(buf, *json_str, size);
  return buf;
}

}
}
