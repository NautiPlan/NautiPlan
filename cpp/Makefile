
gen:CMakeLists.txt
	cmake -G Ninja \
	-DCMAKE_TOOLCHAIN_FILE=$(NDK_HOME)/build/cmake/android.toolchain.cmake \
	-DANDROID_ABI=arm64-v8a \
	-DANDROID_PLATFORM=android-21 \
	-DCMAKE_BUILD_TYPE=Release \
	-B build
build:
	cmake --build build

install:
	cp build/libbluelm.so ../src-tauri/libs
	cp lib/* ../src-tauri/libs	 
.PHONY: gen build