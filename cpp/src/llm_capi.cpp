#include "llm_capi.h"
#include "llm_bluelm.h"
#include "llm_utils.h"
#include <thread>
#include <mutex>
#include <queue>
#include <atomic>
#include <memory>

struct CallbackContext
{
    std::mutex mutex;
    std::queue<std::string> results;
    std::atomic<bool> done{false};
    BlueLMCallback callback;
    void *user_data;

    CallbackContext(BlueLMCallback cb, void *ud)
        : callback(cb), user_data(ud)
    {
        LOGD("CallbackContext created");
    }

    ~CallbackContext()
    {
        LOGD("CallbackContext destroyed");
    }
};

extern "C"
{

    void bluelm_set_log_level(int level)
    {
        llm_log_level_ = level;
        LOGI("Set log level to %d", level);
    }

    BlueLMHandle bluelm_create()
    {
        LOGD("Creating new BlueLM instance");
        try
        {
            auto handle = new vla::llm_bluelm();
            LOGI("BlueLM instance created successfully");
            return handle;
        }
        catch (const std::exception &e)
        {
            LOGE("Failed to create BlueLM instance: %s", e.what());
            return nullptr;
        }
    }

    void bluelm_free(BlueLMHandle handle)
    {
        if (!handle)
        {
            LOGW("Attempt to free null handle");
            return;
        }

        LOGD("Freeing BlueLM handle");
        try
        {
            delete reinterpret_cast<vla::llm_bluelm *>(handle);
            LOGI("BlueLM handle freed successfully");
        }
        catch (const std::exception &e)
        {
            LOGE("Failed to free BlueLM handle: %s", e.what());
        }
    }

    BlueLMResult bluelm_init(BlueLMHandle handle)
    {
        if (!handle)
        {
            LOGE("Invalid handle in bluelm_init");
            return BLUELM_INVALID_HANDLE;
        }

        LOGD("Initializing BlueLM instance");
        try
        {
            auto result = static_cast<BlueLMResult>(
                reinterpret_cast<vla::llm_bluelm *>(handle)->init());

            if (result == BLUELM_SUCCESS)
            {
                LOGI("BlueLM initialized successfully");
            }
            else
            {
                LOGW("BlueLM initialization failed with code %d", result);
            }
            return result;
        }
        catch (const std::exception &e)
        {
            LOGE("Exception in bluelm_init: %s", e.what());
            return BLUELM_THREAD_ERROR;
        }
    }

    BlueLMResult bluelm_forward(BlueLMHandle handle, const char *prompt,
                                BlueLMCallback callback,
                                void *user_data)
    {
        if (!handle || !callback)
        {
            LOGE("Invalid parameters in bluelm_forward");
            return BLUELM_INVALID_HANDLE;
        }

        LOGD("Starting bluelm_forward with prompt: %s", prompt);

        try
        {
            auto context = std::make_unique<CallbackContext>(callback, user_data);

            std::thread([handle, prompt = std::string(prompt), ctx = context.release()]()
                        {
            LOGD("Worker thread started for prompt processing");
            
            auto* llm = reinterpret_cast<vla::llm_bluelm*>(handle);
            llm->forward(prompt, [](const std::string& result, void* data) {
                auto* ctx = static_cast<CallbackContext*>(data);
                {
                    std::lock_guard<std::mutex> lock(ctx->mutex);
                    ctx->results.push(result);
                    LOGV("Received intermediate result: %s", result.c_str());
                }
            }, ctx);

            {
                std::lock_guard<std::mutex> lock(ctx->mutex);
                ctx->done = true;
                LOGD("Worker thread completed processing");
            }
            
            // Process remaining results
            while (true) {
                std::string result;
                {
                    std::lock_guard<std::mutex> lock(ctx->mutex);
                    if (ctx->results.empty()) break;
                    result = ctx->results.front();
                    ctx->results.pop();
                }
                LOGD("Sending result to callback: %s", result.c_str());
                ctx->callback(result.c_str(), ctx->user_data);
            }
            
            delete ctx; })
                .detach();

            LOGI("bluelm_forward started successfully");
            return BLUELM_SUCCESS;
        }
        catch (const std::exception &e)
        {
            LOGE("Exception in bluelm_forward: %s", e.what());
            return BLUELM_THREAD_ERROR;
        }
    }

    BlueLMResult bluelm_reset(BlueLMHandle handle)
    {
        if (!handle)
        {
            LOGE("Invalid handle in bluelm_reset");
            return BLUELM_INVALID_HANDLE;
        }

        LOGD("Resetting BlueLM instance");
        try
        {
            auto result = static_cast<BlueLMResult>(
                reinterpret_cast<vla::llm_bluelm *>(handle)->reset());

            if (result == BLUELM_SUCCESS)
            {
                LOGI("BlueLM reset successfully");
            }
            else
            {
                LOGW("BlueLM reset failed with code %d", result);
            }
            return result;
        }
        catch (const std::exception &e)
        {
            LOGE("Exception in bluelm_reset: %s", e.what());
            return BLUELM_THREAD_ERROR;
        }
    }
}