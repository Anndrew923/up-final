# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ---------------------------------------------------------------------------
# Design Intent: Capacitor discovers plugins via reflection (@Plugin / Bridge).
# Without keep rules, R8 strips or renames plugin entry points and Bridge
# crashes at runtime after minify is enabled for Play DEX obfuscation.
# ---------------------------------------------------------------------------

# Keep line numbers for crash reporting (mapping still applied by Play/R8).
-keepattributes SourceFile,LineNumberTable,Signature,InnerClasses,EnclosingMethod,*Annotation*
-renamesourcefileattribute SourceFile

# Capacitor core + Bridge reflection surface
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.Plugin* { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.PluginMethod class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod <methods>;
}

# Community / official Capacitor plugins used by this app
-keep class com.capacitorjs.plugins.** { *; }
-keep class com.getcapacitor.community.** { *; }
-keep class io.capawesome.capacitorjs.plugins.** { *; }

# Firebase (Auth / App Check via Capacitor Firebase plugins)
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# RevenueCat Purchases Capacitor
-keep class com.revenuecat.purchases.** { *; }
-keep class com.revenuecat.purchases.capacitor.** { *; }
-dontwarn com.revenuecat.purchases.**

# Cordova compatibility layer (Capacitor cordova plugins bridge)
-keep class org.apache.cordova.** { *; }
-keep class * extends org.apache.cordova.CordovaPlugin { *; }

# AndroidX / WebView JS bridges commonly touched by Capacitor
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# OkHttp / Gson used transitively by several SDKs
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn com.google.gson.**

# Optional Facebook Auth provider referenced by @capacitor-firebase/authentication
# but not bundled as a dependency in this app (Google/Apple only).
-dontwarn com.facebook.AccessToken
-dontwarn com.facebook.CallbackManager$Factory
-dontwarn com.facebook.CallbackManager
-dontwarn com.facebook.FacebookCallback
-dontwarn com.facebook.FacebookException
-dontwarn com.facebook.login.LoginManager
-dontwarn com.facebook.login.LoginResult
-dontwarn com.facebook.login.widget.LoginButton
