// 콘텐츠(main_contents / top10 / sections.list) 데이터 가공 공용 유틸.
// 이미지 URL, 등급 배지, 영상 선택(video ?? seasons[0].video), 미리보기 소스 등
// Slide1 / Slide2 / main_wrap / play 페이지가 공통으로 사용한다.

import type {
    Content,
    Video,
    Season,
    LocalizedText,
    ContentImages,
    ContentLabel,
} from "../types/contents";
import type { VideoStatusMap } from "../api/videoStatus";
import { apiRoot, cdnUrl } from "../config";

// 표시 언어 → 조회 키 후보. 백엔드 로컬라이즈 값은 국가코드(국문 KR / 영문 US)로 저장되며,
// 콘텐츠가 언어코드(ko/en)로 오는 경우도 있어 둘 다 후보에 둔다.
const LOCALE_CANDIDATES: Record<string, string[]> = {
    ko: ["ko", "KR"],
    en: ["en", "US"],
};

/**
 * 다국어 문자열에서 표시값을 고른다.
 * 표시 축은 "표시 언어"(locale = "ko" | "en"). ko→KR, en→US로 매핑해 조회하고
 * (언어코드 ko/en도 후보), 없으면 default → 최후엔 국문(KR)으로 폴백한다.
 * (영문 값이 없는 항목은 빈칸 대신 국문으로 노출)
 */
export function resolveText(loc: LocalizedText | undefined, locale: string = ""): string {
    if (!loc) return "";
    for (const k of LOCALE_CANDIDATES[locale] ?? []) {
        if (loc[k]) return loc[k]!;
    }
    if (loc.default) return loc.default;
    return loc.ko || loc.KR || "";
}

/** pickContents가 받는 항목: top10/sections의 ContentEntry 또는 { contents } 래퍼. */
export interface PickableEntry {
    contents?: Content | null;
    order?: number;
    _id?: string;
}

// 이미지 등은 CMS(API) 호스트에서, HLS/영상 등 미디어는 CDN(CloudFront)에서 서빙된다.
// 두 호스트 모두 앱이 부팅 시 configure()로 주입한다(core는 환경변수를 직접 읽지 않는다).
// 포스터가 비어 있을 때 사용할 기본 이미지 (가로 / 세로)
export const FALLBACK_IMAGE = "/images/thum_default_02.png";
export const FALLBACK_IMAGE_V = "/images/thum_default_03.jpeg"; // 모바일 세로형 기본

/**
 * CMS 리사이즈본 크기. CMS 가 `/uploadimg/resize/<size>/<파일명>` 으로 서빙한다.
 * 포맷은 바꾸지 않으므로 확장자는 원본 그대로다.
 *  - w640  카드 썸네일
 *  - w1920 상세 히어로·홈 KV(화면 폭을 채운다)
 */
export type ImageSize = "w640" | "w1920";

/**
 * 상대 경로에 API 호스트를 붙여 절대 URL로. 비어 있으면 fallback.
 *
 * `size` 를 주면 원본 대신 CMS 리사이즈본을 가리킨다. CMS 는 리사이즈본이 아직 없으면
 * 요청을 받은 시점에 원본에서 만들어 내려주므로(온디맨드 폴백), 호출부가 존재 여부를
 * 따질 필요가 없다.
 *
 * ⚠️ 원본 포스터는 한 장이 평균 2.9MB(최대 15.9MB, 4K)라 썸네일 등장이 크게 밀린다.
 *    리사이즈본은 카드 한 장이 약 60KB 다.
 */
