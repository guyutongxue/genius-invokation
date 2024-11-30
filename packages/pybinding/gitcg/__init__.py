

def make_protobuf_work():
    """
    F**k you, Google
    See https://github.com/protocolbuffers/protobuf/issues/3430
    """
    import sys
    import os
    dirname = os.path.abspath(os.path.dirname(__file__))
    sys.path.append(os.path.join(dirname, "_proto"))

make_protobuf_work()

from .env import thread_initialize, thread_cleanup
from .game import Game
from .player import Player
from .state import State
from .create_param import CreateParam
from ._proto.rpc_pb2 import ActionRequest, ActionResponse, RerollDiceRequest, RerollDiceResponse, ChooseActiveRequest, ChooseActiveResponse, SelectCardRequest, SelectCardResponse, SwitchHandsRequest, SwitchHandsResponse
from ._proto.notification_pb2 import Notification

__all__ = [
    "thread_initialize",
    "thread_cleanup",
    "Game",
    "Player",
    "State",
    "CreateParam",
    "ActionRequest",
    "ActionResponse",
    "RerollDiceRequest",
    "RerollDiceResponse",
    "ChooseActiveRequest",
    "ChooseActiveResponse",
    "SelectCardRequest",
    "SelectCardResponse",
    "SwitchHandsRequest",
    "SwitchHandsResponse",
    "Notification",
]
