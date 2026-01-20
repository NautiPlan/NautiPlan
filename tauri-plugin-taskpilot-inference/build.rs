use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;

const COMMANDS: &[&str] = &[
    // LLM
    "llm_init",
    "llm_release",
    "llm_chat",
    "llm_chat_stream",
    "llm_server_start",
    "llm_server_url",
    "llm_status",
    // Embedding
    "embedding_init",
    "embedding_release",
    "embedding_encode",
    "embedding_status",
    // RAG
    "rag_init",
    "rag_release",
    "rag_add_document",
    "rag_clear",
    "rag_retrieve",
    "rag_status",
];

fn main() {
    let target = env::var("TARGET").unwrap_or_default();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap_or_default();
    let core_dir = PathBuf::from(&manifest_dir).join("taskPilot-InferrenceCore");

    if core_dir.exists() {
        println!("cargo:rerun-if-changed={}", core_dir.join("src").display());
        println!(
            "cargo:rerun-if-changed={}",
            core_dir.join("CMakeLists.txt").display()
        );
        println!(
            "cargo:rerun-if-changed={}",
            core_dir.join("CMakePresets.json").display()
        );

        if !target.contains("android") {
            println!(
                "cargo:warning=Skipping native core build for non-Android target: {}",
                target
            );
        } else {
            let (preset, abi) = if target.contains("aarch64") {
                ("android-arm64-opencl-release", "arm64-v8a")
            } else if target.contains("armv7") || target.contains("arm") {
                ("android-arm32-opencl-release", "armeabi-v7a")
            } else if target.contains("x86_64") {
                ("android-x86_64-opencl-release", "x86_64")
            } else if target.contains("i686") {
                ("android-x86-opencl-release", "x86")
            } else {
                panic!("Unsupported Android target for native build: {}", target);
            };

            println!(
                "cargo:warning=Building C++ core with preset: {} for ABI: {}",
                preset, abi
            );

            // Setup environment for Android
            if let Ok(ndk) = env::var("ANDROID_NDK")
                .or_else(|_| env::var("NDK_HOME"))
                .or_else(|_| env::var("ANDROID_NDK_HOME"))
            {
                env::set_var("ANDROID_NDK", &ndk);
            } else {
                panic!(
                    "Please set ANDROID_NDK, NDK_HOME or ANDROID_NDK_HOME environment variable for Android build"
                );
            }

            let status = Command::new("cmake")
                .arg("--preset")
                .arg(preset)
                .current_dir(&core_dir)
                .status()
                .expect("Failed to run cmake configure");
            if !status.success() {
                panic!("cmake configure failed for preset {}", preset);
            }

            let status = Command::new("cmake")
                .arg("--build")
                .arg("--preset")
                .arg(preset)
                .current_dir(&core_dir)
                .status()
                .expect("Failed to run cmake build");
            if !status.success() {
                panic!("cmake build failed for preset {}", preset);
            }

            let lib_dir = core_dir.join("build").join(preset);
            println!("cargo:rustc-link-search=native={}", lib_dir.display());

            // 告诉 Rust 链接 C++ 核心库
            println!("cargo:rustc-link-lib=dylib=taskPilot_InferenceCore");

            // Automatic Bundling for Android APK
            let jni_libs_dir = PathBuf::from(&manifest_dir)
                .join("android/src/main/jniLibs")
                .join(abi);
            std::fs::create_dir_all(&jni_libs_dir).ok();

            fn copy_so_recursive(src: &Path, dst: &Path) {
                if let Ok(entries) = std::fs::read_dir(src) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        let metadata = std::fs::symlink_metadata(&path).ok();
                        let file_type = metadata.map(|m| m.file_type());

                        if let Some(ft) = file_type {
                            if ft.is_dir() {
                                copy_so_recursive(&path, dst);
                            } else if ft.is_file() || ft.is_symlink() {
                                if path.extension().and_then(|s| s.to_str()) == Some("so") {
                                    if let Some(file_name) = path.file_name() {
                                        let dest_path = dst.join(file_name);
                                        if std::fs::copy(&path, &dest_path).is_ok() {
                                            println!(
                                                "cargo:warning=Bundled .so: {}",
                                                dest_path.display()
                                            );
                                            if let Some(parent) = path.parent() {
                                                println!(
                                                    "cargo:rustc-link-search=native={}",
                                                    parent.display()
                                                );
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            copy_so_recursive(&lib_dir, &jni_libs_dir);
        }
    } else {
        println!(
            "cargo:warning=taskPilot-InferrenceCore not found at {} (skipping native build)",
            core_dir.display()
        );
    }

    let mut builder = tauri_plugin::Builder::new(COMMANDS).android_path("android");
    if PathBuf::from(&manifest_dir).join("ios").exists() {
        builder = builder.ios_path("ios");
    }
    builder.build();
}
