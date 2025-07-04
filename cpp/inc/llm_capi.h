#ifndef LLM_CAPI_H
#define LLM_CAPI_H

#ifdef __cplusplus
extern "C"
{
#endif

    typedef void *BlueLMHandle;
    typedef int BlueLMResult;

#define BLUELM_SUCCESS 0
#define BLUELM_INVALID_HANDLE -1
#define BLUELM_THREAD_ERROR -2

    typedef void (*BlueLMCallback)(const char *result, void *user_data);

    // 日志级别设置API
    void bluelm_set_log_level(int level);

    BlueLMHandle bluelm_create();
    void bluelm_free(BlueLMHandle handle);
    BlueLMResult bluelm_init(BlueLMHandle handle);
    BlueLMResult bluelm_forward(BlueLMHandle handle, const char *prompt,
                                BlueLMCallback callback, void *user_data);
    BlueLMResult bluelm_reset(BlueLMHandle handle);

#ifdef __cplusplus
}
#endif

#endif // LLM_CAPI_H