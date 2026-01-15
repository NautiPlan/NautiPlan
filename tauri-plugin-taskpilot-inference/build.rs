use std::env;
use std::process::Command;
use std::path::PathBuf;

fn main() {
    let target = env::var("TARGET").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let core_dir = PathBuf::from(&manifest_dir).join("../taskPilot-InferrenceCore");

    // 1. Determine which CMake preset to use
    let preset = if target.contains("android") {
        // Android targets: aarch64-linux-android, etc.
        if target.contains("aarch64") {
            "android-arm64-opencl-release"
        } else {
            "android-arm64-opencl-release" // Default to arm64 OpenCL as requested
        }
    } else if target.contains("linux") && !target.contains("android") {
        // Host Linux or Linux target: x86_64-unknown-linux-gnu, etc.
        "linux-x86_64-opencl-release"
    } else {
        // For other platforms (macOS, Windows), we might just skip or add more presets
        println!("cargo:warning=Skipping C++ core build for unsupported target: {}", target);
        return;
    };

    println!("cargo:warning=Building C++ core with preset: {}", preset);

    // 2. Setup environment for Android
    if target.contains("android") {
        let ndk = env::var("ANDROID_NDK")
            .or_else(|_| env::var("NDK_HOME"))
            .or_else(|_| env::var("ANDROID_NDK_HOME"))
            .expect("Please set ANDROID_NDK, NDK_HOME or ANDROID_NDK_HOME environment variable for Android build");
        env::set_var("ANDROID_NDK", &ndk);
    }

    // 3. Run CMake Configure
    let status = Command::new("cmake")
        .arg("--preset")
        .arg(preset)
        .current_dir(&core_dir)
        .status()
        .expect("Failed to run cmake configure");
    
    if !status.success() {
        panic!("cmake configure failed for preset {}", preset);
    }

    // 4. Run CMake Build
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

    // 5. Link the resulting library
    let lib_dir = core_dir.join("build").join(preset);
    println!("cargo:rustc-link-search=native={}", lib_dir.display());
    println!("cargo:rustc-link-lib=dylib=taskPilot_InferenceCore");

    // 6. Automatic Bundling for Android APK
    if target.contains("android") {
        let abi = if target.contains("aarch64") { "arm64-v8a" } else { "armeabi-v7a" };
        let jni_libs_dir = PathBuf::from(&manifest_dir)
            .join("android/src/main/jniLibs")
            .join(abi);
        
        std::fs::create_dir_all(&jni_libs_dir).ok();

        // Recursively find and copy all .so files from the build tree
        fn copy_so_recursive(src: &PathBuf, dst: &PathBuf) {
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
                                let file_name = path.file_name().unwrap();
                                let dest_path = dst.join(file_name);
                                
                                // For symlinks, we want to copy the actual file content
                                if let Ok(_) = std::fs::copy(&path, &dest_path) {
                                    println!("cargo:warning=Recursive Bundled .so: {:?}", file_name);
                                    // Also tell cargo to look into this directory for linking
                                    if let Some(parent) = path.parent() {
                                        println!("cargo:rustc-link-search=native={}", parent.display());
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Start recursion from the build output directory
        copy_so_recursive(&lib_dir, &jni_libs_dir);
    }

    // Add extra link libs that we know we need
    println!("cargo:rustc-link-lib=dylib=llm");
    println!("cargo:rustc-link-lib=dylib=MNN");

    // Tell cargo to rerun if any C++ files change or if the build dir changes
    println!("cargo:rerun-if-changed={}", core_dir.join("src").display());
    println!("cargo:rerun-if-changed={}", core_dir.join("CMakeLists.txt").display());

    // 7. Register plugin commands
    const COMMANDS: &[&str] = &[
        "llm_init",
        "llm_chat",
        "llm_release",
        "rag_init",
        "rag_retrieve",
        "rag_release",
    ];
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
