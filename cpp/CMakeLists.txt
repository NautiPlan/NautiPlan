cmake_minimum_required(VERSION 3.22)
project(bluelm LANGUAGES CXX)

add_library(bluelm SHARED
    ${CMAKE_CURRENT_SOURCE_DIR}/src/llm_bluelm.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/llm_capi.cpp
)

find_library(log-lib log)
target_include_directories(bluelm PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/inc)
target_link_libraries(bluelm PUBLIC ${log-lib}
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/libc++.so
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/libcore_tokenizers.so
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/libdmabufheap.so
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/libllm_apu_7b.so
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/libllm_base_7b.so
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/libllm_htp_7b.so
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/libvcap_llm.so
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/libvivo_tokenizer.so
)

set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib/${ANDROID_ABI})