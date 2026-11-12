// 화면 공용 부품. 웹 셸 전환(2026-10) 뒤 네이티브로 그리는 화면은 플레이어뿐이라 그 화면이 쓰는 버튼만 남겼다.
// 터치 전용이라 hover·focus 상태는 두지 않는다(CLAUDE.md 의 모바일 입력 규칙과 같다).
package com.aimmovie.car.ui.common

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.aimmovie.car.ui.theme.CarDimens
import com.aimmovie.car.ui.theme.Purple
import com.aimmovie.car.ui.theme.TextStrong

/** 주 버튼(btn_type1: 보라 채움) / 보조 버튼(btn_type2: 외곽선). 높이는 터치 최소치 이상. */
@Composable
fun CarButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    primary: Boolean = true,
    icon: ImageVector? = null,
    enabled: Boolean = true,
) {
    val content: @Composable () -> Unit = {
        if (icon != null) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(30.dp))
            Spacer(Modifier.width(10.dp))
        }
        Text(text, style = MaterialTheme.typography.labelLarge, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
    val sizeModifier = modifier.defaultMinSize(minWidth = 160.dp, minHeight = CarDimens.Touch)
    val padding = PaddingValues(horizontal = 28.dp, vertical = 12.dp)
    if (primary) {
        Button(
            onClick = onClick,
            enabled = enabled,
            modifier = sizeModifier,
            shape = RoundedCornerShape(8.dp),
            contentPadding = padding,
            colors = ButtonDefaults.buttonColors(containerColor = Purple, contentColor = TextStrong),
        ) { content() }
    } else {
        OutlinedButton(
            onClick = onClick,
            enabled = enabled,
            modifier = sizeModifier,
            shape = RoundedCornerShape(8.dp),
            contentPadding = padding,
            colors = ButtonDefaults.outlinedButtonColors(containerColor = Color.White.copy(alpha = 0.12f), contentColor = TextStrong),
        ) { content() }
    }
}
