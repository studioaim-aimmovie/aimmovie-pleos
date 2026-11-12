// 상세 — apps/tv 의 components/view_wrap.tsx 에서 옮겼다(원본: apps/web components/sub/view_wrap.tsx).
//
// 마크업은 apps/web 과 같아 세로(mobile_style)·가로(web_style) 모두 CSS 가 나눈다.
// apps/tv 와 다른 점:
//  - 포커스(Norigin) 래퍼를 걷어내고 `<a>`/`<button>` + onClick 으로 바꿨다(터치 전용).
//  - **KV 미리보기 영상을 재생하지 않는다(정적 포스터만)** — main_wrap 머리말과 같은 이유.
//  - 유료 회차의 "구매완료" 배지를 apps/web 처럼 되살렸다.

import React, { useState, useEffect, useRef, useMemo } from "react";

import Image from "@/compat/Image";
import Link from "@/compat/Link";
import { useRouter } from "@/compat/navigation";
import { useSession } from "@/compat/session";
import { usePlaybackEpoch } from "@/native/playback";
import { useLike, useFavorite } from "@/components/useLike";
import { useMotionObserver } from "@/components/useMotionObserver";
import BackButton from "@/components/BackButton";
import { playHref as toPlayHref, playVideoAction } from "@/compat/playAction";
import {
    pickContents,
    resolveVideo,
    ratingBadge,
    imageUrl,
    formatDuration,
    pickLastWatchedVideoId,
    resolveText,
} from "@aim/core/domain/contents";
import { useCountry } from "@/hooks/useCountry";
import { useT, useLang } from "@/i18n/LocaleProvider";
import {
    fetchWatchStatus,
    secondsToPercent,
    isWatchComplete,
    type VideoStatus,
    type VideoStatusMap,
} from "@aim/core/api/videoStatus";
import { useRentFlow } from "@/components/useRentFlow";
import { asset } from "@/lib/asset";
import type { ContentShowResponse, Season, Video } from "@aim/core/types/contents";

// 회차 썸네일이 없을 때 노출할 기본 이미지. 인라인 style 의 url() 이라 Vite 가 경로를 고치지
// 않으므로 asset() 으로 상대 경로를 만든다(패키지 오리진에서 "/" 는 루트를 가리킨다).
const THUMB_DEFAULT = asset("/images/thum_default_02.png");

/**
 * 진행바 %. CMS가 내려준 play_percent가 있으면 그 값을 우선 사용하고,
 * 없으면 재생 위치(초)/길이로 계산한다(끝 수 초 이내면 100%로 스냅).
 */
function barPercent(status: VideoStatus | undefined, seconds: number, duration: number): number {
    if (typeof status?.play_percent === "number") {
        return Math.min(100, Math.max(0, status.play_percent));
    }
    if (isWatchComplete(seconds, duration)) return 100;
    return secondsToPercent(seconds, duration);
}

interface dataProps {
    viewData: ContentShowResponse;
}

