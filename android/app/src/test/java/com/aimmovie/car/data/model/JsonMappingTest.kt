package com.aimmovie.car.data.model

import com.aimmovie.car.data.net.AppJson
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * packages/core/src/types 기준 대표 응답을 역직렬화한다.
 * 샘플은 타입 주석(실제 서버 응답 관찰)에 맞춰 만들었고, 서버가 필드를 빼거나 더하거나 null 을 줘도
 * 응답 전체가 실패하지 않는지를 함께 본다.
 */
class JsonMappingTest {

    private val contentJson = """
        {
          "titles": {"default": "기본 제목", "KR": "국문 제목", "US": "English", "JP": null, "weird": 3},
          "summaries": {"default": "줄거리"},
          "images": {
            "poster_vertical": "/uploadimg/origin/v.png",
            "poster_horizontal": "/uploadimg/origin/h.png",
            "byCountry": {"US": {"poster_horizontal": "/uploadimg/origin/us.png"}, "JP": null}
          },
          "type": {"open": 1, "no": null, "title": "영화", "description": "", "_id": "t1",
                   "created_at": "2025-01-01", "updated_at": "2025-01-01", "__v": 0},
          "content_rating": "15세 이상",
          "genres": ["액션", "드라마"],
          "video": {
            "titles": {"default": "본편"}, "summaries": {}, "images": {"poster_vertical": "", "poster_horizontal": ""},
            "open": 1, "parent": "c1", "no": 1, "price": "유료", "popcorn": 3, "_id": "v1",
            "created_at": "", "updated_at": "", "__v": 0,
            "stream": {
              "manifests": {"hls_path": "/hls/v1/master.m3u8", "dash_path": ""},
              "drm": {"license_urls": {"clearkey": "", "widevine": "https://lic/wv", "fairplay": ""},
                      "is_encrypted": true, "encryption_scheme": "cenc", "key_id": "k", "active_scheme": "WIDEVINE"},
              "title": "v1.mp4", "fileId": "f1", "uploadfile": "u", "status": 2, "duration": 5400.5,
              "_id": "s1", "created_at": "", "updated_at": "",
              "audio_tracks": [{"dir": "a", "language": "ko", "name": "한국어", "codec": "aac", "is_default": true, "_id": "a1"},
                               {"dir": "b", "language": "en", "name": "English", "codec": "aac", "_id": "a2"}],
              "subtitles": [], "__v": 0
            }
          },
          "open": 1,
          "release_year": null,
          "production_company": "AIM",
          "preview": null,
          "is_published": true,
          "labels": [{"label": {"_id": "l1", "image": "/l1.png", "extra": 1}, "position": "top-right"},
                     {"label": "665f0c0c0c0c0c0c0c0c0c0c"},
                     {"label": null}],
          "_id": "c1",
          "seasons": [],
          "created_at": "2025-01-01",
          "updated_at": "2025-01-02",
          "__v": 0,
          "brand_new_server_field": {"nested": true}
        }
    """.trimIndent()

    @Test
    fun contentShow_decodesRepresentativeResponse() {
        val res = AppJson.decodeFromString(ApiResponse.serializer(Content.serializer()), """{"result":true,"data":$contentJson}""")
        assertTrue(res.result)
        val c = res.data!!
        // 문자열이 아닌 값(null, 숫자)은 버리고 나머지는 유지
        assertEquals(mapOf("default" to "기본 제목", "KR" to "국문 제목", "US" to "English"), c.titles.values)
        assertEquals("/uploadimg/origin/us.png", c.images.byCountry?.get("US")?.posterHorizontal)
        assertNull(c.images.byCountry?.get("JP"))
        assertEquals("영화", c.type?.title)
        assertNull(c.type?.no)
        assertEquals(listOf("액션", "드라마"), c.genres)
        assertNull(c.releaseYear)
        assertNull(c.preview)
        assertEquals("c1", c.id)

        val v = c.video!!
        assertEquals("유료", v.price)
        assertEquals(3, v.popcorn)
        val s = v.stream!!
        assertEquals("/hls/v1/master.m3u8", s.manifests.hlsPath)
        assertTrue(s.drm.isEncrypted)
        assertEquals("https://lic/wv", s.drm.licenseUrls.widevine)
        assertEquals(DrmScheme.WIDEVINE, s.drm.activeScheme)
        assertEquals(5400.5, s.duration, 0.0)
        assertEquals(true, s.audioTracks[0].isDefault)
        assertNull(s.audioTracks[1].isDefault)

        // label 유니온: 객체 → Label, ObjectId 문자열 → image 없는 Label, null → null
        assertEquals(Label("l1", "/l1.png"), c.labels!![0].label)
        assertEquals("top-right", c.labels!![0].position)
        assertEquals(Label("665f0c0c0c0c0c0c0c0c0c0c", ""), c.labels!![1].label)
        assertNull(c.labels!![2].label)
    }

    @Test
    fun nullForNonNullField_coercesToDefault() {
        val c = AppJson.decodeFromString(Content.serializer(), """{"_id":"x","genres":null,"seasons":null,"content_rating":null,"titles":null}""")
        assertEquals(emptyList<String>(), c.genres)
        assertEquals(emptyList<Season>(), c.seasons)
        assertEquals("", c.contentRating)
        assertEquals(LocalizedText(), c.titles)
    }
}
