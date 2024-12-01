from abc import ABC, abstractmethod
from ._proto.notification_pb2 import Notification
from ._proto.rpc_pb2 import (
    Request,
    Response,
    ChooseActiveRequest,
    ChooseActiveResponse,
    RerollDiceRequest,
    RerollDiceResponse,
    SelectCardRequest,
    SelectCardResponse,
    SwitchHandsRequest,
    SwitchHandsResponse,
    ActionRequest,
    ActionResponse,
)


class Player(ABC):
    """
    An abstract class (interface) of a player of GI-TCG Game.

    A player can receive `notification` by `gitcg.Player.on_notify`. The notification includes:
    - Game state information that is visible to this player, and
    - All mutation information since last notification.

    The `gitcg.Notification` class is generated from Protocol Buffer, its detailed structure is listed [here](https://github.com/guyutongxue/genius-invokation/blob/main/proto/notification.proto).

    A player can handle 5 types of "requests", which are:
    - `action`, when a player action is requested.
    - `chooseActive`, when a player is requested to choose an active character. This usually happens on the initialize phase or the previous active character was defeated.
    - `rerollDice`, when a player is requested to reroll dice. This usually happens on the roll phase.
    - `selectCard`, when a player is requested to select a card. This is the effects of some cards / skills like Chiori.
    - `switchHands`, when a player is requested to switch some cards from/to his hands and pile. This happens on the initialize phase.

    All above requests and responses class are generated from Protocol Buffer, their detailed structure can be found [here](https://github.com/guyutongxue/genius-invokation/blob/main/proto/rpc.proto).
    """

    def on_notify(self, notification: Notification):
        """
        The player receives `Notification` that includes state and mutation info.
        
        **Notice**: your dice and hand cards are provided from here as part of state data. You should use them to determine how to response following `rerollDice` and `switchHands` requests. 
        """
        pass

    def on_io_error(self, error_msg: str):
        """
        When IO error happens (e.g. wrong response format, wrong dice usage, etc.), you can receive the error message from this handler.

        When you've made an IO error, the opponents would automatically win and the game would step to `gitcg.GameStatus.FINISHED`.
        """
        pass

    def _on_rpc(self, request: Request) -> Response:
        if request.HasField("choose_active"):
            return Response(choose_active=self.on_choose_active(request.choose_active))
        elif request.HasField("reroll_dice"):
            return Response(reroll_dice=self.on_reroll_dice(request.reroll_dice))
        elif request.HasField("select_card"):
            return Response(select_card=self.on_select_card(request.select_card))
        elif request.HasField("switch_hands"):
            return Response(switch_hands=self.on_switch_hands(request.switch_hands))
        elif request.HasField("action"):
            return Response(action=self.on_action(request.action))
        return Response()

    @abstractmethod
    def on_choose_active(self, request: ChooseActiveRequest) -> ChooseActiveResponse:
        """
        Implement the logic of how to `chooseActive`. The returned `ChooseActiveResoponse` must be presented with an id listed in `gitcg.ChooseActiveRequest`'s `candidate_ids`.

        For example, select the first candidate:
        ```py
        def on_choose_active(self, request: ChooseActiveRequest) -> ChooseActiveResponse:
            return ChooseActiveResponse(active_character_id=request.candidate_ids[0])
        ```
        """
        pass

    @abstractmethod
    def on_reroll_dice(self, request: RerollDiceRequest) -> RerollDiceResponse:
        """
        Implement the logic of how to `rerollDice`. The returned `RerollDiceResponse` consists a list of `reroll_indexes` that you want to reroll. The dice information is shown on a previous `on_notify` notification.

        For example, do not reroll any dice:
        ```
        def on_reroll_dice(self, request: RerollDiceRequest) -> RerollDiceResponse:
            return RerollDiceResponse() # or RerollDiceResponse(reroll_indexes=[])
        ```
        """
        pass

    @abstractmethod
    def on_select_card(self, request: SelectCardRequest) -> SelectCardResponse:
        """
        Implement the logic of how to `selectCard`. The returned `SelectCardResponse` must be presented with an id listed in `gitcg.SelectCardRequest`'s `candidate_definition_ids`.

        For example, select the first candidate:
        ```py
        def on_select_card(self, request: SelectCardRequest) -> SelectCardResponse:
            return SelectCardResponse(selected_definition_id=request.candidate_definition_ids[0])
        ```
        """
        pass

    @abstractmethod
    def on_switch_hands(self, request: SwitchHandsRequest) -> SwitchHandsResponse:
        """
        Implement the logic of how to `switchHands`. The returned `SwitchHandsResponse` must be presented with a list of `removed_hand_ids` that you want to remove from your hands. You will receive same amount of cards from your pile later.

        For example, do not switch any card:
        ```py
        def on_switch_hands(self, request: SwitchHandsRequest) -> SwitchHandsResponse:
            return SwitchHandsResponse() # or SwitchHandsResponse(removed_hand_ids=[])
        """
        pass

    @abstractmethod
    def on_action(self, request: ActionRequest) -> ActionResponse:
        """
        Implement the logic of how to `action`. The `ActionRequest` contains a list of actions you can perform. The returned `ActionResponse` must be presented with an index of the action you want to perform, and some `used_dice` values as this action's cost requirement.

        There are 5 kind of actions, called `use_skill`, `play_card`, `elemenental_tunning`, `switch_active` and `declare_end`. While enumerating `action` on `ActionRequest`, check `action.HasField("use_skill")` to determine which kind of this action is. Then `action.use_skill` will contains detailed information of this action. The detailed data structure of `ActionRequest` can be found [here](https://github.com/guyutongxue/genius-invokation/blob/main/proto/action.proto).

        For example, choose the `declare_end` action:
        ```py
        def on_action(self, request: ActionRequest) -> ActionResponse:
            chosen_index = 0
            for i, action in enumerate(request.action):
                if action.HasField("declare_end"):
                    chosen_index = i
                    break
            # Because no dice required for declare_end, so just omitting `used_dice=[]` argument.
            return ActionResponse(chosen_action_index=chosen_index)
        ```
        """
        pass
