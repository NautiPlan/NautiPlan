fn main() {
    // 添加库搜索路径
    println!("cargo:rustc-link-search=native=libs");
    // 链接 bluelm 动态库
    println!("cargo:rustc-link-lib=dylib=bluelm");
    tauri_build::build()
}
