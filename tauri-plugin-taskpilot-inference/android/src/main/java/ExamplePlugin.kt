package com.plugin.taskpilot_inference

import android.app.Activity
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Plugin

@TauriPlugin
class ExamplePlugin(private val activity: Activity): Plugin(activity) {
}
