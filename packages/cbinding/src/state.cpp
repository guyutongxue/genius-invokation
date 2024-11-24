#include "state.h"

#include "environment.h"

gitcg::v1_0::State::State(Environment* env, v8::Local<v8::Object> object)
    : env{env} {
  this->object.Reset(env->get_isolate(), object);
}