#pragma once
#ifndef GITCG_STATE_H
#define GITCG_STATE_H

#include <v8.h>

#include "object.h"

namespace gitcg {
inline namespace v1_0 {

class State final : public Object {
public:
  using Object::Object;

  char* to_json() const;
  std::vector<Entity*> query(const State& state);
  int get_attribute(const State& state, int attribute);

};

}
}

#endif
