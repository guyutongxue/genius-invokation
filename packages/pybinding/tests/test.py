import unittest
import time
from gitcg import (
    Game,
    CreateParam,
    Player,
    State,
    ActionRequest,
    ActionResponse,
    RerollDiceRequest,
    RerollDiceResponse,
    ChooseActiveRequest,
    ChooseActiveResponse,
    SelectCardRequest,
    SelectCardResponse,
    SwitchHandsRequest,
    SwitchHandsResponse,
)


class MyPlayer(Player):
    def on_notify(self, notification):
        pass

    def on_io_error(self, error_msg):
        print(error_msg)

    def on_action(self, request: ActionRequest) -> ActionResponse:
        chosen_index = 0
        for i, action in enumerate(request.action):
            if action.HasField("declare_end"):
                chosen_index = i
                break
        return ActionResponse(chosen_action_index=chosen_index)

    def on_reroll_dice(self, request: RerollDiceRequest) -> RerollDiceResponse:
        return RerollDiceResponse()

    def on_switch_hands(self, request: SwitchHandsRequest) -> SwitchHandsResponse:
        return SwitchHandsResponse()

    def on_choose_active(self, request: ChooseActiveRequest) -> ChooseActiveResponse:
        return ChooseActiveResponse(active_character_id=request.candidate_ids[0])

    def on_select_card(self, request: SelectCardRequest) -> SelectCardResponse:
        return SelectCardResponse(
            selected_definition_id=request.candidate_definition_ids[0]
        )


class TestGitcg(unittest.TestCase):
    def test_it(self):
        createparam = CreateParam()
        createparam.set_characters(0, [1411, 1510, 2103])
        createparam.set_cards(
            0,
            [
                214111,
                214111,
                215101,
                311503,
                312004,
                312004,
                312025,
                312025,
                312029,
                312029,
                321002,
                321011,
                321016,
                321016,
                322002,
                322009,
                322009,
                330008,
                332002,
                332002,
                332004,
                332004,
                332005,
                332005,
                332006,
                332006,
                332018,
                332025,
                333004,
                333004,
            ],
        )
        createparam.set_characters(1, [1609, 2203, 1608])
        createparam.set_cards(
            1,
            [
                312025,
                321002,
                321002,
                321011,
                322025,
                323004,
                323004,
                330005,
                331601,
                331601,
                332002,
                332003,
                332003,
                332004,
                332004,
                332005,
                332005,
                332006,
                332025,
                332025,
                333003,
                333003,
            ],
        )
        game = Game(state=State(create_param=createparam))
        game.set_player(0, MyPlayer())
        game.set_player(1, MyPlayer())

        start_time = time.time()
        while not game.step():
            pass
        print("Time: ", time.time() - start_time)
        
        self.assertEqual(game.round_number(), 15)
        self.assertEqual(game.winner(), None)
