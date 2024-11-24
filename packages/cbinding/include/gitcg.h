// Copyright (C) 2024 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

#include <stdlib.h>

#ifdef __cplusplus
extern "C" {
#endif

// >>> generated macros
#define GITCG_ATTR_INIT_DATA_VERSION 101
#define GITCG_ATTR_INIT_RANDOM_SEED 102
#define GITCG_ATTR_INIT_INITIAL_HANDS_COUNT 103
#define GITCG_ATTR_INIT_MAX_HANDS_COUNT 104
#define GITCG_ATTR_INIT_MAX_ROUNDS_COUNT 105
#define GITCG_ATTR_INIT_MAX_SUPPORTS_COUNT 106
#define GITCG_ATTR_INIT_MAX_SUMMONS_COUNT 107
#define GITCG_ATTR_INIT_INITIAL_DICE_COUNT 108
#define GITCG_ATTR_INIT_MAX_DICE_COUNT 109
#define GITCG_ATTR_INIT_DECK_CHARACTER_COUNT 401
#define GITCG_ATTR_INIT_DECK_CARD_COUNT 402
#define GITCG_ATTR_PLAYER_ALWAYS_OMNI 301
#define GITCG_ATTR_PLAYER_ALLOW_TUNING_ANY_DICE 302
#define GITCG_INTERNAL_IO_RPC 1
#define GITCG_INTERNAL_IO_NOTIFICATION 2
#define GITCG_INTERNAL_IO_ERROR 3
// <<< generated macros

/**
 * @brief Initialize this library.
 * Should be called before any other functions.
 * 
 */
void gitcg_initialize(void);

/**
 * @brief Do cleanup jobs.
 * 
 */
void gitcg_cleanup(void);

/**
 * @brief A GI-TCG simulation environment.
 * There should only be one environment per thread.
 * 
 * An environment contains a V8 instance, and it can create games.
 */
typedef struct gitcg_env;

/**
 * @brief Initialize a GI-TCG simulation envrionment.
 * There should only be one environment per thread.
 * @param env A pointer to `gitcg_env*` that represents the environment
 * @return 0 if success, otherwise non-zero
 */
int gitcg_env_init(gitcg_env** env);

/**
 * @brief Dispose the GI-TCG simulation environment.
 * @param env The environment
 */
void gitcg_env_free(gitcg_env* env);




#ifdef __cplusplus
}  // extern "C"
#endif