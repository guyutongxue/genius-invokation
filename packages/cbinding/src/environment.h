#pragma once
#ifndef GITCG_ENVIRONMENT_H
#define GITCG_ENVIRONMENT_H

#include <libplatform/libplatform.h>
#include <v8.h>

#include "game.h"

namespace gitcg {
inline namespace v1_0 {

extern const char JS_CODE[];

void initialize();

void cleanup();

class Environment {
  std::unique_ptr<v8::Platform> platform;
  v8::Isolate::CreateParams create_params;
  v8::Isolate* isolate;
  v8::Persistent<v8::Context> context;

  std::unordered_map<int, std::unique_ptr<Game>> games;
  int next_game_id = 0;

public:
  v8::Persistent<v8::Function> game_ctor; // temp workaround
  Environment();
  ~Environment();
  Environment(const Environment&) = delete;
  Environment& operator=(const Environment&) = delete;

  static Environment& create();
  static Environment& get_instance();
  static void dispose();

  Game* create_game();
  Game* get_game(int gameId) noexcept;

  v8::Isolate* get_isolate() {
    return isolate;
  }

  /**
   * Get v8::Local<v8::Context> of current execution context.
   * MUST be called under a handle_scope.
   */
  v8::Local<v8::Context> get_context() const {
    return context.Get(isolate);
  }
};

}  // namespace v1_0
}  // namespace gitcg

#endif
