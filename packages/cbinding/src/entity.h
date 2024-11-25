#pragma once
#ifndef GITCG_ENTITY_H
#define GITCG_ENTITY_H

#include <v8.h>

#include "object.h"

namespace gitcg {
inline namespace v1_0 {

class Entity final : public Object {
public:
  using Object::Object;

};

}
}

#endif