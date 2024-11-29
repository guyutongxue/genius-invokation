import unittest
from gitcg import low_level

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

        low_level.gitcg_state_free(state)

        state2 = low_level.gitcg_state_from_json(json)
        low_level.gitcg_state_free(state2)

        low_level.thread_cleanup()
        low_level.cleanup()
