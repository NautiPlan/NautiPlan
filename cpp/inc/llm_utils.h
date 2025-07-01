// #ifndef _LLM_UTILS_H_
// #define _LLM_UTILS_H_

// #include <string>
// #include <vector>

// #include <unordered_set>
// #include <map>
// #include <unordered_map>


// #define VCAP_LLM_API __attribute__((visibility("default")))
// #include <android/log.h>
// #define TAG "_V_llm_util-"

// enum LLM_LOG_LEVEL {
//     LLM_LOG_LEVEL_VERBOSE = 0,
//     LLM_LOG_LEVEL_DEBUG = 1,
//     LLM_LOG_LEVEL_INFO = 2,
//     LLM_LOG_LEVEL_WARN = 3,
//     LLM_LOG_LEVEL_ERROR = 4,
//     LLM_LOG_LEVEL_FATAL = 5
// };

// static int llm_log_level_ = LLM_LOG_LEVEL_DEBUG;


// #define LOGV(...) \
//  do { \
//    if(getLogLevel() > LLM_LOG_LEVEL_VERBOSE) { \
//      break; \
//    } \
//     __android_log_print(ANDROID_LOG_DEBUG,TAG ,__VA_ARGS__); \
//  } while(0)

// #define LOGD(...) \
//  do { \
//    if(getLogLevel() > LLM_LOG_LEVEL_DEBUG) { \
//      break; \
//    } \
//     __android_log_print(ANDROID_LOG_DEBUG,TAG ,__VA_ARGS__); \
//  } while(0)

// #define LOGI(...) \
//  do { \
//    if(getLogLevel() > LLM_LOG_LEVEL_INFO) { \
//      break; \
//    } \
//     __android_log_print(ANDROID_LOG_INFO,TAG ,__VA_ARGS__); \
//  } while(0)

// #define LOGW(...) \
//  do { \
//    if(getLogLevel() > LLM_LOG_LEVEL_WARN) { \
//      break; \
//    } \
//     __android_log_print(ANDROID_LOG_WARN,TAG ,__VA_ARGS__); \
//  } while(0)

// #define LOGE(...) \
//  do { \
//    if(getLogLevel() > LLM_LOG_LEVEL_ERROR) { \
//      break; \
//    } \
//     __android_log_print(ANDROID_LOG_ERROR,TAG ,__VA_ARGS__); \
//  } while(0)

// #define LOGF(...) \
//  do { \
//    if(getLogLevel() > LLM_LOG_LEVEL_FATAL) { \
//      break; \
//    } \
//     __android_log_print(ANDROID_LOG_FATAL,TAG ,__VA_ARGS__); \
//  } while(0)

// inline int getLogLevel() {
//     return llm_log_level_;
// }

// #endif
#ifndef LLM_UTILS_H_
#define LLM_UTILS_H_

#include <iostream>
#include <string>
#include <chrono>
#include <iomanip>
#include <sstream>

// 平台检测宏
#if defined(_WIN32) || defined(_WIN64)
#define LLM_OS_WINDOWS
#elif defined(__APPLE__)
#define LLM_OS_MACOS
#elif defined(__ANDROID__)
#define LLM_OS_ANDROID
#else
#define LLM_OS_LINUX
#endif

// 日志级别枚举
enum LLM_LOG_LEVEL
{
	LLM_LOG_VERBOSE = 0,
	LLM_LOG_DEBUG = 1,
	LLM_LOG_INFO = 2,
	LLM_LOG_WARNING = 3,
	LLM_LOG_ERROR = 4,
	LLM_LOG_FATAL = 5,
	LLM_LOG_SILENT = 6
};

// 全局日志级别配置
static LLM_LOG_LEVEL g_log_level = LLM_LOG_INFO;

// 获取当前时间戳 (格式: [YYYY-MM-DD HH:MM:SS])
inline std::string get_timestamp()
{
	auto now = std::chrono::system_clock::now();
	auto time = std::chrono::system_clock::to_time_t(now);
	auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()) % 1000;

	std::stringstream ss;
	ss << std::put_time(std::localtime(&time), "[%Y-%m-%d %H:%M:%S");
	ss << "." << std::setfill('0') << std::setw(3) << ms.count();
	return ss.str();
}

// 设置日志级别
inline void set_log_level(LLM_LOG_LEVEL level)
{
	g_log_level = level;
}

// 日志宏定义
#define LLM_LOG(level, level_str, ...)                              \
	do                                                              \
	{                                                               \
		if (level >= g_log_level)                                   \
		{                                                           \
			std::cerr << get_timestamp() << " " << level_str << " " \
					  << __FILE__ << ":" << __LINE__ << "] "        \
					  << __VA_ARGS__ << std::endl;                  \
		}                                                           \
	} while (0)

#define LOGV(...) LLM_LOG(LLM_LOG_VERBOSE, "[VERBOSE]", __VA_ARGS__)
#define LOGD(...) LLM_LOG(LLM_LOG_DEBUG, "[DEBUG]", __VA_ARGS__)
#define LOGI(...) LLM_LOG(LLM_LOG_INFO, "[INFO]", __VA_ARGS__)
#define LOGW(...) LLM_LOG(LLM_LOG_WARNING, "[WARNING]", __VA_ARGS__)
#define LOGE(...) LLM_LOG(LLM_LOG_ERROR, "[ERROR]", __VA_ARGS__)
#define LOGF(...) LLM_LOG(LLM_LOG_FATAL, "[FATAL]", __VA_ARGS__)

// 跨平台路径处理
#ifdef LLM_OS_WINDOWS
#define LLM_PATH_SEPARATOR '\\'
#else
#define LLM_PATH_SEPARATOR '/'
#endif

inline std::string join_path(const std::string &dir, const std::string &filename)
{
	if (dir.empty())
		return filename;
	if (filename.empty())
		return dir;

	if (dir.back() == LLM_PATH_SEPARATOR || filename.front() == LLM_PATH_SEPARATOR)
	{
		return dir + filename;
	}
	return dir + LLM_PATH_SEPARATOR + filename;
}

#endif // LLM_UTILS_H_