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
  std::vector<Entity*> query(int who, const std::string& query) const;
  int get_attribute(int attribute) const;

  std::vector<int> get_dice(int who) const;

};

}
}

#endif
