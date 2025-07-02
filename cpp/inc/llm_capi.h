// bluelm_capi.h
#ifndef BLUELM_CAPI_H
#define BLUELM_CAPI_H

#ifdef __cplusplus
extern "C"
{
#endif

    // 不透明指针类型（隐藏 C++ 实现细节）
    typedef void *BlueLMHandle;

    // 错误码兼容 C
    typedef enum
    {
        BLUELM_SUCCESS = 0,
        BLUELM_INIT_FAILED = 1,
        BLUELM_INVALID_HANDLE = 2
    } BlueLMResult;

    // C 接口函数
    BlueLMHandle bluelm_create();
    void bluelm_free(BlueLMHandle handle);

    BlueLMResult bluelm_init(BlueLMHandle handle);
    BlueLMResult bluelm_forward(BlueLMHandle handle, const char *prompt,
                                void (*callback)(const char *, void *), void *user_data);
    BlueLMResult bluelm_reset(BlueLMHandle handle);

#ifdef __cplusplus
}
#endif

#endif // BLUELM_CAPI_H