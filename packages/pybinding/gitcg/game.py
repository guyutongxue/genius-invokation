from __future__ import annotations
from cffi import FFI

from .player import Player
from .state import State
from . import low_level as ll
from ._proto.rpc_pb2 import Request
from ._proto.notification_pb2 import Notification


class _GameCallback(ll.ICallback):
    _player: Player

    def __init__(self, player: Player):
        self._player = player

    def on_rpc(self, request: bytes) -> bytes:
        request_msg = Request()
        request_msg.ParseFromString(request)
        response_msg = self._player._on_rpc(request_msg)
        return response_msg.SerializeToString()

    def on_notify(self, notification: bytes):
        notification_msg = Notification()
        notification_msg.ParseFromString(notification)
        self._player.on_notify(notification_msg)

    def on_io_error(self, error_msg: str):
        self._player.on_io_error(error_msg)


class Game:
    _game_handle: FFI.CData
    _players: list[Player | None] = [None, None]
    _player_callbacks: list[_GameCallback | None] = [None, None]
    _player_callback_handles: list[FFI.CData | None] = [None, None]

    def __init__(self, state: State):
        self._game_handle = ll.game_new(state._state_handle)

    def set_player(self, who: int, player: Player):
        callback = _GameCallback(player)
        self._player_callbacks[who] = callback
        handle = ll.game_set_handlers(self._game_handle, who, callback)
        self._player_callback_handles[who] = handle
        self._players[who] = player

    def step(self) -> bool:
        ll.game_step(self._game_handle)
        status = ll.game_get_status(self._game_handle)
        if status == ll.GAME_STATUS_ABORTED:
            error = ll.game_get_error(self._game_handle)
            raise ValueError(f"game aborted: {error}")
        return status == ll.GAME_STATUS_FINISHED

    def json(self):
        return State(handle=ll.game_get_state(self._game_handle)).json()

    def winner(self):
        return State(handle=ll.game_get_state(self._game_handle)).winner()

    def round_number(self):
        return State(handle=ll.game_get_state(self._game_handle)).round_number()

    def current_turn(self):
        return State(handle=ll.game_get_state(self._game_handle)).current_turn()

    def __del__(self):
        ll.game_free(self._game_handle)