export function imageUrl(path?: string, fallback = FALLBACK_IMAGE, size?: ImageSize) {
    if (!path) return fallback;
    // 절대 URL(https://cdn...)이면 그대로 둔다.
    if (path.startsWith("http")) return path;
    const resolved = size ? resizedPath(path, size) : path;
    // 혼재 처리: 로컬 CMS 경로(/uploadimg/...)는 CMS 호스트(apiRoot), CDN 상대경로(/<prefix>/img/...)는
    // 미디어 CDN(cdnUrl, HLS와 동일). 백엔드가 이미지 CDN 전환을 신규/백필분만 적용해 둘이 공존한다.
    const host = path.startsWith("/uploadimg/") ? apiRoot() : cdnUrl();
    return `${host}${resolved}`;
}

/**
 * 리치텍스트(HTML) 안의 상대경로 `<img src>`에 CMS 호스트를 붙인다.
 * FAQ 등 관리자 입력 HTML을 dangerouslySetInnerHTML로 렌더하기 전에 통과시킨다.
 * 절대 URL(http/https)·protocol-relative(//)·data: URI는 그대로 둔다(imageUrl과 동일 판단).
 */
export function resolveHtmlImages(html?: string): string {
    if (!html) return "";
    const root = apiRoot();
    if (!root) return html;
    return html.replace(/(<img\b[^>]*?\bsrc=)(["'])(.*?)\2/gi, (m, pre, q, src) => {
        if (/^(https?:|data:|\/\/)/i.test(src)) return m;
        return `${pre}${q}${root}${src.startsWith("/") ? "" : "/"}${src}${q}`;
    });
}

/**
 * 원본 경로를 리사이즈본 경로로 바꾼다. `/uploadimg/origin/` 아래가 아니면 그대로 둔다
 * (그런 경로는 CMS 가 리사이즈본을 갖고 있지 않다).
 *
 * CMS 는 포맷을 바꾸지 않고 리사이징만 하므로 **확장자를 그대로 둔다.** 포맷을 바꾸면
 * 의도치 않게 이미지가 달라질 수 있기 때문이다(PNG 의 투명 영역이 JPEG 에서 배경색으로
 * 메워지는 것이 대표적이다).
 */
function resizedPath(path: string, size: ImageSize): string {
    // CMS(/uploadimg/origin/) · CDN(/<prefix>/img/origin/) 공통: 'img/origin/' 구간을 'img/resize/<size>/'로
    // 치환한다. (uploadimg 도 'img/origin/' 를 포함하므로 한 로직으로 처리된다.)
    const marker = "img/origin/";
    const i = path.indexOf(marker);
    if (i < 0) return path;
    const head = path.slice(0, i); // "/upload" 또는 "/<prefix>/"
    const name = path.slice(i + marker.length); // "<name>.<ext>"
    // 하위 경로가 끼어 있으면(예상 밖 구조) 손대지 않는다.
    if (!name || name.includes("/")) return path;
    return `${head}img/resize/${size}/${name}`;
}

/** 카드 포스터에 얹는 라벨(뷰모델). image는 절대 URL, position은 원본값(기본 "top-left"). */
export interface CardLabel {
    image: string;
    position: string;
}

/**
 * 콘텐츠 labels 배열을 카드용으로 정규화한다.
 * - label이 populate 안 됐거나(ObjectId 문자열) 이미지가 없으면 스킵.
 * - 상대경로 image는 imageUrl로 절대 URL 변환. position 기본값은 "top-left".
 * - position→CSS 클래스 매핑은 표시 계층(web)에서 담당한다.
 */
export function prepareLabels(labels: ContentLabel[] | undefined): CardLabel[] {
    if (!Array.isArray(labels)) return [];
    return labels
        .map((l) => {
            const raw = l?.label;
            const img = raw && typeof raw === "object" ? raw.image : "";
            if (!img) return null;
            return { image: imageUrl(img), position: l?.position || "top-left" };
        })
        .filter((l): l is CardLabel => l !== null);
}

// 표시 언어 → 국가코드. 이미지 byCountry 오버라이드 조회용.
const LOCALE_TO_CC: Record<string, string> = { ko: "KR", en: "US" };
/**
 * 표시 언어에 맞는 포스터 경로를 고른다. images.byCountry[CC][key] 우선,
 * 없으면 top-level 기본값(images[key]). (예: en → byCountry.US, 없으면 기본)
 */
export function localizedImagePath(
    // poster_* / byCountry가 optional인 느슨한 이미지 구조도 허용(시청기록 등 타입 차이 대응).
    images: Partial<ContentImages> | undefined,
    key: "poster_horizontal" | "poster_vertical",
    locale: string,
): string {
    if (!images) return "";
    const cc = LOCALE_TO_CC[locale];
    return (cc && images.byCountry?.[cc]?.[key]) || images[key] || "";
}

/** HLS(m3u8) 경로에 CDN 호스트를 붙여 절대 URL로. 절대 URL이면 그대로. */
export function hlsUrl(path?: string): string {
    if (!path || typeof path !== "string") return "";
    return path.startsWith("http") ? path : `${cdnUrl()}${path}`;
}

/**
 * 재생 시간(초)을 러닝타임 문자열로 변환. 값이 없으면 빈 문자열.
 * locale "ko" → "1시간 45분"/"45분"/"34초", "en" → "1h 45min"/"45min"/"34s".
 * (1분 미만이 "0분/0min"으로 나오지 않도록 초 단위로 표기)
 */
export function formatDuration(seconds?: number, locale: "ko" | "en" = "ko"): string {
    if (!seconds || seconds <= 0) return "";
    const total = Math.round(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (locale === "en") {
        if (h > 0) return `${h}h ${m}min`;
        if (m > 0) return `${m}min`;
        return `${s}s`;
    }
    if (h > 0) return `${h}시간 ${m}분`;
    if (m > 0) return `${m}분`;
    return `${s}초`;
}

// 서버 content_rating 값 → 배지에 노출할 짧은 표기로 변환
const RATING_BADGE: Record<string, string> = {
    모든연령: "ALL",
    "모든 연령": "ALL",
    "12세 이상": "12",
    "15세 이상": "15",
    "19세 이상": "19",
    청소년관람불가: "19",
};

/** content_rating 값을 배지 표기로 변환 (매핑에 없으면 숫자만 추출). */
export function ratingBadge(rating: string) {
    if (!rating) return "";
    if (RATING_BADGE[rating]) return RATING_BADGE[rating];
    const num = rating.match(/\d+/); // 예: "12세 이상" → "12"
    return num ? num[0] : rating;
}

/**
 * 재생할 영상을 고른다.
 * video에 값이 있으면 video로, 없으면 seasons의 첫 번째 영상으로 연결한다.
 */
export function resolveVideo(contents?: Content | null): Video | null {
    return contents?.video ?? contents?.seasons?.[0]?.video ?? null;
}

/**
 * 콘텐츠 안에서 _id가 일치하는 영상을 찾는다(top video + seasons 전체 탐색).
 * videoId가 없거나 못 찾으면 기본 영상(resolveVideo)으로 폴백한다.
 * 시리즈에서 특정 에피소드를 재생할 때 사용.
 */
export function findVideoById(contents?: Content | null, videoId?: string): Video | null {
    if (videoId) {
        if (contents?.video?._id === videoId) return contents.video;
        const inSeason = (contents?.seasons ?? []).find((s) => s?.video?._id === videoId);
        if (inSeason?.video) return inSeason.video;
    }
    return resolveVideo(contents);
}

/**
 * 시리즈에서 현재 에피소드(currentVideoId) "다음" 에피소드를 (season, episode) 순으로 찾는다.
 * 영상이 있는 에피소드만 대상으로 하며, 다음이 없으면(마지막 회차/단편) null.
 * 자동 재생용.
 */
export function findNextEpisode(contents?: Content | null, currentVideoId?: string): Season | null {
    const seasons = (contents?.seasons ?? []).filter((s) => s?.video?._id);
    if (seasons.length === 0 || !currentVideoId) return null;
    const sorted = [...seasons].sort(
        (a, b) => (a.season ?? 1) - (b.season ?? 1) || (a.episode ?? 0) - (b.episode ?? 0),
    );
    const idx = sorted.findIndex((s) => s.video?._id === currentVideoId);
    if (idx < 0 || idx + 1 >= sorted.length) return null;
    return sorted[idx + 1];
}

/**
 * ids 중 가장 최근에 재생한(playAt 최신, play>0) 영상 _id. 이력 없으면 null.
 * 상세 '바로보기'와 재생 페이지가 "마지막 본 회차"를 동일 규칙으로 고르도록 공용 사용.
 */
export function pickLastWatchedVideoId(statusMap: VideoStatusMap, ids: string[]): string | null {
    let bestId: string | null = null;
    let bestAt = "";
    ids.filter(Boolean).forEach((id) => {
        const st = statusMap[id];
        if (!st?.playAt || Number(st.play) <= 0) return; // 재생 이력 없으면 제외
        if (st.playAt > bestAt) {
            bestAt = st.playAt;
            bestId = id;
        }
    });
    return bestId;
}

/**
 * 콘텐츠 항목에서 화면에 필요한 값만 추려낸다.
 * - top10 / sections.list 항목: { order, contents } 형태
 * - main_contents: { contents: mainContents } 로 감싸서 전달
 */
export function pickContents(
    item: PickableEntry | null | undefined,
    index: number,
    // 표시 언어(ko/en). 미지정 "" → resolveText가 ko/default로 폴백.
    locale: string = "",
) {
    const contents = item?.contents ?? null;
    const images = contents?.images;
    const video = resolveVideo(contents);
    const hlsPath = video?.stream?.manifests?.hls_path;
    // 미리보기 경로는 raw <video>+hls.js(EME 없음)라 암호화 스트림을 복호화할 수 없다.
    // - 본영상이 DRM이면 폴백(previewSrc=본영상 앞 10초)이 재생 불가 → 끄고 썸네일로 대체.
    const isDrmEncrypted = !!video?.stream?.drm?.is_encrypted;
    // - 전용 미리보기(contents.preview)는 "자체" DRM 여부로 판단한다. DRM-free면 본영상이 DRM이어도
    //   재생 가능하므로 노출하고, 미리보기 자체가 암호화면 끈다.
    const previewIsDrmEncrypted = !!contents?.preview?.drm?.is_encrypted;
    // 시리즈 여부: seasons(회차)가 있으면 시리즈. (단일 러닝타임 표기가 무의미)
    const isSeries = (contents?.seasons?.length ?? 0) > 0;
    // 이어보기 진행률용 회차 목록 {id, duration}.
    // 대표 영상(contents.video) + 모든 시즌 회차를 합쳐 중복 제거한다.
    // (대표만 넣으면 시리즈의 나머지 회차가 누락돼 "마지막 본 회차" 판정이 틀어진다.)
    const episodeVideos = [
        contents?.video,
        ...(contents?.seasons ?? []).map((s) => s?.video),
    ];
    const seenEpisode = new Set<string>();
    const episodes: { id: string; duration: number }[] = [];
    for (const v of episodeVideos) {
        if (!v?._id || seenEpisode.has(v._id)) continue;
        seenEpisode.add(v._id);
        episodes.push({ id: v._id, duration: v.stream?.duration ?? 0 });
    }

    return {
        key: contents?._id ?? item?._id ?? index,
        // 순위: 서버 order 우선, 없으면 배열 인덱스 기반
        order: item?.order ?? index + 1,
        title: resolveText(contents?.titles, locale),
        summary: resolveText(contents?.summaries, locale),
        // 재생 페이지(/play/[id])는 콘텐츠 _id를 받는다.
        videoId: contents?._id ?? "",
        // 시청 진행률(이어보기) 조회용 대표 영상 _id. (videostatus는 영상 _id 기준)
        videoDocId: video?._id ?? "",
        // 이어보기 진행률용 회차 목록(대표/시즌 전체). 시리즈는 마지막 본 회차 판정에 사용.
        episodes,
        // 가로/세로 포스터 둘 다 만들어 두고, 컴포넌트가 필요한 쪽을 고른다.
        // 아래 네 개는 전부 카드 썸네일이라 w640 리사이즈본을 쓴다.
        imageH: imageUrl(images?.poster_horizontal || images?.poster_vertical, FALLBACK_IMAGE, "w640"),
        // 세로형은 포스터가 아예 없을 때 세로 기본 이미지로 폴백(모바일 노출용)
        imageV: imageUrl(images?.poster_vertical || images?.poster_horizontal, FALLBACK_IMAGE_V, "w640"),
        // 표시 언어(locale) 우선 포스터(en→byCountry.US, 없으면 기본). 현재 슬라이드 썸네일 전용.
        imageHLocalized: imageUrl(
            localizedImagePath(images, "poster_horizontal", locale) ||
                localizedImagePath(images, "poster_vertical", locale),
            FALLBACK_IMAGE,
            "w640",
        ),
        imageVLocalized: imageUrl(
            localizedImagePath(images, "poster_vertical", locale) ||
                localizedImagePath(images, "poster_horizontal", locale),
            FALLBACK_IMAGE_V,
            "w640",
        ),
        // 상세페이지 상단 hero용 대표이미지(main). 없으면 기존 포스터로 폴백(대표 없으면 썸네일 노출).
        // 화면 폭을 채우므로 w1920 을 쓴다.
        mainImageH: imageUrl(
            images?.main_horizontal ||
                images?.main_vertical ||
                images?.poster_horizontal ||
                images?.poster_vertical,
            FALLBACK_IMAGE,
            "w1920",
        ),
        mainImageV: imageUrl(
            images?.main_vertical ||
                images?.main_horizontal ||
                images?.poster_vertical ||
                images?.poster_horizontal,
            FALLBACK_IMAGE_V,
            "w1920",
        ),
        // 등록 영상의 HLS 스트림(CDN). preview 전용 영상이 없을 때의 미리보기 폴백.
        // 본영상이 DRM이면 폴백 불가 → 빈 소스(썸네일 대체).
        previewSrc: isDrmEncrypted ? "" : hlsUrl(hlsPath),
        // 별도 preview 전용 영상(m3u8). preview는 video.stream과 동일한 스트림 객체 구조.
        // 미리보기 자체가 DRM-free면 본영상 DRM 여부와 무관하게 노출(통째로 반복), 암호화면 끔.
        previewClip: previewIsDrmEncrypted ? "" : hlsUrl(contents?.preview?.manifests?.hls_path),
        rating: contents?.content_rating ?? "",
        releaseYear: contents?.release_year ?? "",
        productionCompany: contents?.production_company ?? "",
        // 재생 시간(초). 표시 시 formatDuration으로 변환.
        duration: video?.stream?.duration ?? 0,
        // 시리즈 여부. 시리즈는 단일 러닝타임을 노출하지 않는다.
        isSeries,
        // 대표 영상(video)이 DRM 암호화인지. 재생 진입 전 로그인 게이트 판단에 쓴다
        // (네이티브 플레이어가 라이선스 토큰을 직접 요청하므로
        // 로그인 사용자만 재생을 시도하도록 호출부가 이 값으로 미리 막는다).
        isDrmEncrypted,
        // 대표 영상의 결제 유형("무료" | "유료", 미설정이면 빈 문자열)과 필요 팝콘 수.
        // 재생 진입 시 시청 자격(대여) 검증 대상 판단에 쓴다.
        price: video?.price ?? "",
        popcorn: video?.popcorn ?? 0,
        // 포스터 위 오버레이 라벨(위치별). 없으면 빈 배열.
        labels: prepareLabels(contents?.labels),
    };
}
