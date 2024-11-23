#include <libplatform/libplatform.h>
#include <v8.h>

#include <cstring>

#include "environment.h"
#include "game.h"

int main(int argc, char** argv) {
  gitcg::initialize();
  {
    auto& env = gitcg::Environment::create();
    std::printf("11111\n");
    auto game = env.create_game();
    game->set_rpc_handler(0, [](void* player_data, const char* request_data,
                                std::size_t request_len, char* response_data,
                                std::size_t* response_len) noexcept {
      for (std::size_t i = 0; i < request_len; ++i) {
        std::printf("%d ", static_cast<int>(request_data[i]));
      }
      std::printf("RPC handler called\n");
      std::memcpy(response_data, "Hello, I'm response!", 20);
      *response_len = 20;
    });
    game->step();
    std::printf("22222\n");
    gitcg::Environment::dispose();
  }
  gitcg::cleanup();
}