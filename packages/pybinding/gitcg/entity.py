from __future__ import annotations
from cffi import FFI

from . import low_level as ll

class Entity:
    """
    Represents an Entity in a GI-TCG Game State.
    An entity includes:
    - `id`: A unique id for the entity in the game.
    - `definition_id`: The definition id of this entity. E.g. Furina has a definition id of 1211.
    - `variable`: A entity have some variables.
        - For characters, some common variables are `health`, `maxHealth`, `energy`, `maxEnergy`, `aura` and `alive`.
        - For other entities, some common variables are `usage`, `usagePerRound` and `shield`.
    """
    _entity_handle: FFI.CData = ll.NULL

    def __init__(self, handle: FFI.CData):
        """
        @private
        """
        self._entity_handle = handle

    def id(self):
        return ll.entity_get_id(self._entity_handle)
    
    def definition_id(self):
        return ll.entity_get_definition_id(self._entity_handle)
    
    def variable(self, name: str) -> int:
        return ll.entity_get_variable(self._entity_handle, name)
    
    def __del__(self):
        ll.entity_free(self._entity_handle)
