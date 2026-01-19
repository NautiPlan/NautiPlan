# taskpilot

## 快速启动（新）

运行 App，手机或模拟器，模型路径默认在 data/local/tmp/models，可使用 adb 命令如下

```
adb push "./tauri-plugin-taskpilot-inference/taskPilot-InferrenceCore/models/models/" "/data/local/tmp/"
```

## 环境要求

- apk 运行要求
  - 需带有 WebView 的安卓环境，实测安卓 14 环境下能正常运行

- 项目源代码运行要求 (Windows)
  - 至少包含 Win10 SDK 和 Visual Studio Build Tools 2022（版本 17.2 或更高）
  - 需要 Microsoft Visual C++ 2015-2022 Redistributable (x64) 和 Microsoft Visual C++ 2015-2022 Redistributable (x86)
  - Rust 1.70 及以上
  - Node.js LTS
  - Android SDK (至少包含 API 34)
  - Android NDK
  - 环境变量`ANDROID_HOME`、`JAVA_HOME`、`NDK_HOME`

  具体环境问题可参看[前置要求 | Tauri](https://tauri.app/zh-cn/start/prerequisites/)
