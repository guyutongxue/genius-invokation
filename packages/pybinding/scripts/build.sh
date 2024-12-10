#!/bin/bash -ex

OS=$1
case $OS in
Linux-x86_64)
    VER=$(objdump -p ../cbinding/cbinding-library-Linux-x86_64/lib/libgitcg.so |
        awk '/GLIBC_/ {gsub(/^GLIBC_/, "", $NF); gsub(/\./, "_", $NF); print $NF}' |
        sort -V |
        tail -n 1)
    TAG=manylinux_${VER}_x86_64
    LIB=../cbinding/cbinding-library-${OS}/lib/libgitcg.so
    ;;
Windows-x86_64)
    TAG=windows_x86_64
    LIB=../cbinding/cbinding-library-${OS}/bin/gitcg.dll
    ;;
macOS-x86_64)
    TAG=macosx_12_0_x86_64
    LIB=../cbinding/cbinding-library-${OS}/lib/libgitcg.dylib
    ;;
macOS-arm64)
    TAG=macosx_12_0_arm64
    LIB=../cbinding/cbinding-library-${OS}/lib/libgitcg.dylib
    ;;
esac

cp $LIB src/gitcg
uv build --wheel
rm src/gitcg $(basename $LIB)
uv run wheel tags --remove --platform-tag=${TAG} dist/*any.whl
