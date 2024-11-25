cmake_minimum_required(VERSION 3.25)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

### Fetch and configure v8-cmake

include(FetchContent)
FetchContent_Declare(
  v8-cmake
  # GIT_REPOSITORY https://github.com/guyutongxue/v8-cmake.git
  GIT_REPOSITORY https://git.tencent.xqm32.org/guyutongxue/v8-cmake.git
  GIT_TAG        578702617aa6cdb6fdfd5a924851c84543df5c45
)
FetchContent_MakeAvailable(v8-cmake)

### My project

project(gitcg-cbinding)

add_executable(gitcg-cbinding-test
  src/environment.cpp
  src/object.cpp
  src/state_createparam.cpp
  src/state.cpp
  src/game.cpp
  src/main.cpp
  generated/js_code.cpp)

target_include_directories(gitcg-cbinding-test
  PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_link_libraries(gitcg-cbinding-test
  PRIVATE
  v8_base_without_compiler
  v8_compiler
  v8_snapshot
  v8_inspector
  v8_libplatform
)