export default function ViewWrap(props: dataProps) {
    const data = props.viewData.data;
    const router = useRouter();
    // 로그인 여부. 미로그인이면 시청상태 조회 요청을 아예 보내지 않는다.
    const { data: session } = useSession();
    const isAuthed = !!session?.user;
    // 좋아요 / 즐겨찾기 토글(상세 콘텐츠 기준).
    const { liked, toggle: toggleLike } = useLike(data?._id);
    const { favorited, toggle: toggleFavorite } = useFavorite(data?._id);
    // 연타로 인한 중복 재생 호출 방지
    const pendingRef = useRef(false);

    const country = useCountry();
    const t = useT();
    const { lang } = useLang();
    // 상단 KV (메인과 동일 방식). 콘텐츠 가공 유틸 재사용.
    const kv = pickContents({ contents: data }, 0, country);
    const kvPoster = kv.mainImageH; // 상세 hero = 대표이미지(main), 없으면 포스터→기본이미지 폴백

    // KV 대표 영상(= 단일 영상 or 시즌1 영상). 결제 배지·진행률 조회에 사용.
    const kvVideo = resolveVideo(data);
    // 시청 진행률 조회 대상 = KV 기본 영상의 Video._id (저장 시 쓰는 키와 동일).
    const kvVideoDocId = kvVideo?._id ?? "";
    // 로그인 사용자의 영상별 시청 상태 맵({ videoId: { play(초) } }). 미로그인/미시청이면 빈 맵.
    // 네이티브 플레이어에서 돌아오면(onPlaybackFinished) 다시 조회해 방금 본 위치를 진행바에 반영한다.
    const playbackEpoch = usePlaybackEpoch();
    const [statusMap, setStatusMap] = useState<VideoStatusMap>({});

    useEffect(() => {
        if (!isAuthed) return; // 미로그인: 진행바/상태 조회 요청 안 보냄
        // KV 대표 영상 + 모든 회차(에피소드) 영상의 _id를 한 번에 조회한다.
        const ids = [kvVideoDocId, ...(data?.seasons ?? []).map((s) => s?.video?._id ?? "")].filter(
            Boolean,
        );
        if (ids.length === 0) return;
        let cancelled = false;
        fetchWatchStatus([...new Set(ids)]).then((map) => {
            if (!cancelled) setStatusMap(map);
        });
        return () => {
            cancelled = true;
        };
    }, [kvVideoDocId, data, isAuthed, playbackEpoch]);

    // KV 진행바 표시용: play_percent 우선, 없으면 위치/길이로 계산. 남은 시간(초).
    const watchedSeconds = Math.max(0, Number(statusMap[kvVideoDocId]?.play ?? 0));
    const watchedPercent = barPercent(statusMap[kvVideoDocId], watchedSeconds, kv.duration);
    const remainingSeconds = watchedPercent >= 100 ? 0 : Math.max(0, kv.duration - watchedSeconds);
    // 끝까지 본 경우(끝 3초 이내 or 100%)는 진행바 숨김(이어볼 게 없으므로).
    const watchCompleted = watchedPercent >= 100 || isWatchComplete(watchedSeconds, kv.duration);

    // 마지막으로 본 회차 = 시청 기록(playAt) 중 가장 최근에 재생한 영상.
    // 바로보기가 그 회차로 이어지도록, 있으면 ?v=<영상 _id>를 붙인다(없으면 기본 시작점).
    // 재생 페이지(?v 없는 진입)와 동일 규칙을 쓰도록 공용 헬퍼로 판정한다.
    const lastWatchedVideoId = useMemo(
        () =>
            pickLastWatchedVideoId(statusMap, [
                kvVideoDocId,
                ...(data?.seasons ?? []).map((s) => s?.video?._id ?? ""),
            ]),
        [statusMap, data, kvVideoDocId],
    );

    // 바로보기는 마지막 본 회차(있으면)로 이어진다 — runPlay 가 episodeVideoId 로 넘긴다.

    // KV 정보 영역 표시값
    const genres: string[] = (data?.genres ?? []).filter(Boolean);
    const ratingText = ratingBadge(data?.content_rating ?? "");
    const summary: string = resolveText(data?.summaries, country);

    // 회차(시즌) 데이터. seasons 배열의 각 원소 = 에피소드 1개.
    const seasonList: Season[] = Array.isArray(data?.seasons) ? data.seasons : [];
    // 시즌이 하나라도 있으면 시리즈. 시리즈는 대표 진행바 대상이 애매하므로 진행바를 숨긴다.
    const isSeries = seasonList.length > 0;
    const seasonNumbers = [...new Set(seasonList.map((s) => s?.season ?? 1))].sort((a, b) => a - b);

    const [selectedSeason, setSelectedSeason] = useState(seasonNumbers[0] ?? 1);
    const [isOpen, setIsOpen] = useState(false);
    const episodes = seasonList.filter((s) => (s?.season ?? 1) === selectedSeason);

    // 유료 대여 흐름(대여 확인 ↔ 팝콘 부족 시 충전 모달).
    const rentFlow = useRentFlow();

    // 시즌 선택.
    const selectSeason = (season: number) => {
        setSelectedSeason(season);
        setIsOpen(false);
    };

    // "바로보기" → compat/playAction 이 `/play` 로 보내고, 그 화면이 네이티브/웹 재생을 고른다.
    // runPlay: 실제 재생 진입. 무료/이미 시청 가능하거나 대여 완료 후 호출.
    const runPlay = async () => {
        if (!kv.videoId) return;
        if (pendingRef.current) return;
        pendingRef.current = true;
        try {
            await playVideoAction({
                contentId: kv.videoId,
                episodeVideoId: lastWatchedVideoId || undefined,
                router,
            });
        } finally {
            pendingRef.current = false;
        }
    };
    // doPlay: 유료 단일 영상은 에피소드와 동일하게 able 여부로 대여 모달을 먼저 띄운다.
    const doPlay = async () => {
        if (!kv.videoId) return;
        if (kvVideo?.price === "유료" && statusMap[kvVideoDocId]?.able !== true) {
            rentFlow.start({
                videoId: kvVideoDocId,
                cost: kvVideo.popcorn ?? 0,
                title: kv.title,
                onUnlocked: () => {
                    setStatusMap((prev) => ({
                        ...prev,
                        [kvVideoDocId]: {
                            ...(prev[kvVideoDocId] ?? { play: 0 }),
                            able: true,
                        },
                    }));
                    runPlay();
                },
            });
            return;
        }
        runPlay();
    };
    /**
     * 회차(에피소드) 선택: 무료면 곧바로 재생, 유료면 able 여부로 분기.
     *  - able === true(구매/시청 가능) → 재생
     *  - able 없음/false → 잔고 조회 후 대여 모달 오픈(확인 시 팝콘 차감)
     */
    const playEpisode = (videoId: string) =>
        void playVideoAction({ contentId: kv.videoId, episodeVideoId: videoId, router });
    const selectEpisode = async (epVideo: Video | null | undefined, ep?: Season) => {
        // 무료(또는 미설정)는 곧바로 재생.
        if (!epVideo || epVideo.price !== "유료") {
            if (epVideo?._id) playEpisode(epVideo._id);
            else void playVideoAction({ contentId: kv.videoId, router });
            return;
        }
        const videoId = epVideo._id;
        // 이미 시청 가능하면 바로 재생.
        if (statusMap[videoId]?.able === true) {
            playEpisode(videoId);
            return;
        }
        // 대여 흐름 시작(확인 → 차감 → 부족 시 충전). 성공 시 재생 이동.
        // (표시용 개수 — 실제 차감액은 서버 video.popcorn 기준)
        rentFlow.start({
            videoId,
            cost: epVideo.popcorn ?? 0,
            title: kv.title,
            season: ep?.season ?? selectedSeason,
            episode: ep?.episode,
            onUnlocked: () => {
                setStatusMap((prev) => ({
                    ...prev,
                    [videoId]: { ...(prev[videoId] ?? { play: 0 }), able: true },
                }));
                playEpisode(videoId);
            },
        });
    };

    useMotionObserver();


    return (
        <>
            {/* 세로는 헤더를 숨기고(mobile_style 의 `.contents_page .header`) 이 닫기 버튼을 띄운다.
                가로는 web_style 이 `.contents_page .close_btn` 을 숨기고 헤더가 남는다. */}
            <BackButton className="close_btn">close</BackButton>
            <div className="sub_kv">
                <div className="img_area">
                    <div className="inner">
                        {/* 기본: 포스터 이미지를 깔아둔다 (영상 종료 후에도 노출) */}
                        {kvPoster && (
                            <div className="bg">
                                <Image
                                    src={kvPoster}
                                    alt=""
                                    fill
                                    priority
                                    style={{ objectFit: "cover" }}
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div className="kv_txt motion_target1">
                    <div className="wrap_type1">
                        {/* <div className="logo">AIM MOVE</div> */}
                        {/* 단일 영상 결제 배지(타이틀 위): 유료=필요 팝콘 개수, 무료=팝콘Free. 시리즈는 회차별 배지로 대체. */}
                        {!isSeries &&
                            (kvVideo?.price === "유료" ? (
                                <span className="badge_type2">
                                    {t("common.popcorn_count", { count: kvVideo?.popcorn ?? 0 })}
                                </span>
                            ) : (
                                <span className="badge_type2 free">{t("common.popcorn_free")}</span>
                            ))}
                        <h2>{kv.title}</h2>
                        <div className="list_area">
                            <ul className="list_type1">
                                {data?.release_year && <li>{data.release_year}</li>}
                                {data?.production_company && (
                                    <li>
                                        {t("view.By")} {data.production_company}
                                    </li>
                                )}
                                {!kv.isSeries && kv.duration > 0 && (
                                    <li>{formatDuration(kv.duration, lang)}</li>
                                )}
                            </ul>
                            {ratingText && <span className="badge_type1">{ratingText}</span>}
                            {/* <div className="rating">
                                <span className="star fill"></span>
                                <span className="star fill"></span>
                                <span className="star fill"></span>
                                <span className="star fill"></span>
                                <span className="star"></span>
                            </div> */}
                        </div>

                        {summary && (
                            <p className="sub_txt" style={{ whiteSpace: "pre-line" }}>
                                {summary}
                            </p>
                        )}
                        {/* 시청 이력이 있을 때(진행률 > 0)만 노출. 미시청/미로그인·시리즈·완료면 숨김. */}
                        {watchedPercent > 0 && !isSeries && !watchCompleted && (
                            <div className="play_time_area">
                                <div className="progress_bar">
                                    {/* 시청 진행률(%)만큼 채운다. */}
                                    <span
                                        className="fill"
                                        style={{
                                            width: `${watchedPercent}%`,
                                        }}
                                    ></span>
                                </div>
                                <span>
                                    {t("common.remaining", {
                                        time: formatDuration(remainingSeconds, lang),
                                    })}
                                </span>
                            </div>
                        )}
                        <div className="btn_area">
                            {/* apps/web 처럼 <button> 이다 — <a> 로 두면 mobile_style 의 버튼 규칙이
                                빗나가 글자가 4px 위로 뜬다(840 세로에서 apps/web 과 나란히 비교해 확인). */}
                            <button type="button" className="btn_type1" onClick={doPlay}>
                                <span>{t("common.play_btn")}</span>
                            </button>
                            <Link
                                href="#"
                                className={`btn_type3 favorites${favorited ? " on" : ""}`}
                                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                    e.preventDefault();
                                    toggleFavorite();
                                }}
                            >
                                favorites
                            </Link>
                            <Link
                                href="#"
                                className={`btn_type3 like${liked ? " on" : ""}`}
                                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                    e.preventDefault();
                                    toggleLike();
                                }}
                            >
                                like
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {seasonNumbers.length > 0 && (
                <section className="video_list_section">
                    <div className="wrap_type1">
                        <div className="tab_type1">
                            <h3>{t("view.episode")}</h3>
                            {/* 시즌이 1개일 때 노출 */}
                            {seasonNumbers.length == 1 && (
                                <p className="limited">{t("view.limited_series")}</p>
                            )}
                            {/* 시즌이 2개 이상일 때만 선택 드롭다운 노출 */}
                            {seasonNumbers.length > 1 && (
                                <div className={`select_type1 ${isOpen ? "active" : ""}`}>
                                    <div className="select_area">
                                        <div
                                            className="selected"
                                            onClick={() => setIsOpen(!isOpen)}
                                        >
                                            <span>
                                                {t("view.season")} {selectedSeason}
                                            </span>
                                        </div>
                                        <div className="select">
                                            <div className="scroll">
                                                {seasonNumbers.map((n) => (
                                                    <Link
                                                        key={n}
                                                        href="#"
                                                        className={`option ${n === selectedSeason ? "on" : ""}`}
                                                        onClick={(e: React.MouseEvent) => {
                                                            e.preventDefault();
                                                            selectSeason(n);
                                                        }}
                                                    >
                                                        {t("view.season")} {n}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="tab_cont_area">
                                <div className="tab_cont">
                                    <ul className="list_type2">
                                        {episodes.map((ep, i) => {
                                            const epVideo = ep?.video;
                                            // 회차 썸네일은 그 회차 영상(video)의 images만 사용.
                                            // 비어 있으면 콘텐츠 포스터로 폴백하지 않고 기본 이미지 노출.
                                            const epImg = imageUrl(
                                                epVideo?.images?.poster_horizontal ||
                                                    epVideo?.images?.poster_vertical,
                                                THUMB_DEFAULT,
                                                "w640",
                                            );
                                            const epNo = String(ep?.episode ?? i + 1).padStart(
                                                2,
                                                "0",
                                            );
                                            const epTitle = resolveText(epVideo?.titles, country);
                                            const epTxt = resolveText(epVideo?.summaries, country);
                                            // 특정 에피소드 재생: 콘텐츠 _id + ?v=<에피소드 영상 _id>
                                            const epHref = toPlayHref(kv.videoId, epVideo?._id);
                                            // 이 에피소드의 시청 진행률(%). 미시청/미로그인이면 0.
                                            const epStatus = statusMap[epVideo?._id ?? ""];
                                            const epSeconds = Math.max(
                                                0,
                                                Number(epStatus?.play ?? 0),
                                            );
                                            const epDuration = Number(
                                                epVideo?.stream?.duration ?? 0,
                                            );
                                            const epPercent = barPercent(
                                                epStatus,
                                                epSeconds,
                                                epDuration,
                                            );
                                            // 끝까지 본 회차는 진행바 숨김.
                                            const epCompleted =
                                                epPercent >= 100 ||
                                                isWatchComplete(epSeconds, epDuration);
                                            return (
                                                <li key={ep?._id ?? i}>
                                                    <Link
                                                        href={epHref}
                                                        onClick={(e: React.MouseEvent) => {
                                                            e.preventDefault();
                                                            void selectEpisode(epVideo, ep);
                                                        }}
                                                    >
                                                        <div className="float">
                                                            <div className="img_area">
                                                                <div
                                                                    className="img"
                                                                    style={{
                                                                        backgroundImage: `url(${epImg})`,
                                                                    }}
                                                                ></div>
                                                                {/* 이 에피소드 시청 진행률. 이력 있고 완료 전일 때만 노출. */}
                                                                {epPercent > 0 && !epCompleted && (
                                                                    <div className="progress_bar">
                                                                        <span
                                                                            className="fill"
                                                                            style={{
                                                                                width: `${epPercent}%`,
                                                                            }}
                                                                        ></span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text_area">
                                                                {/* 결제 유형 배지: 무료면 팝콘Free, 유료면 필요한 팝콘 개수(구매완료면 구매 배지 — apps/web 과 같다). */}
                                                                {epVideo?.price === "유료" ? (
                                                                    epStatus?.able === true ? (
                                                                        <span className="badge_type2 purchased">
                                                                            {t("common.purchased")}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="badge_type2">
                                                                            {t(
                                                                                "common.popcorn_count",
                                                                                {
                                                                                    count:
                                                                                        epVideo?.popcorn ??
                                                                                        0,
                                                                                },
                                                                            )}
                                                                        </span>
                                                                    )
                                                                ) : (
                                                                    <span className="badge_type2 free">
                                                                        {t("common.popcorn_free")}
                                                                    </span>
                                                                )}
                                                                <p className="tit">
                                                                    {t("view.episode_no")} {epNo}
                                                                    .&nbsp;&nbsp;
                                                                    <br className="m_only" />
                                                                    {epTitle}
                                                                </p>
                                                                {epTxt && (
                                                                    <p className="txt">{epTxt}</p>
                                                                )}
                                                            </div>
                                                            {epTxt && (
                                                                <p className="txt m_only">
                                                                    {epTxt}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {rentFlow.modals}
        </>
    );
}
