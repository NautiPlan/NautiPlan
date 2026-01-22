# taskPilot-InferrenceCore

TaskPilot 推理核心 (Inference Core) 是一个基于 [MNN](https://github.com/alibaba/MNN) 框架的高性能本地人工智能推断库。它专为端侧设备优化，旨在提供低延迟、高隐私的大模型运行环境。

---

## 🚀 核心功能 (Key Features)

- 🤖 **大语言模型 (LLM/VLM)**: 支持 Qwen, Llama, Phi 等主流模型，适配视觉语言模型 (VLM)。
- 📚 **知识库增强 (RAG)**: 内置 SQLite 向量数据库，支持本地文档的语义检索与知识问答。
- 🔌 **标准接口**: 提供纯 C 语言接口，易于集成到 Flutter, Rust (Tauri), C#, Java (JNI) 等各种环境中。
- ⚡ **硬件加速**: 深度适配 CPU, GPU, 以及部分 NPU。

---

## 📊 硬件支持与精度

以下内容引用自MNN仓库：

MNN适配的硬件架构与精度详见下表：

- S ：支持，深度优化并已有应用场景，推荐使用
- A ：支持，有初步优化或已有应用场景，可以使用
- B ：支持，无优化或在实验状态，不推荐使用
- C ：不支持

| Architecture / Precision |                | Normal | FP16        | BF16       | Int8 / Int4 |
| ------------------------ | -------------- | ------ | ----------- | ---------- | ----------- |
| CPU                      | Native         | B      | C           | B          | B           |
|                          | x86/x64-SSE4.1 | A      | C           | C          | A           |
|                          | x86/x64-AVX2   | S      | C           | C          | A           |
|                          | x86/x64-AVX512 | S      | C           | C          | S           |
|                          | ARMv7a         | S      | S (ARMv8.2) | S          | S           |
|                          | ARMv8          | S      | S (ARMv8.2) | S(ARMv8.6) | S           |
| GPU                      | OpenCL         | A      | S           | C          | S           |
|                          | Vulkan         | A      | A           | C          | A           |
|                          | Metal          | A      | S           | C          | S           |
|                          | CUDA           | A      | S           | C          | A           |
| NPU                      | CoreML         | A      | C           | C          | C           |
|                          | HIAI           | A      | C           | C          | C           |
|                          | NNAPI          | B      | B           | C          | B           |
|                          | QNN            | C      | B           | C          | C           |

注意：本仓库在32位环境下不支持HTTP相关服务

## 📂 目录概览 (Directory Structure)

```text
taskPilot-InferrenceCore/
├── src/                # 核心源代码
│   ├── llm/            # 大语言模型 (LLM) 推理封装与 C API 实现
│   ├── rag/            # 检索增强生成 (RAG) 与 Embedding 相关逻辑
│   └── common/         # 跨模块通用 C API 抽象
├── thirdparty/         # 内置依赖库 (源码集成)
│   ├── MNN/            # 阿里巴巴高性能推理引擎
│   ├── sqlite/         # RAG 向量存取的轻量级数据库
│   ├── spdlog/         # 高性能 C++ 日志库
│   ├── json/           # nlohmann/json 序列化工具
│   └── cpp-httplib/    # 兼容 OpenAI 的 HTTP API 服务组件
├── test/               # 功能测试与开发示例
│   ├── llm_api_test.cpp        # 演示如何调用 LLM 对话接口
│   └── rag_llm_integration.cpp # 演示 RAG + LLM 完整生产线流程
├── models/             # 模型存放目录
│   └── download.py     # 模型一键下载脚本 (基于 ModelScope)
├── CMakeLists.txt      # 全局 CMake 构建脚手架
└── CMakePresets.json   # 核心预设配置 (包含 Android/Linux 各平台优化参数)
```

---

## 🛠️ 模型准备 (Model Preparation)

本项目支持的模型需要经过 MNN-LLM 格式转换。为了方便快速开始，我们提供了一键下载脚本。

### 1. 下载预置模型

预置模型集成了 Qwen2.5 对话模型与 BGE 向量模型：

```bash
# 确保已安装 modelscope: pip install modelscope
python3 models/download.py
```

下载后的模型将自动存放于 `models/` 目录下，结构如下：

```text
models/
├── Qwen2.5-1.5B-Instruct-MNN/  # LLM 模型
└── bge-large-zh-MNN/           # Embedding 模型
```

### 2. 模型结构规范

每个模型文件夹（建议存放于 `models/`）必须包含以下核心文件：

```text
models/Qwen2.5-1.5B/
├── config.json          # 推理引擎配置 (后端选择、线程数、精度等)
├── llm_config.json      # 模型层数、Hidden Size 等架构细节
├── llm.mnn              # MNN 模型计算图
└── llm.mnn.weight       # 模型权重
```

### 3. 自行转换模型

若需将其它格式生成的模型转换为 MNN 格式，请参考 [MNN-LLM 官方转换文档](https://mnn-docs.readthedocs.io/en/latest/transformers/llm.html)。

---

## 🏗️ 构建指南 (Build)

### 1. 环境依赖

- **CMake**: >= 3.22
- **编译器**:
  - Android: NDK r21+
  - Linux: GCC 9+ / Clang 11+
  - Windows: MSVC 2019+
- **生成器**: Ninja (推荐) 或 Make

### 2. 使用 CMake Presets 构建 (推荐)

由于设置的编译参数较多，本仓库推荐使用 **CMake Presets** 进行一键配置与编译。

#### 查看可用 Preset

```bash
cmake --list-presets
```

#### 标准构建流程 (以 Linux 为例)

```bash
# 1) 一键配置
cmake --preset linux-x86_64-opencl-release

# 2) 一键编译
cmake --build --preset linux-x86_64-opencl-release
```

### 3. 如何选择合适的 Preset？

项目的 Preset 命名遵循 `{platform}-{arch}-{backend}-{type}` 格式。您可以根据下表逻辑快速定位：

#### Step 1: 确定目标平台 (Platform)

- **Linux**: 开发测试首选。
- **Android**: 移动端部署。

#### Step 2: 确定硬件架构 (Arch)

- **x86_64**: 现代 PC/服务器 CPU。
- **arm64**: 现代 Android 手机、Apple Silicon (M1/M2/M3)。
- **arm32**: 旧款或低功耗嵌入式设备。

#### Step 3: 选择后端加速 (Backend)

| 后端 (Backend)    |  推荐指数  | 描述                                                                   |
| :---------------- | :--------: | :--------------------------------------------------------------------- |
| `release`/`debug` |    ⭐⭐    | **仅 CPU**。不依赖 GPU 驱动，兼容性最强，适合调试。                    |
| `opencl`          | ⭐⭐⭐⭐⭐ | **通用 GPU 加速**。在 Android 和大部分 PC 显卡上表现极佳，兼容性极好。 |
| `vulkan`          |  ⭐⭐⭐⭐  | **现代 GPU 加速**。跨平台图形接口，在较新的移动设备上性能强劲。        |
| `metal`           | ⭐⭐⭐⭐⭐ | **iOS/macOS 专属**。苹果设备硬件加速的最佳选择。                       |
| `cuda`            | ⭐⭐⭐⭐⭐ | **NVIDIA 专用**。Linux 环境下配备英伟达显卡的高性能首选。              |
| `qnn`             | ⭐⭐⭐⭐⭐ | **高通 NPU 极致加速**。专为骁龙 8 Gen 2/3 及更新系列设计的深度加速。   |
| `nnapi`           |   ⭐⭐⭐   | **Android 系统加速**。利用系统的神经网络 API 调度 CPU/GPU/NPU。        |
| `coreml`          |  ⭐⭐⭐⭐  | **iOS NPU 加速**。苹果 A 系列及 M 系列芯片的 NPU 加速方案。            |

> **最佳实践**：
>
> - **Android 开发**：首选 `android-arm64-opencl-release` 进行初步测试。
> - **本地 Linux 调试**：使用 `linux-x86_64-opencl-release`。

---

### 4. 产物位置

编译生成的动态库通常位于 `build/{preset_name}/` 目录下。

---

## 🧪 功能测试 (Testing)

启用测试程序可以快速验证当前编译产物在目标环境（尤其是移动加速后端）下是否工作正常。

### 1. 开启编译选项

通过 `-DTASKPILOT_INFERENCECORE_BUILD_TESTS=ON` 开启：

```bash
cmake --preset <your-preset> -DTASKPILOT_INFERENCECORE_BUILD_TESTS=ON
cmake --build --preset <your-preset>
```

### 2. Android 自动化部署与测试

为了简化操作，我们在 `test/upload.sh` 中提供了自动化部署逻辑，支持一键上传库文件、测试程序及模型。

#### 自动化部署脚本

1. **核对路径**：检查 `test/upload.sh` 中的 `BUILD_PATH` 和 `MODEL_NAME` 是否符合您的实际情况。
2. **一键上传**：
   ```bash
   bash test/upload.sh
   ```
   该脚本会将以下核心程序上传至设备 `/data/local/tmp/taskPilot`：
   - `llm_direct_model_test`: 基础对话能力测试。
   - `llm_api_server_test`: OpenAI 兼容 HTTP 服务测试。
   - `rag_test`: 向量数据库与检索测试。
   - `libtaskPilot_InferenceCore.so`: 核心动态库。

#### 手动运行指令

上传至 `/data/local/tmp/taskPilot` 后，通过 adb 进入 shell 运行：

```bash
adb shell
cd /data/local/tmp/taskPilot

# 1. 授权
chmod +x llm_direct_model_test

# 2. 设置环境 (加载当前目录下的 so 库)
export LD_LIBRARY_PATH=$PWD:$LD_LIBRARY_PATH

# 3. 查看 MNN 详细初始化信息 (可选)
export MNN_PRINT_DEBUG_INFO=1

# 4. 运行推理测试
./llm_direct_model_test models/Qwen2.5-1.5B-Instruct-MNN
```

---

## 🚀 NPU 加速专项建议

对于 NPU 后端（如 QNN/NNAPI），情况相对复杂，涉及特定的 SoC ID 与驱动版本匹配。建议在调试前详细阅读 [MNN 硬件加速文档](https://mnn-docs.readthedocs.io/en/latest/transformers/llm.html)。

---

## 🔌 API 说明

本仓库导出了 C API 接口能力，可供 Tauri 插件（`tauri-plugin-taskpilot-inference`）在 Android 上调用，也可以直接作为 C 动态库进行二次开发。

详细接口说明请参阅：[INFERENCE_INTERFACE.md](INFERENCE_INTERFACE.md)
