// 원본: packages/core/src/types/contents.ts
//
// /api/contents/show/:id 응답 타입. 필드 주석은 원본을 따른다.
// 서버가 필드를 빠뜨려도 응답 전체가 실패하지 않도록 모든 필드에 기본값을 둔다(AppJson 주석 참고).
package com.aimmovie.car.data.model

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonEncoder
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.encodeToJsonElement

/**
 * 국가코드 키 다국어 문자열 맵. default가 기본값이고, 국가코드(KR/US...)별로 오버라이드한다.
 * 표시 규칙: titles[국가코드] || titles.default (resolveText 참고).
 *
 * 값이 null 이거나 문자열이 아닌 키는 버린다 — TS 에서는 그런 값이 falsy 로 걸러지므로 결과가 같고,
 * Map<String, String> 으로 두면 값 하나 때문에 응답 전체가 실패하기 때문이다.
 */
@Serializable(with = LocalizedTextSerializer::class)
data class LocalizedText(val values: Map<String, String> = emptyMap()) {
    operator fun get(key: String): String? = values[key]
    val default: String? get() = values["default"]

    companion object {
        fun of(vararg pairs: Pair<String, String>) = LocalizedText(mapOf(*pairs))
    }
}

object LocalizedTextSerializer : KSerializer<LocalizedText> {
    override val descriptor: SerialDescriptor = JsonObject.serializer().descriptor

    override fun deserialize(decoder: Decoder): LocalizedText {
        val element = (decoder as JsonDecoder).decodeJsonElement()
        val obj = element as? JsonObject ?: return LocalizedText()
        val values = obj.mapNotNull { (k, v) ->
            (v as? JsonPrimitive)?.takeIf { it.isString }?.let { k to it.content }
        }.toMap()
        return LocalizedText(values)
    }

    override fun serialize(encoder: Encoder, value: LocalizedText) {
        (encoder as JsonEncoder).encodeJsonElement(JsonObject(value.values.mapValues { JsonPrimitive(it.value) }))
    }
}

/** 국가별 포스터 오버라이드(영문=US 등). */
@Serializable
data class CountryImages(
    @SerialName("poster_vertical") val posterVertical: String? = null,
    @SerialName("poster_horizontal") val posterHorizontal: String? = null,
)

/**
 * 세로/가로 포스터 이미지 경로(상대 경로, APIROOT를 붙여 사용).
 * 시청기록처럼 일부만 오는 구조도 같은 타입으로 받도록 전부 nullable 이다(원본은 Partial<ContentImages> 로 처리).
 */
@Serializable
data class ContentImages(
    @SerialName("poster_vertical") val posterVertical: String? = null,
    @SerialName("poster_horizontal") val posterHorizontal: String? = null,
    /** 상세페이지 상단 hero 세로형 대표이미지 */
    @SerialName("main_vertical") val mainVertical: String? = null,
    /** 상세페이지 상단 hero 가로형 대표이미지 */
    @SerialName("main_horizontal") val mainHorizontal: String? = null,
    /** 국가별 이미지 오버라이드(영문=US 등). 없으면 top-level 기본값 사용. */
    val byCountry: Map<String, CountryImages?>? = null,
)

/**
 * 콘텐츠 분류(populate된 참조 객체). 서버가 content.type을 ref로 채워 내려준다.
 * title 예: "영화". no는 비어 있을 수 있다.
 */
@Serializable
data class ContentType(
    val open: Int = 0,
    val no: Int? = null,
    val title: String = "",
    val description: String = "",
    @SerialName("_id") val id: String = "",
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("updated_at") val updatedAt: String = "",
)

/** HLS / DASH 매니페스트 경로. dash_path는 비어 있을 수 있다. */
@Serializable
data class StreamManifests(
    @SerialName("hls_path") val hlsPath: String = "",
    @SerialName("dash_path") val dashPath: String = "",
)

/** DrmScheme — 서버는 미암호화 시 빈 문자열을 주므로 필드 타입은 String 으로 둔다. */
object DrmScheme {
    const val CLEARKEY = "CLEARKEY"
    const val WIDEVINE = "WIDEVINE"
    const val FAIRPLAY = "FAIRPLAY"
}

@Serializable
data class LicenseUrls(
    val clearkey: String = "",
    val widevine: String = "",
    val fairplay: String = "",
)

/** DRM 라이선스 정보. 미암호화 콘텐츠는 모든 url이 빈 문자열이다. */
@Serializable
data class StreamDrm(
    @SerialName("license_urls") val licenseUrls: LicenseUrls = LicenseUrls(),
    @SerialName("is_encrypted") val isEncrypted: Boolean = false,
    @SerialName("encryption_scheme") val encryptionScheme: String = "",
    @SerialName("key_id") val keyId: String = "",
    /** 서버는 미암호화 시 빈 문자열을 주므로 DrmScheme으로 좁히지 않는다. */
    @SerialName("active_scheme") val activeScheme: String = "",
)

/** 오디오 트랙 메타데이터. is_default는 일부 트랙에만 존재한다. */
@Serializable
data class AudioTrack(
    val dir: String = "",
    val language: String = "",
    val name: String = "",
    val codec: String = "",
    @SerialName("is_default") val isDefault: Boolean? = null,
    @SerialName("_id") val id: String = "",
)

