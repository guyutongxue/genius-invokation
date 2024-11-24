#include "state_createparam.h"

#include "environment.h"

namespace gitcg {
inline namespace v1_0 {

StateCreateParam::StateCreateParam(Environment* env,
                                   v8::Local<v8::Object> instance)
    : env{env} {
  this->instance.Reset(env->get_isolate(), instance);
}

void StateCreateParam::set_attribute(int attribute, int value) {
  auto isolate = env->get_isolate();
  auto handle_scope = v8::HandleScope(isolate);
  auto v8_value = v8::Number::New(isolate, value);
  set_attribute(attribute, v8_value);
}

void StateCreateParam::set_attribute(int attribute, const std::string& value) {
  auto isolate = env->get_isolate();
  auto handle_scope = v8::HandleScope(isolate);
  auto v8_value =
      v8::String::NewFromUtf8(isolate, value.c_str()).ToLocalChecked();
  set_attribute(attribute, v8_value);
}

void StateCreateParam::set_attribute(int attribute,
                                     v8::Local<v8::Value> value) {
  auto isolate = env->get_isolate();
  auto handle_scope = v8::HandleScope(isolate);
  auto context = env->get_context();
  auto instance = this->instance.Get(isolate);
  auto trycatch = v8::TryCatch{isolate};
  auto set_attribute_str = env->v8_string("setAttribute");
  auto set_attribute_fn = instance->Get(context, set_attribute_str)
                              .ToLocalChecked()
                              .As<v8::Function>();
  v8::Local<v8::Value> args[2]{v8::Number::New(isolate, attribute), value};
  auto ret = set_attribute_fn->Call(context, instance, 2, args);
  env->check_trycatch(trycatch);
}

void StateCreateParam::set_deck(int who, int character_or_card, const int* deck,
                                int size) {
  auto isolate = env->get_isolate();
  auto handle_scope = v8::HandleScope(isolate);
  auto context = env->get_context();
  auto instance = this->instance.Get(isolate);
  auto trycatch = v8::TryCatch{isolate};
  auto set_deck_str = env->v8_string("setDeck");
  auto set_deck_fn =
      instance->Get(context, set_deck_str).ToLocalChecked().As<v8::Function>();
  auto deck_array = v8::Array::New(isolate, size);
  for (int i = 0; i < size; ++i) {
    deck_array->Set(context, i, v8::Number::New(isolate, deck[i])).Check();
  }
  v8::Local<v8::Value> args[3]{v8::Number::New(isolate, who),
                               v8::Number::New(isolate, character_or_card),
                               deck_array};
  auto ret = set_deck_fn->Call(context, instance, 3, args);
  env->check_trycatch(trycatch);
}

v8::Local<v8::Object> StateCreateParam::get_instance() const {
  return instance.Get(env->get_isolate());
}

}  // namespace v1_0
}  // namespace gitcg