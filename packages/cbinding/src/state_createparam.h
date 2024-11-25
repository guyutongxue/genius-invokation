#pragma once
#ifndef GITCG_STATE_CREATEPARAM_H
#define GITCG_STATE_CREATEPARAM_H

#include <v8.h>

#include "object.h"

namespace gitcg {
inline namespace v1_0 {

class StateCreateParam final : public Object {
  void set_attribute(int attribute, v8::Local<v8::Value> value);

public:
  using Object::Object;
  
  void set_attribute(int attribute, int value);
  void set_attribute(int attribute, const std::string& value);

  void set_deck(int who, int character_or_card, const int* deck, int size);
};

}  // namespace v1_0
}  // namespace gitcg

#endif
