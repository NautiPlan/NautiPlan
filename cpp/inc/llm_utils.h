#ifndef LLM_UTILS_H_
#define LLM_UTILS_H_

#include <stdio.h>
#include <string.h>
#include <time.h>

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
static int g_log_level = LLM_LOG_INFO;

// 获取当前时间戳 (格式: [YYYY-MM-DD HH:MM:SS.mmm])
static inline void get_timestamp(char *buf, size_t buf_size)
{
#if defined(_WIN32) || defined(_WIN64)
	SYSTEMTIME st;
	GetLocalTime(&st);
	snprintf(buf, buf_size, "[%04d-%02d-%02d %02d:%02d:%02d.%03d",
			 st.wYear, st.wMonth, st.wDay,
			 st.wHour, st.wMinute, st.wSecond, st.wMilliseconds);
#else
	struct timespec ts;
	struct tm tm_info;
	clock_gettime(CLOCK_REALTIME, &ts);
	localtime_r(&ts.tv_sec, &tm_info);
	snprintf(buf, buf_size, "[%04d-%02d-%02d %02d:%02d:%02d.%03ld",
			 tm_info.tm_year + 1900, tm_info.tm_mon + 1, tm_info.tm_mday,
			 tm_info.tm_hour, tm_info.tm_min, tm_info.tm_sec, ts.tv_nsec / 1000000);
#endif
}

// 设置日志级别
static inline void set_log_level(int level)
{
	g_log_level = level;
}

// 日志宏定义（C风格）
#define LLM_LOG(level, level_str, fmt, ...)                             \
	do                                                                  \
	{                                                                   \
		if ((level) >= g_log_level)                                     \
		{                                                               \
			char _ts[32];                                               \
			get_timestamp(_ts, sizeof(_ts));                            \
			fprintf(stderr, "%s %s %s:%d] " fmt "\n",                   \
					_ts, level_str, __FILE__, __LINE__, ##__VA_ARGS__); \
		}                                                               \
	} while (0)

#define LOGV(fmt, ...) LLM_LOG(LLM_LOG_VERBOSE, "[VERBOSE]", fmt, ##__VA_ARGS__)
#define LOGD(fmt, ...) LLM_LOG(LLM_LOG_DEBUG, "[DEBUG]", fmt, ##__VA_ARGS__)
#define LOGI(fmt, ...) LLM_LOG(LLM_LOG_INFO, "[INFO]", fmt, ##__VA_ARGS__)
#define LOGW(fmt, ...) LLM_LOG(LLM_LOG_WARNING, "[WARNING]", fmt, ##__VA_ARGS__)
#define LOGE(fmt, ...) LLM_LOG(LLM_LOG_ERROR, "[ERROR]", fmt, ##__VA_ARGS__)
#define LOGF(fmt, ...) LLM_LOG(LLM_LOG_FATAL, "[FATAL]", fmt, ##__VA_ARGS__)

// 跨平台路径处理
#ifdef LLM_OS_WINDOWS
#define LLM_PATH_SEPARATOR '\\'
#else
#define LLM_PATH_SEPARATOR '/'
#endif

static inline void join_path(char *out, size_t out_size, const char *dir, const char *filename)
{
	if (!dir || !*dir)
	{
		snprintf(out, out_size, "%s", filename ? filename : "");
		return;
	}
	if (!filename || !*filename)
	{
		snprintf(out, out_size, "%s", dir);
		return;
	}
	size_t dir_len = strlen(dir);
	if (dir[dir_len - 1] == LLM_PATH_SEPARATOR || filename[0] == LLM_PATH_SEPARATOR)
	{
		snprintf(out, out_size, "%s%s", dir, filename);
	}
	else
	{
		snprintf(out, out_size, "%s%c%s", dir, LLM_PATH_SEPARATOR, filename);
	}
}

#endif // LLM_UTILS_H_