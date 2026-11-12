# kotlinx.serialization — @Serializable 클래스의 생성된 serializer 를 보존한다.
# (라이브러리가 consumer 규칙을 제공하지만, 브릿지·복원 기록(PlayRequest·WebSession)이 이 경로로 JSON 을 만들므로 명시해 둔다.)
-keepattributes *Annotation*, InnerClasses
-keepclassmembers @kotlinx.serialization.Serializable class ** {
    *** Companion;
    kotlinx.serialization.KSerializer serializer(...);
}

# 웹 브릿지(window.AimPleos). R8 이 @JavascriptInterface 메서드 이름을 바꾸거나 지우면 웹에서 undefined 가 된다.
-keepclassmembers class com.aimmovie.car.shell.ShellBridge {
    @android.webkit.JavascriptInterface <methods>;
}
