from hatchling.builders.hooks.plugin.interface import BuildHookInterface
import re
import shutil
from pathlib import Path
from cffi import FFI

ROOT_PATH = Path(__file__).parent.parent
CBINDING_PATH = ROOT_PATH / "cbinding"
SRC_PATH = ROOT_PATH / "src" / "gitcg"
DIST_PATH = ROOT_PATH / "dist"

def compile_cffi():
    ffi = FFI()
    header  = CBINDING_PATH / "include" / "gitcg" / "gitcg.h"
    declarations = header.read_text()
    _, declarations = declarations.split("// >>> API declarations")
    declarations, _ = declarations.split("// <<< API declarations")
    declarations = re.sub(r"\bGITCG_API\b", "", declarations)
    declarations = re.sub(r"#define GITCG_CORE_VERSION \"[^\"]+\"", "", declarations)
    ffi.cdef(declarations)
    ffi.set_source("_gitcg_cffi", None)  # type: ignore
    ffi.compile(tmpdir=str(SRC_PATH), verbose=True)

def copy_lib_file():
    LIB_FILE = [
        "lib/libgitcg.so",
        "lib/libgitcg.dylib",
        "bin/gitcg.dll",
    ]
    for lib_file in LIB_FILE:
        lib_path = CBINDING_PATH / lib_file
        if lib_path.is_file():
            shutil.copy(lib_path, SRC_PATH)

class CustomBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        compile_cffi()
        copy_lib_file()