/** 인코딩/스트리밍 산출물 정보. video.stream 과 content.preview 가 동일 구조다. */
@Serializable
data class Stream(
    val manifests: StreamManifests = StreamManifests(),
    val drm: StreamDrm = StreamDrm(),
    val title: String = "",
    val fileId: String = "",
    val uploadfile: String = "",
    val status: Int = 0,
    /** 재생 시간(초). formatDuration 으로 표시 변환한다. */
    val duration: Double = 0.0,
    @SerialName("_id") val id: String = "",
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("updated_at") val updatedAt: String = "",
    @SerialName("audio_tracks") val audioTracks: List<AudioTrack> = emptyList(),
    /** 자막 트랙. 현재 응답에는 항상 빈 배열로 내려와 구조가 미확정이라 원본 JSON 객체로 둔다. */
    val subtitles: List<JsonObject> = emptyList(),
)

/** 재생 가능한 단일 영상(에피소드). */
@Serializable
data class Video(
    val titles: LocalizedText = LocalizedText(),
    val summaries: LocalizedText = LocalizedText(),
    val images: ContentImages = ContentImages(),
    val open: Int = 0,
    val parent: String? = null,
    val stream: Stream? = null,
    val no: Int = 0,
    /** 결제 유형. "무료" | "유료" (미설정 시 빈 문자열) */
    val price: String? = null,
    /** 유료 시 필요한 팝콘 개수 */
    val popcorn: Int? = null,
    @SerialName("_id") val id: String = "",
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("updated_at") val updatedAt: String = "",
)

/** 시리즈의 에피소드. season/episode 번호와 해당 영상을 가진다. */
@Serializable
data class Season(
    val season: Int? = null,
    val episode: Int? = null,
    val video: Video? = null,
    @SerialName("_id") val id: String = "",
)

/** 라벨 표시 위치. 기본 "top-left". */
object LabelPosition {
    const val TOP_LEFT = "top-left"
    const val TOP_CENTER = "top-center"
    const val TOP_RIGHT = "top-right"
    const val BOTTOM_LEFT = "bottom-left"
    const val BOTTOM_CENTER = "bottom-center"
    const val BOTTOM_RIGHT = "bottom-right"
}

/** populate된 label 컬렉션 문서(필요한 필드만). image는 상대경로. */
@Serializable
data class Label(
    @SerialName("_id") val id: String = "",
    val image: String = "",
)

/**
 * 콘텐츠에 붙는 라벨 항목. label 은 미populate 시 ObjectId 문자열일 수 있다(원본: `Label | string | null`).
 * 문자열이면 [LabelRefSerializer] 가 image 없는 Label 로 바꾼다 — prepareLabels 가 두 경우를
 * 똑같이 "이미지 없음 → 스킵" 으로 다루므로 결과가 같다.
 */
@Serializable
data class ContentLabel(
    @Serializable(with = LabelRefSerializer::class) val label: Label? = null,
    /** LabelPosition, 기본 "top-left" */
    val position: String? = null,
)

object LabelRefSerializer : KSerializer<Label?> {
    override val descriptor: SerialDescriptor = JsonElement.serializer().descriptor

    override fun deserialize(decoder: Decoder): Label? {
        val json = decoder as JsonDecoder
        return when (val element = json.decodeJsonElement()) {
            is JsonObject -> json.json.decodeFromJsonElement<Label>(element)
            is JsonNull -> null
            is JsonPrimitive -> Label(id = element.content, image = "")
            else -> null
        }
    }

    override fun serialize(encoder: Encoder, value: Label?) {
        val json = encoder as JsonEncoder
        json.encodeJsonElement(if (value == null) JsonNull else json.json.encodeToJsonElement(value))
    }
}

/** 콘텐츠 상세(영화 1편 또는 시리즈). */
@Serializable
data class Content(
    val titles: LocalizedText = LocalizedText(),
    val summaries: LocalizedText = LocalizedText(),
    val images: ContentImages = ContentImages(),
    /** populate된 분류 객체. (문자열이 아니라 객체로 내려온다.) */
    val type: ContentType? = null,
    @SerialName("content_rating") val contentRating: String = "",
    val genres: List<String> = emptyList(),
    /** 단편(영화)일 때의 대표 영상. 시리즈는 seasons[].video 를 사용한다. */
    val video: Video? = null,
    val open: Int = 0,
    /** 개봉 연도. 값이 없으면 null. */
    @SerialName("release_year") val releaseYear: Int? = null,
    @SerialName("production_company") val productionCompany: String = "",
    /** 미리보기 전용 스트림. 없으면 null(video.stream과 동일 구조). */
    val preview: Stream? = null,
    @SerialName("is_published") val isPublished: Boolean = false,
    /** 카드 포스터 위에 오버레이할 라벨 목록. 없을 수 있다. */
    val labels: List<ContentLabel>? = null,
    @SerialName("_id") val id: String = "",
    val seasons: List<Season> = emptyList(),
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("updated_at") val updatedAt: String = "",
)

/** /api/contents/show/:id 최상위 응답. */
typealias ContentShowResponse = ApiResponse<Content>
