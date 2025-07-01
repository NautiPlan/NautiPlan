//
// Created by 11101476 on 2024/5/24.
//

#ifndef AIGC_LLM_BLUELM_H
#define AIGC_LLM_BLUELM_H

#include "llm_utils.h"
#include "llm_instance.h"


namespace vla {


    enum COMM_TYPE{   //交互方式
        BASE = 0,
        CHAT = 1
    };

    class llm_bluelm {

    public:

        llm_bluelm();

        ~llm_bluelm();

        LLM_CODE init();
        //对string进行处理
        std::string build_prompt(const std::string &str);


        LLM_CODE release();
        //清空历史缓存，结束对话
        LLM_CODE reset();

        LLM_CODE forward(const std::string &prompt, eval_callback eval_cb, void* data);

        void set_history(const std::string& ans) {  history_ += ans; }

    private:

        std::string history_ = "";

        //param for llm
        llm_params params_;
        // pointer to llm & tokenizer
        LLM_inference_manager *llm_instance_ = nullptr;
        COMM_TYPE comm_type_ = COMM_TYPE::CHAT;  //对话方式  CHAT 模型建议用CHAT

    };


}

#endif //AIGC_LLM_BLUELM_H
