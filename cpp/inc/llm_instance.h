#ifndef _LLM_INSTANCE_H_
#define _LLM_INSTANCE_H_

#include <string>
#include <vector>

typedef void* LLM_HANDLE;
typedef void* VIT_HANDLE;
typedef void* LLM_params_ptr;
typedef void* Tokenizer_ptr;

#define VCAP_LLM_API __attribute__((visibility("default")))

namespace vla {

enum LLM_RUNTIME{
    DX4_APU     =   0,
    QCOM_NPU    =   1,
    VCAP        =   2
};

enum ModelType{
    BlueLM_3B    =   0,
    BlueLM_1B    =   1,
    BlueLM_7B    =   2,
    BlueLM_13B   =   3,
    BlueLM_V_3B  =   4
};

/*
const std::string&为推理出的词
void*为指向自定义的数据指针
*/
typedef std::function<void(const std::string&, void*)> eval_callback;
struct llm_params
{
    char* model_path;
    // 对应LLM_RUNTIME
    int runtime = DX4_APU;
    // 上下文后缀，e.g：512c, 2048c
    const char* context_suffix =""; //unused

    // bluelm模型用不到这两个参数
    char* vocab_json_path;
    char* merges_path;

    int model_type = BlueLM_7B;
    int seed      = 1024;
    int n_threads = 4;
    int n_predict = 100;
    int n_batch   = 512;
    int n_ctx     = 512;
    // NPU 档位，高通给0 - 8, MTK给10 - 100
    int npu_power = 100;

    bool logits_all = false;
    bool embedding  = false;
    bool use_token_id = false;

    std::string input_name = "";
    std::string output_name = "";

    int compute_type = 6;//llm::COMPUTE_TYPE_INT8;
    int storage_type = 1;//llm::COMPUTE_TYPE_FLOAT32;
    int lora_dtype = 0;

    int tokenizer_type = 1; // 0 fast(bloom) 1 bluelm

    // sampling parameters
    int32_t top_k = 1;
    float   top_p = 1.0f;
    float   temp  = 1.0f;
    float   repeat_penalty  = 1.0f;
    int parallel_decode_type = 0; // 0: base, 1: lookahead, 2: ssd, 3: spd
    int context_cache_type = 0; // 0: default, 1: multi-round cache, 2: sliding window cache, 3: prompt cache

    std::string platformName = "SM8650";
};

enum LLM_CODE{
    LLM_SUCCESS               = 0,
    LLM_INIT_MODEL            = 1,
    LLM_HANDLE_ERROR          = 2,
    LLM_PROMPT_TOO_LONG       = 3,
    LLM_EVAL_FAIL             = 4,
    LLM_UPDATE_FAIL           = 5,
    LLM_RELEASE_FAIL          = 6,
    LLM_CONFIG_DEFAULT_FAIL   = 7,
    LLM_INTERRUPTED           = 8,
    LLM_LORA_CONFIG_ERROR     = 9,
};

class VCAP_LLM_API LLM_inference_manager {
public:
    LLM_inference_manager();

    ~LLM_inference_manager();

    /*
    BlueLM初始化
    params : 配置参数
    return : SUCCESSE 0
    */
    void config(const llm_params& params);

    /*
    BlueLM初始化
    params : 配置参数
    return : SUCCESSE 0
    */
    LLM_CODE init();


    /*
    BlueLM推理
    prompt : 被BlueLM使用的提示词
    bos : 是否再prompt前插入bos字符
    eval_cb : 获取结果的回调函数
    return : SUCCESS 0
    */
    LLM_CODE forward(std::string prompt, bool bos, eval_callback eval_cb, void* data);



    /*
    BlueLM释放
    ctx :BlueLM句柄
    */
    LLM_CODE release();



    LLM_CODE llm_reset();



private:
    LLM_HANDLE ctx_handle_ = nullptr;
    LLM_params_ptr params_;
    std::vector<int> embds_;
    std::vector<int> last_n_tokens_;
    int n_past_ = 0;
    void* backend_ = nullptr;
};

}  // namespace vla

#endif