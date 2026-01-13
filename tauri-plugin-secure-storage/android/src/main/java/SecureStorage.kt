package com.plugin.secure_storage

import android.app.Activity
import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

@InvokeArg
class SetArgs {
  var key: String? = null
  var value: String? = null
}

@InvokeArg
class KeyArgs {
  var key: String? = null
}

@TauriPlugin
class SecureStoragePlugin(private val activity: Activity): Plugin(activity) {

  private fun prefs(context: Context) = run {
    val masterKey = MasterKey.Builder(context)
      .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
      .build()

    EncryptedSharedPreferences.create(
      context,
      "secure_storage",
      masterKey,
      EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
      EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
  }

  @Command
  fun set(invoke: Invoke) {
    val args = invoke.parseArgs(SetArgs::class.java)
    val key = args.key
    val value = args.value

    if (key.isNullOrBlank()) {
      invoke.reject("Missing key")
      return
    }

    prefs(activity.applicationContext).edit().putString(key, value ?: "").apply()
    invoke.resolve(null)
  }

  @Command
  fun get(invoke: Invoke) {
    val args = invoke.parseArgs(KeyArgs::class.java)
    val key = args.key

    if (key.isNullOrBlank()) {
      invoke.reject("Missing key")
      return
    }

    val value = prefs(activity.applicationContext).getString(key, null)
    val ret = JSObject()
    ret.put("value", value)
    invoke.resolve(ret)
  }

  @Command
  fun delete(invoke: Invoke) {
    val args = invoke.parseArgs(KeyArgs::class.java)
    val key = args.key

    if (key.isNullOrBlank()) {
      invoke.reject("Missing key")
      return
    }

    prefs(activity.applicationContext).edit().remove(key).apply()
    invoke.resolve(null)
  }
}
