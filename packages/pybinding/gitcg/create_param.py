from __future__ import annotations
from cffi import FFI

from . import low_level as ll

class CreateParam:
    _createparam_handle: FFI.CData
    def __init__(self):
        self._createparam_handle = ll.state_createpram_new()

    def set_characters(self, who: int, characters: list[int]):
        ll.state_createparam_set_deck(self._createparam_handle, who, 1, characters)

    def set_cards(self, who: int, cards: list[int]):
        ll.state_createparam_set_deck(self._createparam_handle, who, 2, cards)

    def __del__(self):
        ll.state_createpram_free(self._createparam_handle)
