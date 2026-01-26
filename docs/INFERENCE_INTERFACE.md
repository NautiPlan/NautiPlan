# TaskPilot 推理核心 C API 接口说明

本文档描述了 TaskPilot 推理核心提供的 C 语言标准接口。该接口设计简洁，旨在方便各类高级脚本语言（如 Rust, TypeScript, Java, Python）通过 FFI 方式进行快速集成。

---

## 接口总览

| 模块                   | 头文件                     | 功能描述                              |
| :--------------------- | :------------------------- | :------------------------------------ |
| **通用 (Common)**      | `taskpilot_common_c_api.h` | 内存释放、全局初始化等                |
| **语言模型 (LLM)**     | `llm_c_api.h`              | 文本对话、流式输出、HTTP API 服务启动 |
| **向量化 (Embedding)** | `rag_c_api.h`              | 文本特征提取、向量生成                |
| **知识库 (RAG)**       | `rag_c_api.h`              | 文档导入、SQLite 向量检索             |

---

## 1. 通用接口 (Common)

通用接口定义在 `taskpilot_common_c_api.h` 中。

### 1.1 释放字符串

```c
void taskpilot_free_string(char *str);
```

- **功能**: 释放由 API 分配并返回给用户的字符串（通常通过 `malloc` 分配）。
- **参数**:
  - `str`: 指向需要释放的字符串指针。
- **注意**: 所有返回 `char *` 的非 `const` 接口在不再使用结果后，均需调用此接口释放内存。

---

## 2. 大语言模型接口 (LLM)

大语言模型接口定义在 `llm_c_api.h` 中。

### 2.1 类型定义

- `taskpilot_model_t`: LLM 模型实例句柄。
- `taskpilot_stream_callback`: 流式回调函数指针类型。
  - `void (*taskpilot_stream_callback)(const char *token, void *user_data)`

### 2.2 初始化模型

```c
taskpilot_model_t taskpilot_model_init(const char *config_path);
```

- **功能**: 根据指定的 JSON 配置文件初始化 LLM 模型实例。
- **参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `config_path` | `const char*` | 配置文件 `llm_config.json` 的路径（绝对或相对） |

- **返回**: 成功返回模型句柄 `taskpilot_model_t`，失败返回 `NULL`。

### 2.3 释放模型

```c
void taskpilot_model_release(taskpilot_model_t model);
```

- **功能**: 销毁模型实例并释放相关资源。
- **参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `model` | `taskpilot_model_t` | 需要销毁的模型句柄 |

### 2.4 生成响应 (同步/非流式)

```c
char *taskpilot_model_response(taskpilot_model_t model, const char *query);
```

- **功能**: 输入 Prompt，同步等待并获取完整的模型回复。
- **参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `model` | `taskpilot_model_t` | 模型句柄 |
  | `query` | `const char*` | 用户输入的提示词 |

- **返回**: 模型生成的完整回答字符串。**注意：需调用 `taskpilot_free_string` 释放**。

### 2.5 生成响应 (流式)

```c
void taskpilot_model_response_stream(taskpilot_model_t model, const char *query, taskpilot_stream_callback callback, void *user_data);
```

- **功能**: 以流式方式获取模型回复，每生成一个 token 就会触发一次回调。
- **参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `model` | `taskpilot_model_t` | 模型句柄 |
  | `query` | `const char*` | 用户输入的提示词 |
  | `callback` | `taskpilot_stream_callback` | 每次生成 token 时的回调函数 |
  | `user_data` | `void*` | 用户自定义指针，会原样传给回调函数 |

### 2.6 启动 API 服务器 (OpenAI 兼容)

```c
int taskpilot_api_server_start(taskpilot_model_t model, int port);
```

- **功能**: 启动一个阻塞式的 HTTP API 服务器。
- **兼容性**: 接口格式完全兼容 OpenAI。
- **支持端点**:
  - `POST /v1/chat/completions` (支持同步/流式)
  - `GET /` (状态检查)
- **参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `model` | `taskpilot_model_t` | 模型句柄 |
  | `port` | `int` | 服务器监听端口 |

- **返回**: `0` 表示正常运行，非 `0` 为启动失败。

### 2.7 获取服务器 API 地址

