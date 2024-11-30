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
    def on_notify(self, notification: Notification):
        pass

    def on_io_error(self, error_msg: str):
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
        pass

    @abstractmethod
    def on_reroll_dice(self, request: RerollDiceRequest) -> RerollDiceResponse:
        pass

    @abstractmethod
    def on_select_card(self, request: SelectCardRequest) -> SelectCardResponse:
        pass

    @abstractmethod
    def on_switch_hands(self, request: SwitchHandsRequest) -> SwitchHandsResponse:
        pass

    @abstractmethod
    def on_action(self, request: ActionRequest) -> ActionResponse:
        pass
