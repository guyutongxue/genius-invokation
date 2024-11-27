#include "entity.h"

namespace gitcg {
inline namespace v1_0 {

int Entity::get_variable(const std::string& name) const {
  auto isolate = env->get_isolate();
  auto handle_scope = v8::HandleScope{isolate};
  auto context = env->get_context();
  auto instance = this->get_instance();
  auto get_variable_fn = this->get<v8::Function>("getVariable");
  auto name_value_maybe = v8::String::NewFromUtf8(isolate, name.c_str());
  v8::Local<v8::Value> name_value;
  if (!name_value_maybe.ToLocal(&name_value)) {
    throw std::runtime_error("Failed to pass variable name into v8");
  }
  auto trycatch = v8::TryCatch{isolate};
  auto result = get_variable_fn->Call(context, instance, 1, &name_value);
  env->check_trycatch(trycatch);
  return result.ToLocalChecked().As<v8::Number>()->Value();
}

}  // namespace v1_0
}  // namespace gitcg