```c
const char *taskpilot_get_server_api_url(int port);
```

- **功能**: 获取指定端口的本地 API 基础访问地址。
- **返回**: 如 `"http://127.0.0.1:8080/v1"`。无需手动释放。

---

## 3. 向量提取接口 (Embedding)

向量提取接口定义在 `rag_c_api.h` 中。

### 3.1 类型定义

- `taskpilot_embedding_t`: Embedding 管理器实例句柄。

### 3.2 初始化 Embedding

```c
taskpilot_embedding_t taskpilot_embedding_init(const char *config_path);
```

- **功能**: 初始化向量提取模型。
- **参数**:
  - `config_path`: 向量模型的配置文件路径。
- **返回**: 成功返回句柄，失败返回 `NULL`。

### 3.3 释放 Embedding

```c
void taskpilot_embedding_release(taskpilot_embedding_t embedding);
```

- **功能**: 释放 Embedding 实例。

### 3.4 文本转向量 (Encode)

```c
int taskpilot_embedding_encode(taskpilot_embedding_t embedding, const char *text, float *out_vec, int *out_size);
```

- **功能**: 将一段文本转换为特征向量。
- **参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `embedding` | `taskpilot_embedding_t` | Embedding 句柄 |
  | `text` | `const char*` | 输入文本 |
  | `out_vec` | `float*` | 预先分配好的 float 数组缓冲区 |
  | `out_size` | `int*` | [输入] 缓冲区容量；[输出] 实际向量维度 |

- **返回**:
  - `0`: 成功。
  - `-4`: 缓冲区不足（此时 `out_size` 会被设为所需大小）。
  - `其他负数`: 内部错误。

---

## 4. 检索增强生成接口 (RAG)

检索增强生成接口定义在 `rag_c_api.h` 中。

### 4.1 类型定义

- `taskpilot_rag_t`: RAG 管理器句柄。

### 4.2 初始化 RAG

```c
taskpilot_rag_t taskpilot_rag_init(taskpilot_embedding_t embedding, const char *db_path);
```

- **功能**: 初始化 RAG 系统，关联向量引擎和数据库。
- **参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `embedding` | `taskpilot_embedding_t` | 已初始化的向量引擎句柄 |
  | `db_path` | `const char*` | SQLite 数据库存储路径 |

- **返回**: 成功返回 RAG 句柄，失败返回 `NULL`。

### 4.3 释放 RAG

```c
void taskpilot_rag_release(taskpilot_rag_t rag);
```

- **功能**: 销毁 RAG 实例并释放相关资源。注意：此接口不会自动释放传入的 `embedding` 句柄，需手动调用 `taskpilot_embedding_release`。

### 4.4 添加文档

```c
void taskpilot_rag_add_document(taskpilot_rag_t rag, const char *text, int chunk_size, int chunk_overlap);
```

- **功能**: 将长文本拆分为块并存入向量数据库中。
- **参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `rag` | `taskpilot_rag_t` | RAG 句柄 |
  | `text` | `const char*` | 源文档内容 |
  | `chunk_size` | `int` | 每个文档块的最大字符数 |
  | `chunk_overlap` | `int` | 块之间的重叠字符数 |

### 4.5 清空知识库

```c
void taskpilot_rag_clear(taskpilot_rag_t rag);
```

- **功能**: 删除当前数据库中存储的所有知识库文档片段（清空表内容）。

### 4.6 语义检索

```c
char *taskpilot_rag_retrieve(taskpilot_rag_t rag, const char *query, int top_k);
```

- **功能**: 根据查询语句在知识库中搜索最相关的 top_k 个结果。
- **参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `rag` | `taskpilot_rag_t` | RAG 句柄 |
  | `query` | `const char*` | 查询词 |
  | `top_k` | `int` | 返回的最相关块数量 |

- **返回**: 拼接后的相关文本块。**需调用 `taskpilot_free_string` 释放**。

---

## 5. 配置文件说明 (Configuration)

本项目依赖 JSON 格式的配置文件来引导模型加载和配置硬件后端。

### 5.1 推理配置 (config.json)

适用于 LLM 和 Embedding 模型。

