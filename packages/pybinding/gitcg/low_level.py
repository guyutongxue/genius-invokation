from __future__ import annotations
import os
from gitcg._gitcg_cffi import ffi
from cffi import FFI
from typing import Any

_LIB_PATH = [
    "libgitcg.so",
    "libgitcg.dylib",
    "libgitcg.dll",
]

C: Any = None
for lib in _LIB_PATH:
    path = os.path.join(os.path.dirname(__file__), lib)
    if os.path.exists(path):
        C = ffi.dlopen(path)
        break
if C is None:
    raise ImportError("Cannot find libgitcg library file")


def _cdata_to_string(cdata: Any) -> str:
    b: bytes = ffi.string(cdata)  # type: ignore
    return b.decode("utf-8")


def version() -> str:
    return _cdata_to_string(C.gitcg_version())


def initialize():
    C.gitcg_initialize()


def cleanup():
    C.gitcg_cleanup()


def thread_initialize():
    C.gitcg_thread_initialize()


def thread_cleanup():
    C.gitcg_thread_cleanup()

def state_createpram_new() -> FFI.CData:
    createparam = ffi.new("gitcg_state_createparam_t[1]")
    assert C.gitcg_state_createparam_new(createparam) == 0
    return createparam[0]

def state_createpram_free(createparam: FFI.CData):
    C.gitcg_state_createparam_free(createparam)

def state_createparam_set_attr(createparam: FFI.CData, key: int, value: int | str):
    raise NotImplementedError

def state_createparam_set_deck(createparam: FFI.CData, who: int, character_or_cards: int, deck: list[int]):
    deck_array = ffi.new("int[]", deck)
    assert C.gitcg_state_createparam_set_deck(createparam, who, character_or_cards, deck_array, len(deck)) == 0

def gitcg_state_new(createparam: FFI.CData):
    state = ffi.new("gitcg_state_t[1]")
    assert C.gitcg_state_new(createparam, state) == 0
    return state[0]

def gitcg_state_free(state: FFI.CData):
    C.gitcg_state_free(state)

def gitcg_state_to_json(state: FFI.CData) -> str:
    string_ptr = ffi.new("char*[1]")
    assert C.gitcg_state_to_json(state, string_ptr) == 0
    py_string = _cdata_to_string(string_ptr[0])
    C.free(string_ptr[0])
    return py_string

def gitcg_state_from_json(json: str) -> FFI.CData:
    state = ffi.new("gitcg_state_t[1]")
    assert C.gitcg_state_from_json(json.encode("utf-8"), state) == 0
    return state[0]
