// bluelm_capi.cpp
#include "llm_capi.h"
#include "llm_bluelm.h"

// C++ -> C 回调适配器
static void cpp_callback_adapter(const std::string &result, void *data)
{
    auto wrapper = reinterpret_cast<std::pair<void (*)(const char *, void *), void *> *>(data);
    if (wrapper->first)
    {
        wrapper->first(result.c_str(), wrapper->second);
    }
}

extern "C"
{
    BlueLMHandle bluelm_create()
    {
        return new vla::llm_bluelm();
    }

    void bluelm_free(BlueLMHandle handle)
    {
        delete reinterpret_cast<vla::llm_bluelm *>(handle);
    }

    BlueLMResult bluelm_init(BlueLMHandle handle)
    {
        if (!handle)
            return BLUELM_INVALID_HANDLE;
        return static_cast<BlueLMResult>(
            reinterpret_cast<vla::llm_bluelm *>(handle)->init());
    }

    BlueLMResult bluelm_forward(BlueLMHandle handle, const char *prompt,
                                void (*callback)(const char *, void *),
                                void *user_data)
    {
        if (!handle)
            return BLUELM_INVALID_HANDLE;

        // 包装回调以兼容 C++
        std::pair wrapper(callback, user_data);
        return static_cast<BlueLMResult>(
            reinterpret_cast<vla::llm_bluelm *>(handle)->forward(
                prompt,
                [](const std::string &s, void *d)
                {
                    cpp_callback_adapter(s, d);
                },
                &wrapper));
    }

    BlueLMResult bluelm_reset(BlueLMHandle handle)
    {
        if (!handle)
            return BLUELM_INVALID_HANDLE;
        return static_cast<BlueLMResult>(
            reinterpret_cast<vla::llm_bluelm *>(handle)->reset());
    }
}