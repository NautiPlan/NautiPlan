#ifndef _LLM_UTILS_H_
#define _LLM_UTILS_H_

#include <string>
#include <vector>

#include <unordered_set>
#include <map>
#include <unordered_map>


#define VCAP_LLM_API __attribute__((visibility("default")))
#include <android/log.h>
#define TAG "_V_llm_util-"

enum LLM_LOG_LEVEL {
    LLM_LOG_LEVEL_VERBOSE = 0,
    LLM_LOG_LEVEL_DEBUG = 1,
    LLM_LOG_LEVEL_INFO = 2,
    LLM_LOG_LEVEL_WARN = 3,
    LLM_LOG_LEVEL_ERROR = 4,
    LLM_LOG_LEVEL_FATAL = 5
};

static int llm_log_level_ = LLM_LOG_LEVEL_DEBUG;


#define LOGV(...) \
 do { \
   if(getLogLevel() > LLM_LOG_LEVEL_VERBOSE) { \
     break; \
   } \
    __android_log_print(ANDROID_LOG_DEBUG,TAG ,__VA_ARGS__); \
 } while(0)

#define LOGD(...) \
 do { \
   if(getLogLevel() > LLM_LOG_LEVEL_DEBUG) { \
     break; \
   } \
    __android_log_print(ANDROID_LOG_DEBUG,TAG ,__VA_ARGS__); \
 } while(0)

#define LOGI(...) \
 do { \
   if(getLogLevel() > LLM_LOG_LEVEL_INFO) { \
     break; \
   } \
    __android_log_print(ANDROID_LOG_INFO,TAG ,__VA_ARGS__); \
 } while(0)

#define LOGW(...) \
 do { \
   if(getLogLevel() > LLM_LOG_LEVEL_WARN) { \
     break; \
   } \
    __android_log_print(ANDROID_LOG_WARN,TAG ,__VA_ARGS__); \
 } while(0)

#define LOGE(...) \
 do { \
   if(getLogLevel() > LLM_LOG_LEVEL_ERROR) { \
     break; \
   } \
    __android_log_print(ANDROID_LOG_ERROR,TAG ,__VA_ARGS__); \
 } while(0)

#define LOGF(...) \
 do { \
   if(getLogLevel() > LLM_LOG_LEVEL_FATAL) { \
     break; \
   } \
    __android_log_print(ANDROID_LOG_FATAL,TAG ,__VA_ARGS__); \
 } while(0)

inline int getLogLevel() {
    return llm_log_level_;
}

#endif