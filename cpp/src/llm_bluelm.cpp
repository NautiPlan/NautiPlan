#include "llm_bluelm.h"


namespace vla {


    llm_bluelm::llm_bluelm() {

    }

    llm_bluelm::~llm_bluelm() {
        if (llm_instance_ != nullptr) {
            release();
        }
    }


    LLM_CODE llm_bluelm::init() {
        LLM_CODE res = LLM_SUCCESS;

        llm_instance_ = new LLM_inference_manager();
        if (llm_instance_ == nullptr) {
            LOGE("llm instance handle is nullptr ,  Init Failed");
            return LLM_INIT_MODEL;
        }
        params_.model_path   = "/data/local/tmp/2k_chat_dla";
        params_.n_ctx = 2048;
        comm_type_ = CHAT;

        llm_instance_->config(params_);
        res = llm_instance_->init();
        if (res != LLM_SUCCESS) {
            LOGE("llm_instance %s Init Failed",params_.model_path);
            return res;
        }else{
            LOGI("llm_instance Init success",params_.model_path);
        }

        return LLM_SUCCESS;
    }

    std::string llm_bluelm::build_prompt(const std::string &str) {
        if (comm_type_ == COMM_TYPE::BASE) { //普通模式下，prompt为当前输入
            history_ =  str;
            return history_;
        } else if (comm_type_ == COMM_TYPE::CHAT) {
            history_ += "[|Human|]: " + str + "[|AI|]:";
            return  "[|SYSTEM|]:你的中文名字叫蓝心小V，英文名字叫BlueLM Copilot。你是基于vivo蓝心大模型开发的。" + history_;
        }
        return "";
    }

    LLM_CODE llm_bluelm::forward(const std::string &prompt, eval_callback eval_cb, void* data) {
        if (llm_instance_ == nullptr) {
            LOGE("llm instance handle is nullptr ,  Init Failed");
            return LLM_INIT_MODEL;
        }
        llm_instance_->llm_reset();
        LLM_CODE ret = llm_instance_->forward(prompt, true, eval_cb, data);
        return ret;
    }



    LLM_CODE llm_bluelm::release() {
        LLM_CODE res = llm_instance_->release();
        delete llm_instance_;
        llm_instance_ = nullptr;
        return res;
    }

    LLM_CODE llm_bluelm::reset() {
        if (llm_instance_ == nullptr) {
            LOGE("llm instance handle is nullptr , please  reInit ");
            return LLM_INIT_MODEL;
        }
        LLM_CODE res = llm_instance_->llm_reset();
        history_ = "";
        return res;
    }



}