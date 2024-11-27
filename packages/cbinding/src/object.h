#pragma once
#ifndef GITCG_OBJECT_H
#define GITCG_OBJECT_H

#include <v8.h>

#include "environment.h"

namespace gitcg {
inline namespace v1_0 {

class Object {
protected:
  Environment* env;
  v8::UniquePersistent<v8::Object> instance;

  template <typename T = v8::Value, std::size_t N>
  v8::Local<T> get(const char (&key)[N]) const {
    auto isolate = env->get_isolate();
    auto escape_scope = v8::EscapableHandleScope{isolate};
    auto context = env->get_context();
    auto instance = this->get_instance();
    auto key_str = v8::String::NewFromUtf8Literal(isolate, key);
    auto trycatch = v8::TryCatch{isolate};
    v8::MaybeLocal<v8::Value> maybe_value = instance->Get(context, key_str);
    env->check_trycatch(trycatch);
    return escape_scope.Escape(maybe_value.ToLocalChecked().As<T>());
  }

public:
  Object(Environment* environment, v8::Local<v8::Object> instance);

  Object(const Object&) = delete;
  Object& operator=(const Object&) = delete;

  v8::Local<v8::Object> get_instance() const;
};

}
}

#endif
