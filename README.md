# TaskPilot

<p align="center">
  <img src="img/logo.png" alt="TaskPilot Logo" width="200">
</p>

<p align="center">
  <strong>基于端云协同与检索增强生成的个人任务规划系统</strong>
</p>

<p align="center">
  <em>AI Agent 驱动的智能规划助手，贯穿"计划制定—执行辅助—结果复盘"完整闭环</em>
</p>


## 项目简介

TaskPilot 是一套面向个人学习与任务管理场景的智能计划辅助系统。系统以 **Agent 机制**为核心，对用户输入进行理解与任务建模，辅助用户完成从目标设定到计划执行的全过程管理。

系统围绕用户的实际使用流程，构建了从计划制定到执行管理再到结果复盘的完整功能闭环，通过 **端云协同架构**与 **本地 RAG 能力**，在保障隐私安全的前提下，实现更加贴合个体差异的长期智能支持。


## 核心功能

### 智能计划生成与管理

- 支持**多模态输入**（文本、音频、图像）理解与整合
- 预设多种科学学习方法（艾宾浩斯遗忘曲线、帕累托法则等）辅助计划生成
- 结构化输出计划内容，自动拆解为阶段与任务节点
- 支持云端模式与端侧模式灵活切换

### 任务执行辅助与时间管理

- 任务列表管理与状态追踪（待执行、进行中、已完成）
- 番茄钟专注模式，沉浸式心流界面
- 动态优先级排序算法，综合重要度与时间成本智能排序
- 智能资源推荐，自动推送相关学习资料

### 信息整合与数据复盘

- 日历视图可视化展示任务安排与执行情况
- 月度报告功能，阶段性总结执行效果
- 本地知识库积累历史数据，支持长期行为分析

### 端侧模型与知识资源管理

- 本地 LLM 与 Embedding 模型下载、切换与管理
- 多推理后端支持（CPU、GPU、NPU）
- 本地 RAG 知识库构建与维护
- 个人资料、计划模板、月度总结等知识资源录入

## 系统架构

![architecture.drawio](img/architecture.drawio.svg)

系统采用**端云协同的模块化架构**：

### 表现层

**技术栈**: React + TypeScript + Zustand + Vite

- UI 业务层：组件化视图与交互响应，多模态输入处理
- Zustand 状态层：任务、计划、计时器、模型配置等状态统一管理

### 后端/插件层

**技术栈**: Rust + Tauri + 原生 Kotlin

- 主后端：云端 API 调用、Json Schema 定义、Web Search 逻辑
- Taskpilot Inference 插件：端侧模型能力的 Rust 封装
- Secure Store 插件：基于 AndroidX Security 的加密存储

### 端侧模型层

**技术栈**: MNN 推理框架 + C API

- 支持 LLM、VLM、MLLM、Embedding 多种模型
- 多后端适配（CPU、GPU、NPU）
- 模型微调与量化优化


## AI Agent 工作流

<p align="center">
  <img src="img/inferrence_workflow.drawio.svg" alt="AI工作流示意图" width="600">
</p>

系统引入 **Agent 机制**作为 AI 能力调度与编排的核心：

- **Agent**：统一调度入口，根据任务类型编排执行流程
- **Skills**：多模态理解、本地知识检索（RAG）、联网信息获取、内容生成等能力抽象
- **MCP 协议**：工具调用标准化，确保 AI 行为可控、可预测
- **Json Schema**：结构化输出约束，保证生成结果可解析


## 技术特性

### 端云协同推理

- 智能切换本地模型与云端服务
- 弱网/无网环境下基础功能可用
- 隐私敏感数据本地处理

### 本地 RAG 能力

- 本地向量知识库存储个人资料、历史计划、月度总结
- 检索增强生成，优先参考用户历史偏好
- 无需上传个人数据即可实现个性化推荐

### 多后端推理适配

基于 MNN 框架，支持多种硬件加速：

| 后端              | 平台支持              |
| ----------------- | --------------------- |
| CPU               | 全平台通用            |
| GPU OpenCL/Vulkan | Android/Linux/Windows |
| GPU CUDA          | Linux/Windows         |
| GPU Metal         | iOS/Mac               |
| NPU NNAPI         | Android               |
| NPU CoreML        | iOS/Mac               |

### 跨平台架构

基于 Tauri 构建，核心优势：

- 应用体积小（相比 Electron 大幅缩减）
- 资源占用低，运行效率高
- Rust 后端高性能、内存安全
- 核心业务代码跨平台复用


## 技术栈概览

| 层级     | 技术                               |
| -------- | ---------------------------------- |
| 前端框架 | React 18 + TypeScript              |
| 状态管理 | Zustand                            |
| UI 组件  | Ant Design Mobile + TDesign Mobile |
| 构建工具 | Vite                               |
| 应用框架 | Tauri 2                            |
| 后端语言 | Rust                               |
| 推理框架 | MNN                                |
| 模型支持 | Qwen（云端/端侧）                  |
| 数据库   | SQLite                             |
| 安全存储 | AndroidX Security                  |



## 项目结构

```
NautiPlan/
├── src/                    # 前端源码
│   ├── pages/              # 页面组件
│   ├── components/         # 通用组件
│   ├── store/              # Zustand 状态管理
│   └── utils/              # 工具函数
├── src-tauri/              # Tauri 后端
│   ├── src/                # Rust 源码
│   └── capabilities/       # 权限配置
├── tauri-plugin-taskpilot-inference/  # 端侧推理插件
│   ├── src/                # Rust 封装
│   └── taskPilot-InferrenceCore/      # C++ MNN 封装
├── tauri-plugin-secure-storage/       # 安全存储插件
├── docs/                   # 技术文档
├── img/                    # 图片资源
└── public/                 # 静态资源
```

## 相关文档

- [动态优先级算法详解](docs/DYNAMIC_PRIORITY_LOGIC.md)
- [端侧推理插件集成指南](docs/INFERENCE_PLUGIN.md)
- [端侧推理核心 (C++) 开发规范](docs/INFERENCE_CORE.md)
- [推理核心 C 接口文档](docs/INFERENCE_INTERFACE.md)
- [安全存储插件使用指南](docs/SECURE_STORAGE.md)

## TODO

- 实现OpenAI通用接口的接入，而不是现在与阿里百炼平台绑定
- 实现现阶段支持Andriod APP，未来将增加桌面端
- AI推理流程升级，改为angent模型，提高生成质量

<p align="center">
  <em>TaskPilot — 让智能规划真正落地，陪伴你的成长之路</em>
</p>
