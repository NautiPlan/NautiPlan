# NautiPlan

## 环境要求

- apk 运行要求

  - 需带有 WebView 的安卓环境，实测安卓 14 和云真机环境下能正常运行
  - 端侧版本需要在与云真机相同的模型环境下运行

- 项目源代码运行要求 (Windows)

  - 至少包含 Win10 SDK 和 Visual Studio Build Tools 2022（版本 17.2 或更高）
  - 需要 Microsoft Visual C++ 2015-2022 Redistributable (x64) 和 Microsoft Visual C++ 2015-2022 Redistributable (x86)
  - Rust 1.70 及以上
  - Node.js LTS
  - Android SDK (至少包含 API 34)
  - Android NDK
  - 环境变量`ANDROID_HOME`、`JAVA_HOME`、`NDK_HOME`

  具体环境问题可参看[前置要求 | Tauri](https://tauri.app/zh-cn/start/prerequisites/)

## 快速启动

本项目的常规版本在`main`分支，端侧版本在`edgellm`分支，使用`git checkout <分支名>`切换分支

以下命令均在项目根目录下执行

首先，下载依赖

```
npm install
```

进行初始化

```
npm run tauri android init
```

常规版本热调试(由于框架原因，仅支持安卓虚拟机)

```
npm run tauri android dev
```

常规版本打包

```
npm run tauri android build
```

端侧版本由于动态库的存在，暂不支持热调试

端侧版本打包

```
npm run tauri android build -- --target aarch64
```

默认打包均为未签名版本，若需要打包可直接安装的apk，请自行签名，或在参看[安卓代码签名 | Tauri](https://tauri.app/zh-cn/distribute/sign/android/)



## 端侧额外配置

端侧应用在进行快速启动之前，还需要额外设置

### 编译端侧动态库

makefile会调用cmake，使用NDK进行编译生成，需要设置环境变量$(NDK_HOME)，配置NDK目录

使用cmake和NDK生成nijia文件

```
make gen
```

使用nijia进行编译

```
make build
```

### 将端侧库添加到依赖

我们需要将生成的动态库移动到指定位置，以便于tauri能够将他们打包至生成的APK中

使用命令可以将库一键搬运至指定目录

```
make install
```

