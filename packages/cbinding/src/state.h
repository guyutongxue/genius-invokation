#pragma once
#ifndef GITCG_STATE_H
#define GITCG_STATE_H

#include <v8.h>

namespace gitcg {
inline namespace v1_0 {

class Environment;

class State {
  Environment* env;
  v8::UniquePersistent<v8::Object> object;

public:
  State(Environment* env, v8::Local<v8::Object> object);

  State(const State&) = delete;
  State& operator=(const State&) = delete;
  State(State&&) = default;
  State& operator=(State&&) = default;

  void step();
};

}
}

#endif