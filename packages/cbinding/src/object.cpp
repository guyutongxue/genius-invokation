#include "object.h"

namespace gitcg {
inline namespace v1_0 {

Object::Object(Environment* environment, v8::Local<v8::Object> instance)
    : env{environment} {
  this->instance.Reset(environment->get_isolate(), instance);
}

v8::Local<v8::Object> Object::get_instance() const {
  return instance.Get(env->get_isolate());
}

}  // namespace v1_0
}  // namespace gitcg
