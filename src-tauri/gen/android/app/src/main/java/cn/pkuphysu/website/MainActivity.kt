package cn.pkuphysu.website

import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)

    val safeAreaBridge = SafeAreaBridge(resources.displayMetrics.density)
    webView.addJavascriptInterface(safeAreaBridge, SAFE_AREA_BRIDGE_NAME)

    ViewCompat.setOnApplyWindowInsetsListener(webView) { _, windowInsets ->
      val safeArea = windowInsets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )
      val keyboard = windowInsets.getInsets(WindowInsetsCompat.Type.ime()).bottom
      safeAreaBridge.update(safeArea, keyboard)
      webView.evaluateJavascript(safeAreaBridge.updateScript(), null)
      windowInsets
    }
    ViewCompat.requestApplyInsets(webView)
  }

  private class SafeAreaBridge(private val density: Float) {
    @Volatile
    private var insets = Insets.NONE

    @Volatile
    private var keyboardBottom = 0

    fun update(value: Insets, keyboard: Int) {
      insets = value
      keyboardBottom = keyboard
    }

    @JavascriptInterface
    fun getInsets(): String = values()

    fun updateScript(): String = "window.__applyAndroidSafeAreaInsets?.(${values()})"

    private fun values(): String =
      listOf(insets.top, insets.right, insets.bottom, insets.left, keyboardBottom)
        .joinToString(",") { (it / density).toString() }
  }

  private companion object {
    const val SAFE_AREA_BRIDGE_NAME = "__TAURI_ANDROID_SAFE_AREA__"
  }
}
