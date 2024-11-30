from __future__ import annotations
from cffi import FFI

from .create_param import CreateParam
from . import low_level as ll


class State:
    _state_handle: FFI.CData

    def __init__(
        self, /, create_param: CreateParam | None = None, json: str | None = None, handle: FFI.CData | None = None
    ):
        if create_param is not None:
            self._state_handle = ll.state_new(create_param._createparam_handle)
        elif json is not None:
            self._state_handle = ll.state_from_json(json)
        elif handle is not None:
            self._state_handle = handle
        else:
            raise ValueError("either create_param, json or handle must be provided")

    def json(self) -> str:
        return ll.state_to_json(self._state_handle)
    
    def winner(self) -> int | None:
        winner = ll.state_get_attr(self._state_handle, ll.ATTR_STATE_WINNER)
        if winner == -1:
            return None
        return winner
    
    def round_number(self) -> int:
        return ll.state_get_attr(self._state_handle, ll.ATTR_STATE_ROUND_NUMBER)
    
    def current_turn(self) -> int:
        return ll.state_get_attr(self._state_handle, ll.ATTR_STATE_CURRENT_TURN)
    
    def __del__(self):
        ll.state_free(self._state_handle)
