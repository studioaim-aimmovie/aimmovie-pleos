// /api/contents/show/:id 응답 타입.
// CMS가 내려주는 콘텐츠 상세(영화/시리즈) 구조를 정의한다.
// lib/contents.ts 의 유틸(resolveVideo / findVideoById / pickContents)과
// app/(view)/play/[id]/page.tsx, app/(view)/contents/[id]/page.tsx 가 공통으로 참조한다.
//
// 실제 서버 응답(http://192.168.0.87:8066/api/contents/show/:id,
// /api/main/show/:id)을 관찰해 정의했다. (types/main.ts 도 이 타입들을 재사용한다.)

import type { ApiResponse } from "./api";

/**
 * 국가코드 키 다국어 문자열 맵. default가 기본값이고, 국가코드(KR/US...)별로 오버라이드한다.
 * 표시 규칙: titles[국가코드] || titles.default (resolveText 참고).
 */
export interface LocalizedText {
    default?: string;
    [countryCode: string]: string | undefined;
}

/** 세로/가로 포스터 이미지 경로(상대 경로, APIROOT를 붙여 사용). */
export interface ContentImages {
    poster_vertical: string;
    poster_horizontal: string;
    main_vertical?: string; // 신규: 상세페이지 상단 hero 세로형 대표이미지
    main_horizontal?: string; // 신규: 상세페이지 상단 hero 가로형 대표이미지
    // 국가별 이미지 오버라이드(영문=US 등). 없으면 top-level 기본값 사용.
    byCountry?: {
        [countryCode: string]:
            | { poster_vertical?: string; poster_horizontal?: string }
            | undefined;
    };
}

/**
 * 콘텐츠 분류(populate된 참조 객체). 서버가 content.type을 ref로 채워 내려준다.
 * title 예: "영화". no는 비어 있을 수 있다.
 */
export interface ContentType {
    open: number;
    no: number | null;
    title: string;
    description: string;
    _id: string;
    created_at: string;
    updated_at: string;
    __v: number;
}

/** HLS / DASH 매니페스트 경로. dash_path는 비어 있을 수 있다. */
export interface StreamManifests {
    hls_path: string;
    dash_path: string;
}

/**
 * DRM 적용 여부. 클라이언트가 판단에 쓰는 값은 is_encrypted 하나뿐이다.
 *
 * 어떤 DRM 시스템(Widevine/PlayReady/FairPlay)을 쓸지는 CMS 값이 아니라 재생 플랫폼이 정하고,
 * 라이선스 URL·토큰 헤더는 라이선스 발급 응답(`/authapi/drm/license`)의 값을 쓴다.
 * (docs/DRM_AUDIT.md 참고 — 예전 스키마의 active_scheme/key_id/license_urls 는 제거됐다.)
 */
export interface StreamDrm {
    is_encrypted: boolean;
    /** 암호화 방식. DRM 영상은 "cbcs", 비-DRM 은 빈 문자열(마이그레이션 전 문서는 레거시 기본값일 수 있음). */
    encryption_scheme?: string;
}

/** 오디오 트랙 메타데이터. is_default는 일부 트랙에만 존재한다. */
export interface AudioTrack {
    dir: string;
    language: string;
    name: string;
    codec: string;
    is_default?: boolean;
    _id: string;
}

/** 자막 트랙. 현재 응답에는 항상 빈 배열로 내려와 구조가 미확정이다. */
export interface Subtitle {
    _id?: string;
    [key: string]: unknown;
}

/** 인코딩/스트리밍 산출물 정보. video.stream 과 content.preview 가 동일 구조다. */
export interface Stream {
    manifests: StreamManifests;
    drm: StreamDrm;
    title: string;
    fileId: string;
    status: number;
    /** 재생 시간(초). lib/contents.ts 의 formatDuration 으로 표시 변환한다. */
    duration: number;
    _id: string;
    created_at: string;
    updated_at: string;
    audio_tracks: AudioTrack[];
    subtitles: Subtitle[];
    __v: number;
}

/** 재생 가능한 단일 영상(에피소드). */
export interface Video {
    titles: LocalizedText;
    summaries: LocalizedText;
    images: ContentImages;
    open: number;
    parent: string | null;
    stream: Stream;
    no: number;
    /** 결제 유형. "무료" | "유료" (미설정 시 빈 문자열) */
    price?: string;
    /** 유료 시 필요한 팝콘 개수 */
    popcorn?: number;
    _id: string;
    created_at: string;
    updated_at: string;
    __v: number;
}

/** 시리즈의 에피소드. season/episode 번호와 해당 영상을 가진다. */
export interface Season {
    season: number;
    episode: number;
    video: Video;
    _id: string;
}

/** 라벨 표시 위치. 기본 "top-left". */
export type LabelPosition =
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";

/** populate된 label 컬렉션 문서(필요한 필드만). image는 상대경로. */
export interface Label {
    _id: string;
    image: string;
}

/** 콘텐츠에 붙는 라벨 항목. label은 미populate 시 ObjectId 문자열일 수 있다. */
export interface ContentLabel {
    label: Label | string | null;
    position?: string; // LabelPosition, 기본 "top-left"
}

/** 콘텐츠 상세(영화 1편 또는 시리즈). */
export interface Content {
    titles: LocalizedText;
    summaries: LocalizedText;
    images: ContentImages;
    /** populate된 분류 객체. (문자열이 아니라 객체로 내려온다.) */
    type: ContentType;
    content_rating: string;
    genres: string[];
    /** 단편(영화)일 때의 대표 영상. 시리즈는 seasons[].video 를 사용한다. */
    video: Video | null;
    open: number;
    /** 개봉 연도. 값이 없으면 null. */
    release_year: number | null;
    production_company: string;
    /** 미리보기 전용 스트림. 없으면 null(video.stream과 동일 구조). */
    preview: Stream | null;
    is_published: boolean;
    /** 카드 포스터 위에 오버레이할 라벨 목록. 없을 수 있다. */
    labels?: ContentLabel[];
    _id: string;
    seasons: Season[];
    created_at: string;
    updated_at: string;
    __v: number;
}

/** /api/contents/show/:id 최상위 응답. */
export type ContentShowResponse = ApiResponse<Content>;
