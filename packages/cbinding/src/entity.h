#pragma once
#ifndef GITCG_ENTITY_H
#define GITCG_ENTITY_H

#include <v8.h>

#include "object.h"

namespace gitcg {
inline namespace v1_0 {

class Entity final : public Object {
  template <std::size_t N>
  int get_property(const char (&prop)[N]) const {
    auto isolate = env->get_isolate();
    auto handle_scope = v8::HandleScope(isolate);
    return get<v8::Number>(prop)->Value();
  }

public:
  using Object::Object;

  int get_type() const {
    return get_property("type");
  }

  int get_definition_id() const {
    return get_property("definitionId");
  }

  int get_id() const {
    return get_property("id");
  }

  int get_variable(const std::string& name) const;

};

}
}

#endif
