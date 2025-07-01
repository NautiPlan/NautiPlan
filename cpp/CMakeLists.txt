cmake_minimum_required(VERSION 3.22)
project(bluelm LANGUAGES CXX)

# 设置 Android 编译目标
set(CMAKE_SYSTEM_NAME Android)
set(CMAKE_ANDROID_NDK $ENV{ANDROID_NDK_HOME})
set(CMAKE_ANDROID_ARCH_ABI arm64-v8a)  # 或 armeabi-v7a/x86_64
set(CMAKE_ANDROID_STL_TYPE c++_shared) # 使用动态 C++ 运行时

# 添加源码
add_library(bluelm SHARED
    llm_bluelm.cpp
    llm_instance.cpp
    llm_utils.cpp
)

# 链接必要的 NDK 库（如 log）
find_library(log-lib log)
target_link_libraries(bluelm ${log-lib}
    lib/c++
    lib/core_tokenizer
    lib/dmabufheap
    lib/llm_apu_7b
    lib/llm_base_7b
    lib/llm_htp_7b
    lib/vcap_llm
    lib/vivo_tocknizer
    )

# 设置输出目录
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib/${CMAKE_ANDROID_ARCH_ABI})