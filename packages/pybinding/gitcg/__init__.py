
"""
.. include:: ../README.md

A very simple usage example:
```py
from gitcg import Deck, Player, Game

# Set players initial deck
DECK0 = Deck(characters=[1411, 1510, 2103], cards=[214111, 311503, ...])
DECK1 = Deck(characters=[1609, 2203, 1608], cards=[312025, 321002, ...])

class MyPlayer(Player):
    # implements on_notify, on_action, etc.
    # See `gitcg.Player`'s documentation for detail.
    pass

# Initialize the game
game = Game(create_param=CreateParam(deck0=DECK0, deck1=DECK1))
game.set_player(0, MyPlayer())
game.set_player(1, MyPlayer())

# Start and step the game until end
game.start()
while game.is_running():
    game.step()
```
"""

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

from . import low_level
from .env import thread_initialize, thread_cleanup
from .game import Game, GameStatus
from .player import Player
from .state import State
from .create_param import CreateParam, Deck
from .entity import Entity
from ._proto.rpc_pb2 import ActionRequest, ActionResponse, RerollDiceRequest, RerollDiceResponse, ChooseActiveRequest, ChooseActiveResponse, SelectCardRequest, SelectCardResponse, SwitchHandsRequest, SwitchHandsResponse
from ._proto.notification_pb2 import Notification

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
    "low_level",
]
