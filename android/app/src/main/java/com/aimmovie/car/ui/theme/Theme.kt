package com.aimmovie.car.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// web/src/styles/globals.scss 의 색 토큰. 이름 옆 주석이 scss 변수명이다.
val Purple = Color(0xFFA262FF) // $point_1
val Cyan = Color(0xFF5EECFF) // $mint_1
val Background = Color(0xFF151A23) // $black_1 — res/values/colors.xml 의 background 와 같은 값
val Surface = Color(0xFF1E232F)
val SurfaceHigh = Color(0xFF282F3B) // $gray_4 — 카드·패널 바탕
val Divider = Color(0xFF333D4A) // $gray_9
val TextPrimary = Color(0xFFD4D4D4) // $gray_6
val TextStrong = Color(0xFFFFFFFF) // $white_1
val TextSecondary = Color(0xFF909AAA) // $gray_cool — 안내·각주·부가 정보
val Danger = Color(0xFFFF778D) // $red_1 — 실패·오류

private val AimColorScheme = darkColorScheme(
    primary = Purple,
    secondary = Cyan,
    background = Background,
    surface = Surface,
    surfaceVariant = SurfaceHigh,
    surfaceContainer = Surface,
    surfaceContainerHigh = SurfaceHigh,
    outline = Divider,
    error = Danger,
    onPrimary = Color.White,
    onSecondary = Color.Black,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    onSurfaceVariant = TextSecondary,
)

/**
 * 차량 화면용 글자 크기. 운전석에서 팔 길이만큼 떨어져 보므로 휴대폰 기본값(본문 16sp)보다 한 단계씩 키운다
 * (Pleos UI 가이드: 쉽게 읽히는 글자). 가장 작은 보조 문구도 18sp 아래로 내리지 않는다.
 */
private val AimTypography = Typography(
    displaySmall = TextStyle(fontSize = 44.sp, lineHeight = 52.sp, fontWeight = FontWeight.Bold),
    headlineLarge = TextStyle(fontSize = 40.sp, lineHeight = 48.sp, fontWeight = FontWeight.Bold),
    headlineMedium = TextStyle(fontSize = 34.sp, lineHeight = 42.sp, fontWeight = FontWeight.Bold),
    headlineSmall = TextStyle(fontSize = 30.sp, lineHeight = 38.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontSize = 28.sp, lineHeight = 36.sp, fontWeight = FontWeight.Bold),
    titleMedium = TextStyle(fontSize = 24.sp, lineHeight = 32.sp, fontWeight = FontWeight.SemiBold),
    titleSmall = TextStyle(fontSize = 22.sp, lineHeight = 30.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontSize = 22.sp, lineHeight = 32.sp),
    bodyMedium = TextStyle(fontSize = 20.sp, lineHeight = 29.sp),
    bodySmall = TextStyle(fontSize = 18.sp, lineHeight = 26.sp),
    labelLarge = TextStyle(fontSize = 22.sp, lineHeight = 28.sp, fontWeight = FontWeight.SemiBold),
    labelMedium = TextStyle(fontSize = 20.sp, lineHeight = 26.sp, fontWeight = FontWeight.Medium),
    labelSmall = TextStyle(fontSize = 18.sp, lineHeight = 24.sp, fontWeight = FontWeight.Medium),
)

/** 화면 공통 치수. */
object CarDimens {
    /** 최소 터치 영역. Pleos UI 가이드의 "충분한 터치 영역" 취지에 맞춰 Material 기본(48dp)보다 넉넉히 둔다. */
    val Touch = 76.dp
}

/** 앱은 다크 테마 하나만 쓴다(웹 번들과 같다). */
@Composable
fun AimMovieTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = AimColorScheme, typography = AimTypography, content = content)
}
