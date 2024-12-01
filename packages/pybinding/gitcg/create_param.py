from __future__ import annotations
from cffi import FFI
from dataclasses import dataclass

from . import low_level as ll


@dataclass
class Deck:
    """
    A deck that consists initial characters and action cards that initialize a GI-TCG Game State.
    In an ordinary GI-TCG game, each player has 3 characters and 30 action cards. 
    
    The `characters` and `cards` is a list of definition ids of characters and action cards respectively.
    """
    characters: list[int]
    cards: list[int]


class CreateParam:
    """
    A helper class to create a initial Game State of GI-TCG.
    """
    _createparam_handle: FFI.CData

    def __init__(
        self,
        /,
        deck0: Deck | None = None,
        deck1: Deck | None = None,
        version: str | None = None,
    ):
        """
        The `gitcg.CreateParam` canbe initialized from 0~2 `gitcg.Deck` and a version string.

        The available version string can be found at Core TypeScript code [here](https://github.com/guyutongxue/genius-invokation/blob/main/packages/core/src/base/version.ts).

        If `deck0` or `deck1` not provided in constructor, you can also set them later by `set_characters` and `set_cards`.
        """
        self._createparam_handle = ll.state_createpram_new()
        if deck0 is not None:
            self.set_characters(0, deck0.characters)
            self.set_cards(0, deck0.cards)
        if deck1 is not None:
            self.set_characters(1, deck1.characters)
            self.set_cards(1, deck1.cards)
        if version is not None:
            self.set_version(version)

    def set_characters(self, who: int, characters: list[int]):
        assert who == 0 or who == 1
        ll.state_createparam_set_deck(self._createparam_handle, who, 1, characters)

    def set_cards(self, who: int, cards: list[int]):
        assert who == 0 or who == 1
        ll.state_createparam_set_deck(self._createparam_handle, who, 2, cards)

    def set_attr(self, key: int, value: int | str):
        ll.state_createparam_set_attr(self._createparam_handle, key, value)

    def set_version(self, version: str):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_CREATEPARAM_DATA_VERSION, version
        )

    def __del__(self):
        ll.state_createpram_free(self._createparam_handle)
