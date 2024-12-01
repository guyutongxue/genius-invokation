
from cffi import FFI
import re
import os
import shutil

dirname = os.path.abspath(os.path.dirname(__file__))
INSTALL_DIR = os.path.join(dirname, "../../cbinding/install/")
DEST_DIR = os.path.join(dirname, "../gitcg")

def build_ffi_module():
    ffibuilder = FFI()
    with open(os.path.join(INSTALL_DIR, "include/gitcg/gitcg.h")) as f:
        header_src = f.read()

    start_marker = "// >>> API declarations"
    end_marker = "// <<< API declarations"

    start = header_src.find(start_marker)
    end = header_src.find(end_marker, start)

    if start != -1 and end != -1:
        api_declarations = header_src[start + len(start_marker) : end].strip()
    else:
        raise ValueError("API declaration not found")

    api_declarations = re.sub(r"\bGITCG_API\b", "", api_declarations)
    api_declarations = re.sub(r"#define GITCG_CORE_VERSION \"[^\"]+\"", "", api_declarations)

    # print(api_declarations)

    ffibuilder.cdef(api_declarations)
    ffibuilder.set_source("_gitcg_cffi", None)  # type: ignore
    ffibuilder.compile(tmpdir=DEST_DIR, verbose=True)


def copy_lib_file():
    LIB_FILE = [
        "lib/libgitcg.so",
        "lib/libgitcg.dylib",
        "bin/gitcg.dll",
    ]
    for lib_file in LIB_FILE:
        src = os.path.join(INSTALL_DIR, lib_file)
        if os.path.exists(src):
            shutil.copy(src, DEST_DIR)

def build_all():
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)
    build_ffi_module()
    copy_lib_file()

if __name__ == "__main__":
    build_all()