```json
{
  "llm_model": "llm.mnn", // 模型图文件
  "llm_weight": "llm.mnn.weight", // 权重文件
  "backend_type": "cpu", // 运行后端: cpu, opencl, vulkan, qnn, nnapi
  "thread_num": 4, // 线程数
  "precision": "low", // 精度控制: normal, low, high
  "memory": "low" // 内存占用控制: normal, low
}
```

GPU 的 numThread 是一个 mask ，表示多种功能叠加：

- 1 ：禁止 AutoTuning
- 4 ：进行 AutoTuning （会较大地增加初始化耗时，但相应地，运行耗时会降低）
- 64 ：偏向于使用 buffer 数据类型
- 128 ：偏向于使用 image 数据类型，无法与 64 叠加
- 512 ：开启 batch record ，对于支持的设备，如高通芯片上有一定性能提升，8Gen3 上甚至能提升100%
  - 如果模型中存在 GPU 后端不支持的算子，开启时会无法回退，导致推理失败
  - 对于算力较弱的GPU，有可能性能劣化

### 5.2 模型参数 (llm_config.json)

通常由转换工具生成，定义了模型的具体架构参数（如 `hidden_size`, `layer_nums` 等）以及 `prompt_template`。

---

## 6. RAG + LLM 典型工作流

将 RAG 与 LLM 结合使用时，通常遵循以下流程：

1.  **初始化**: 分别初始化 LLM 模型、Embedding 引擎和 RAG 管理器。
2.  **构建知识库**: 使用 `taskpilot_rag_add_document` 将本地文档导入数据库。
3.  **检索**: 对于用户提出的 `query`，调用 `taskpilot_rag_retrieve` 获取相关上下文 `context`。
4.  **构造 Prompt**: 将 `context` 和 `query` 拼接成最终的 Prompt。例如：
    ```text
    请根据以下内容回答问题：
    【上下文】：...
    【问题】：...
    ```
5.  **生成**: 调用 `taskpilot_model_response` 获取最终回答。
6.  **清理**: 释放所有句柄。

---

## 7. 使用示例

### 7.1 LLM 基础对话示例

```c
#include "llm_c_api.h"
#include <stdio.h>

int main() {
    // 1. 初始化
    taskpilot_model_t model = taskpilot_model_init("models/Qwen2.5-1.5B/llm_config.json");
    if (!model) return -1;

    // 2. 推理
    char* result = taskpilot_model_response(model, "你好");
    if (result) {
        printf("Response: %s\n", result);
        // 3. 释放字符串
        taskpilot_free_string(result);
    }

    // 4. 释放模型
    taskpilot_model_release(model);
    return 0;
}
```

### 7.2 RAG + LLM 完整检索增强示例

```c
#include "llm_c_api.h"
#include "rag_c_api.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    const char* llm_cfg = "models/Qwen2.5-1.5B/llm_config.json";
    const char* emb_cfg = "models/bge-large-zh/config.json";
    const char* db_path = "taskpilot_kb.db";

    // 1. 初始化引擎
    taskpilot_model_t model = taskpilot_model_init(llm_cfg);
    taskpilot_embedding_t emb = taskpilot_embedding_init(emb_cfg);
    taskpilot_rag_t rag = taskpilot_rag_init(emb, db_path);

    if (!model || !emb || !rag) return -1;

    // 2. 导入知识 (通常只需导入一次，数据会持久化在 SQLite 中)
    const char* doc = "TaskPilot 推理核心是一个基于 MNN 的高性能本地推断库。";
    taskpilot_rag_add_document(rag, doc, 100, 10);

    // 3. 检索相关上下文
    const char* question = "TaskPilot 是什么？";
    char* context = taskpilot_rag_retrieve(rag, question, 1);

    // 4. 构造 RAG Prompt 并调用 LLM
    if (context) {
        char prompt[1024];
        snprintf(prompt, sizeof(prompt),
                 "请根据以下已知内容回答问题。\n内容：%s\n问题：%s",
                 context, question);

        char* response = taskpilot_model_response(model, prompt);
        if (response) {
            printf("AI 回答: %s\n", response);
            taskpilot_free_string(response);
        }
        taskpilot_free_string(context);
    }

    // 5. 释放资源
    taskpilot_rag_release(rag);
    taskpilot_embedding_release(emb);
    taskpilot_model_release(model);

    return 0;
}
```
