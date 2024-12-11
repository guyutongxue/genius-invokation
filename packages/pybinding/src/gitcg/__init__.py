"""
.. include:: ../../README.md
"""

def makeprotobuf_work():
    """
    F**k you, Google
    See https://github.com/protocolbuffers/protobuf/issues/3430
    """
    import sys
    import os
    dirname = os.path.abspath(os.path.dirname(__file__))
    sys.path.append(os.path.join(dirname, "proto"))

makeprotobuf_work()

from . import low_level
from .env import thread_initialize, thread_cleanup
from .game import Game, GameStatus
from .player import Player
from .state import State
from .create_param import CreateParam, Deck
from .entity import Entity
from . import proto
from .proto import ActionRequest, ActionResponse, RerollDiceRequest, RerollDiceResponse, ChooseActiveRequest, ChooseActiveResponse, SelectCardRequest, SelectCardResponse, SwitchHandsRequest, SwitchHandsResponse, Notification, Action, DiceRequirementType, DiceRequirement, DiceType

__all__ = [
    "thread_initialize",
    "thread_cleanup",
    "Game",
    "GameStatus",
    "Player",
    "State",
    "CreateParam",
    "Deck",
    "Entity",
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
    "Action",
    "DiceRequirementType",
    "DiceRequirement",
    "DiceType",
    "proto",
    "low_level",
]
