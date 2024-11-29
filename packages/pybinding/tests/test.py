import unittest
from gitcg import low_level

class EmptyPlayerHandler(low_level.ICallback):
    def __init__(self, who: int):
        self.who = who

    def on_rpc(self, request: bytes) -> bytes:
        return b""

    def on_notify(self, notification: bytes):
        pass

    def on_io_error(self, error_msg: str):
        print(self.who, error_msg)
        pass

class TestGitcg(unittest.TestCase):
    def test_version(self):
        version = low_level.version()
        print("VERSION: ", version)
        self.assertIsInstance(version, str)

    def test_api(self):
        low_level.initialize()
        low_level.thread_initialize()

        createparam = low_level.state_createpram_new()
        self.assertIsNotNone(createparam)
        low_level.state_createparam_set_deck(createparam, 0, 1, [1411, 1510, 2103])
        low_level.state_createparam_set_deck(createparam, 0, 2, [
            214111, 214111, 215101, 311503, 312004, 312004, 312025, 312025,
            312029, 312029, 321002, 321011, 321016, 321016, 322002, 322009,
            322009, 330008, 332002, 332002, 332004, 332004, 332005, 332005,
            332006, 332006, 332018, 332025, 333004, 333004
        ])
        low_level.state_createparam_set_deck(createparam, 1, 1, [1609, 2203, 1608])
        low_level.state_createparam_set_deck(createparam, 1, 2, [
            312025, 321002, 321002, 321011, 322025, 323004, 323004, 330005,
            331601, 331601, 332002, 332003, 332003, 332004, 332004, 332005,
            332005, 332006, 332025, 332025, 333003, 333003
        ])
        state = low_level.gitcg_state_new(createparam)
        low_level.state_createpram_free(createparam)

        json = low_level.gitcg_state_to_json(state)
        # print(json)

        entities = low_level.gitcg_state_query(state, 0, "my pile cards")
        self.assertEqual(len(entities), 30)
        first_def_id = low_level.gitcg_entity_get_definition_id(entities[0])
        self.assertIsInstance(first_def_id, int)
        for entity in entities:
            low_level.gitcg_entity_free(entity)

        low_level.gitcg_state_free(state)

        state2 = low_level.gitcg_state_from_json(json)

        game = low_level.gitcg_game_new(state2)
        low_level.gitcg_state_free(state2)
        player0 = EmptyPlayerHandler(0)
        player1 = EmptyPlayerHandler(1)
        player0_h = low_level.gitcg_game_set_handlers(game, 0, player0)
        player1_h = low_level.gitcg_game_set_handlers(game, 1, player1)

        low_level.gitcg_game_step(game)
        status = 1
        while status == 1: # running
            low_level.gitcg_game_step(game)
            status = low_level.gitcg_game_get_status(game)

        low_level.gitcg_game_free(game)
        print(player0_h)
        print(player1_h)
        del player0_h
        del player1_h

        low_level.thread_cleanup()
        low_level.cleanup()
