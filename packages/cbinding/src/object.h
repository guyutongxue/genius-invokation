#pragma once
#ifndef GITCG_OBJECT_H
#define GITCG_OBJECT_H

#include <v8.h>

namespace gitcg {
inline namespace v1_0 {

class Environment;

class Object {
protected:
  Environment* env;
  v8::UniquePersistent<v8::Object> instance;

public:
  Object(Environment* environment, v8::Local<v8::Object> instance);

  Object(const Object&) = delete;
  Object& operator=(const Object&) = delete;

  v8::Local<v8::Object> get_instance() const;
};

}
}

#endif
