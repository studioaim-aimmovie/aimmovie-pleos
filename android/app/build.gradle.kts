import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

// 릴리스 서명 설정.
// AimMovie/key.properties.example 을 key.properties 로 복사해 채운다.
// 앱 ID(com.aimmovie.car)가 모바일·TV(com.aimmovie)와 분리되어 있으므로 차량 앱 전용 키스토어를 쓴다.
val keystorePropertiesFile = rootProject.file("key.properties")
val hasReleaseKeystore = keystorePropertiesFile.exists()
val keystoreProperties = Properties().apply {
    if (hasReleaseKeystore) {
        FileInputStream(keystorePropertiesFile).use { load(it) }
    }
}

android {
    // applicationId 와 같게 맞춰 둔다 — deploy.sh 의 `am start -n <applicationId>/.MainActivity` 가
    // 앞점(.) 표기를 applicationId 기준으로 확장하기 때문이다(tv/androidtv 에서 겪은 문제).
    namespace = "com.aimmovie.car"
    compileSdk = 35

    defaultConfig {
        // 모바일·TV(com.aimmovie)와 분리한다. 코드베이스가 다른 앱이라 Firebase·Google 로그인처럼
        // "패키지명 + 서명 인증서"로 묶이는 설정이 섞이지 않게 하려는 것이다.
        applicationId = "com.aimmovie.car"
        // Pleos 문서 요구사항: 서명 키 rotation/lineage(APK 서명 v3.1)를 위해 28 이상.
        minSdk = 28
        // Pleos Connect Emulator 가 API 34 기반이다.
        targetSdk = 34
        // 모바일 1~999 / TV 1000~ / 차량 2000~ 으로 레인지를 분리해 관리한다.
        versionCode = 2000
        versionName = "0.1.0"

        // 미디어 CDN 은 web/mobile/tv 가 모두 같은 호스트를 쓴다(apps/tv/.env.production).
        buildConfigField("String", "CDN_URL", "\"https://cdn.aimmoviestream.com\"")
    }

    signingConfigs {
        if (hasReleaseKeystore) {
            create("release") {
                storeFile = rootProject.file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                // minSdk 28 이면 AGP 는 v2 만 서명한다. 나중에 키를 교체(rotation)할 수 있도록 v3 를 켠다.
                enableV3Signing = true
            }
        }
    }

    buildTypes {
        // CMS(API) 호스트. apps/tv 의 .env.development / .env.production 과 같은 축이다.
        //  - debug   : 로컬 CMS(aimmovie_admin, 8066)를 기기의 localhost 로 본다. `adb reverse tcp:8066 tcp:8066`
        //              (deploy.sh 가 자동으로 건다)로 기기의 8066 을 PC 로 넘기므로 에뮬레이터·USB 실기 모두 같은 주소로 된다.
        //              10.0.2.2 는 에뮬레이터 안에서만 호스트를 가리켜, 실기에서는 "네트워크 연결을 확인해주세요"가 뜬다.
        //              다른 PC·운영 CMS 를 보려면 `-Paim.apiRoot.debug=https://cms.aimmovie.com` 처럼 덮어쓴다.
        //  - release : 운영 CMS. 이 값이 그대로 스토어 APK 에 박혀 나간다.
        debug {
            val debugApiRoot = providers.gradleProperty("aim.apiRoot.debug").getOrElse("http://localhost:8066")
            buildConfigField("String", "API_ROOT", "\"$debugApiRoot\"")
        }
        release {
            buildConfigField("String", "API_ROOT", "\"https://cms.aimmovie.com\"")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            // key.properties 가 없으면 debug 키로 폴백한다(사이드로드 테스트용).
            // Pleos App Market 제출용 APK 는 반드시 key.properties 를 갖춘 상태에서 만든다.
            signingConfig = signingConfigs.getByName(if (hasReleaseKeystore) "release" else "debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

// 웹 번들(apps/pleos)은 scripts/build.sh → stage-web.sh 가 빌드 타입별 소스셋(src/<debug|release>/assets)에 넣는다.
// gradlew 를 바로 돌려 스테이징 없이 APK 를 만들면 WebView 가 빈 화면이 되므로 경고를 남긴다(테스트·lint 만 돌릴 때를 위해
// 실패시키지는 않는다).
tasks.matching { it.name == "assembleDebug" || it.name == "assembleRelease" }.configureEach {
    val variant = name.removePrefix("assemble").replaceFirstChar { it.lowercase() }
    val webIndex = file("src/$variant/assets/index.html")
    doFirst {
        if (!webIndex.exists()) {
            logger.warn("⚠️  $webIndex 가 없다 — 웹 번들 없이 APK 를 만든다. ./scripts/build.sh $variant 로 빌드할 것.")
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    debugImplementation("androidx.compose.ui:ui-tooling")

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    // 토큰 암호문 저장소. 암호화는 Keystore AES-GCM 으로 직접 한다(data/auth/KeystoreTokenStorage.kt).
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    // 웹 셸: 앱 번들을 https 가상 오리진(appassets.androidplatform.net)으로 서빙하는 WebViewAssetLoader.
    // 1.12 는 compileSdk 35 와 맞고 minSdk 21 이상을 지원한다.
    implementation("androidx.webkit:webkit:1.12.1")
    // 플레이어. 1.8.0 은 compileSdk 35 를 요구하며(aar-metadata minCompileSdk=35) 이 프로젝트와 맞는다.
    //  - hls: 비DRM 본편(hls_path) / dash: DRM 본편(dash_path + Widevine)
    //  - ui: PlayerView(영상 표면·비율 맞춤)만 쓰고 컨트롤은 Compose 로 직접 그린다(터치 76dp 기준).
    //    Compose 는 이제 재생 화면(PlayerActivity)에만 쓴다 — 나머지 화면은 웹 번들(apps/pleos)이다.
    //  - session: MediaSessionService — Pleos 필수 요건(시스템 미디어 컨트롤 play/pause/stop).
    val media3 = "1.8.0"
    implementation("androidx.media3:media3-exoplayer:$media3")
    implementation("androidx.media3:media3-exoplayer-hls:$media3")
    implementation("androidx.media3:media3-exoplayer-dash:$media3")
    implementation("androidx.media3:media3-ui:$media3")
    implementation("androidx.media3:media3-session:$media3")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    testImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")
}
