#pragma once
#ifndef GITCG_STATE_CREATEPARAM_H
#define GITCG_STATE_CREATEPARAM_H

#include <v8.h>

namespace gitcg {
inline namespace v1_0 {

class Environment;

class StateCreateParam {
  Environment* env;
  v8::UniquePersistent<v8::Object> instance;

  void set_attribute(int attribute, v8::Local<v8::Value> value);

public:
  StateCreateParam(Environment* env, v8::Local<v8::Object> instance);

  StateCreateParam(const StateCreateParam&) = delete;
  StateCreateParam& operator=(const StateCreateParam&) = delete;
  StateCreateParam(StateCreateParam&&) = default;
  StateCreateParam& operator=(StateCreateParam&&) = default;

  void set_attribute(int attribute, int value);
  void set_attribute(int attribute, const std::string& value);

  void set_deck(int who, int character_or_card, const int* deck, int size);

  v8::Local<v8::Object> get_instance() const;
};

}  // namespace v1_0
}  // namespace gitcg

#endif