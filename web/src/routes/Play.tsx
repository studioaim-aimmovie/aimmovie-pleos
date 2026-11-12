// 재생 화면.
//
// **모든 재생 진입이 지나는 한 곳**이다(compat/playAction.ts 가 여기로 보낸다). 하는 일은 둘이다.
//
//  A) 재생 대상 해석 — 콘텐츠 조회, 유료 게이트, 마지막 본 회차, 이어보기 위치(resolvePlaySetup)
//  B) 재생 넘기기 — 네이티브 셸이면 브릿지로 Media3 에 넘기고(src/native/playback.ts),
//     아니면(브라우저 개발 환경) 아래의 웹 플레이어로 직접 재생한다.
//
// 웹 플레이어 경로가 맡는 것:
//  1) 이어보기(resume)      — 저장된 재생 위치(초)로 시작
//  2) 진행률 저장           — 일시정지 / 종료 / 이탈 / 언마운트
//  3) 다음 에피소드 자동재생 — 무료면 무조건, 유료면 시청권한(able) 있을 때만
//  4) 대여 흐름             — 유료 다음화에 권한이 없으면 팝콘 차감 모달
// 네이티브 경로에서는 1~4 를 네이티브 플레이어가 맡는다(README "브릿지 계약").

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { getContentShow } from "@aim/core/api/catalog";
import {
    fetchWatchStatus,
    isWatchComplete,
    secondsToPercent,
    sendWatchProgress,
} from "@aim/core/api/videoStatus";
import {
    findNextEpisode,
    findVideoById,
    hlsUrl,
    pickLastWatchedVideoId,
    resolveText,
    resolveVideo,
} from "@aim/core/domain/contents";
import type { Content, ContentShowResponse, Video } from "@aim/core/types/contents";

import AsyncBoundary from "@/components/AsyncBoundary";
import { useRentFlow } from "@/components/useRentFlow";
import { useParams, useRouter, useSearchParams } from "@/compat/navigation";
import { useAsync } from "@/hooks/useAsync";
import { useMarketCountry } from "@/hooks/useMarketCountry";
import { useLang, useT } from "@/i18n/LocaleProvider";
import Controls from "@/player/Controls";
import { createPlayer, type PlayerAdapter } from "@/player";
import { isNativeShell } from "@/native/bridge";
import { startNativePlayback } from "@/native/playback";

/** 조작이 없으면 이만큼(ms) 뒤에 컨트롤을 감춘다. 정지 상태에서는 감추지 않는다. */
const CONTROLS_HIDE_MS = 5_000;

/** 재생 준비에 필요한 것들을 한 번에 해석한 결과. */
interface PlaySetup {
    video: Video | null;
    /** HLS 절대 URL. 없으면 재생 불가. */
    src: string;
    /** 이어보기 시작 위치(초). */
    startAt: number;
    /** 현재 회차의 시즌/에피소드. 단편이면 undefined — 부제 문구는 화면이 만든다. */
    season?: number;
    episode?: number;
    /** 유료 미구매 → 상세로 돌려보내야 함. */
    blocked: boolean;
    /** 종료 시 무조건 자동재생할 다음화 경로(무료). */
    autoNextHref?: string;
    /** 유료 다음화 경로. `nextAble` 이면 자동재생, 아니면 대여 안내. */
    nextPaidHref?: string;
    nextPaidVideoId?: string;
    nextPaidCost?: number;
    nextSeason?: number;
    nextEpisode?: number;
    nextAble: boolean;
}

export default function Play() {
    const { id = "" } = useParams<{ id?: string }>();
    const searchParams = useSearchParams();
    const videoIdParam = searchParams.get("v") ?? "";
    const country = useMarketCountry();
    const router = useRouter();
    const t = useT();
    const { lang } = useLang();

    // 플레이어 생성 이펙트는 src 가 바뀔 때만 돌아야 한다. t 를 직접 참조하면 언어 전환마다
    // 재생이 끊기므로 ref 로 우회한다.
    const tRef = useRef(t);
    tRef.current = t;

    // ── 1) 콘텐츠 조회 ──
    const {
        data: showData,
        loading: showLoading,
        error: showError,
        reload: reloadShow,
    } = useAsync<ContentShowResponse>(() => getContentShow(id, country), [id, country], {
        enabled: !!id,
        errorMessage: t("player.load_failed"),
    });

    const contents: Content | null = showData?.result ? (showData.data ?? null) : null;

    // ── 2) 재생 대상·이어보기·다음화 해석 ──
    // 시청 상태 조회를 한 번만 하도록 회차 전체를 모아 한 요청으로 처리한다
    // ("마지막 본 회차" / "유료 게이트" / "이어보기" 가 모두 같은 응답에서 나온다).
    const {
        data: setup,
        loading: setupLoading,
        error: setupError,
        reload: reloadSetup,
    } = useAsync<PlaySetup>(
        () => resolvePlaySetup(contents, videoIdParam, id),
        // ⚠️ 표시 언어(lang)를 넣지 않는다. 언어가 바뀔 때 재조회하면 그 사이 저장된
        // 진행률이 새 startAt 이 되어 **재생 중인 플레이어가 재생성된다.**
        // 언어에 따라 달라지는 것은 문구뿐이고, 그건 아래에서 t() 로 만든다.
        [contents, videoIdParam, id],
        { enabled: !!contents, errorMessage: t("player.load_failed") },
    );

    // ── 재생 상태 ──
    const stageRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<PlayerAdapter | null>(null);
    const [paused, setPaused] = useState(true);
    const [buffering, setBuffering] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [fatal, setFatal] = useState("");
    const [controlsVisible, setControlsVisible] = useState(true);

    const rentFlow = useRentFlow();

    // 이벤트 리스너/타이머가 항상 최신 값을 읽도록 ref 로 보관한다.
    // (플레이어는 src 가 바뀔 때만 재생성하므로 핸들러 클로저는 오래 산다.)
    const videoIdRef = useRef<string>("");
    videoIdRef.current = setup?.video?._id ?? "";
    // CMS stream.duration(초). 종료 시 이 값으로 저장해 진행바가 정확히 100% 가 되게 한다.
    const cmsDurationRef = useRef(0);
    cmsDurationRef.current = setup?.video?.stream?.duration ?? 0;
    const setupRef = useRef<PlaySetup | null>(null);
    setupRef.current = setup ?? null;
    // 동일 위치(초) 중복 전송 방지.
    const lastSentRef = useRef(-1);
    // 완료(ended) 이후엔 강제 저장만 허용한다.
    const endedRef = useRef(false);

    const title = useMemo(() => resolveText(contents?.titles, lang), [contents, lang]);
    // 시리즈 부제("시즌 1 · 2회차"). 단편이면 빈 문자열.
    const subtitle = useMemo(
        () =>
            setup?.season != null && setup?.episode != null
                ? t("player.episode_label", { season: setup.season, episode: setup.episode })
                : "",
        [setup?.season, setup?.episode, t],
    );
    const titleRef = useRef(title);
    titleRef.current = title;

    // ── 진행률 저장 ──
    const saveProgress = useCallback((opts: { useBeacon?: boolean; force?: number } = {}) => {
        const player = playerRef.current;
        const video = videoIdRef.current;
        if (!player || !video) return;

        // 완료 이후엔 강제(완료)저장만 허용한다. 이탈/언마운트의 현재위치 저장이
        // 완료값(100%)을 더 낮은 값으로 덮어쓰지 않게 한다.
        if (opts.force == null && endedRef.current) return;

        const at = opts.force ?? player.getCurrentTime();
        const play = Math.floor(at);
        if (play <= 0 || play === lastSentRef.current) return;

        const dur = cmsDurationRef.current || player.getDuration();
        const playPercent = isWatchComplete(play, dur)
            ? 100
            : Math.round(secondsToPercent(play, dur));

        lastSentRef.current = play;
        sendWatchProgress(video, play, playPercent, { useBeacon: opts.useBeacon });
    }, []);

    // ── 컨트롤 자동 숨김 ──
    const hideTimerRef = useRef<number | null>(null);
    const pausedRef = useRef(true);
    pausedRef.current = paused;

    const showControls = useCallback(() => {
        setControlsVisible(true);
        if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
        // 정지 상태에서는 감추지 않는다 — 화면만 멈춰 있으면 사용자가 조작 방법을 잃는다.
        if (pausedRef.current) return;
        hideTimerRef.current = window.setTimeout(() => {
            hideTimerRef.current = null;
            setControlsVisible(false);
        }, CONTROLS_HIDE_MS);
    }, []);

    useEffect(() => {
        return () => {
            if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
        };
    }, []);

    // 재생/정지가 바뀌면 숨김 타이머를 다시 계산한다(정지 → 유지, 재생 → 카운트다운).
    useEffect(() => {
        showControls();
    }, [paused, showControls]);

    // ── B) 네이티브로 넘기기 ──
    // 셸 안이면 웹 플레이어를 만들지 않는다(디코더·대역폭을 두 플레이어가 나눠 쓰지 않게).
    // 판정은 마운트 시 한 번이면 된다 — 브릿지는 페이지가 뜨기 전에 셸이 심고 바뀌지 않는다.
    const [native] = useState(isNativeShell);
    // 같은 회차를 두 번 넘기지 않게 한다(StrictMode 의 이펙트 이중 실행·재렌더 대비).
    const handedOffRef = useRef("");
    const [handoffError, setHandoffError] = useState("");

    // ── 종료 처리: 진행률 완료 저장 + 다음화 ──
    // ref 만 읽어 항상 최신 setup 을 보므로, 플레이어 이펙트가 이 함수를 한 번만 붙여도 된다.
    const handleEndedImpl = () => {
        endedRef.current = true;
        setPaused(true);
        const player = playerRef.current;
        const full = cmsDurationRef.current || player?.getDuration() || 0;
        saveProgress({ force: Math.ceil(full) });

        const s = setupRef.current;
        if (!s) return;
        // 자동 이어재생은 replace 로 이동한다. push 면 이전 화가 히스토리에 남아
        // 뒤로가기 시 (완료 상태라) 처음부터 다시 재생되는 문제가 생긴다.
        if (s.autoNextHref) {
            router.replace(s.autoNextHref);
            return;
        }
        const paidHref = s.nextPaidHref;
        if (!paidHref) return;
        if (s.nextAble) {
            router.replace(paidHref);
            return;
        }
        // 유료 다음화 + 권한 없음 → 대여 흐름(확인 → 차감 → 부족 시 안내).
        if (!s.nextPaidVideoId) return;
        void rentFlow.start({
            videoId: s.nextPaidVideoId,
            cost: s.nextPaidCost ?? 0,
            title: titleRef.current,
            season: s.nextSeason,
            episode: s.nextEpisode,
            onUnlocked: () => router.replace(paidHref),
        });
    };
    const handleEndedRef = useRef(handleEndedImpl);
    handleEndedRef.current = handleEndedImpl;

    // ── 플레이어 생성/파기 ──
    const src = setup?.src ?? "";
    const startAt = setup?.startAt ?? 0;
    // ⚠️ 재생 대상의 정체성은 **영상 _id** 다. src(HLS URL)만으로 이펙트를 걸면,
    // 두 회차가 같은 스트림을 가리키는 경우 회차를 넘겨도 플레이어가 재생성되지 않는다
    // (실측: 자동 다음화로 2화에 진입했는데 1화의 끝난 플레이어가 그대로 남아 정지 상태였다).
    const videoKey = setup?.video?._id ?? "";

    useEffect(() => {
        if (!native || !src || !videoKey) return;
        const key = `${videoKey}@${startAt}`;
        if (handedOffRef.current === key) return;
        handedOffRef.current = key;

        const pendingResult = startNativePlayback({
            contentId: id,
            videoId: videoKey,
            startAtSec: startAt,
            lang,
        });
        if (!pendingResult) return;
        void pendingResult.then((result) => {
            if (!result.ok) {
                setHandoffError(result.error);
                return;
            }
            // 네이티브 플레이어가 WebView 위를 덮는다. 웹은 들어오기 전 화면으로 돌려 둬서, 플레이어를
            // 닫으면 그 화면(상세·홈)이 그대로 보이게 한다. 딥링크로 곧장 들어와 돌아갈 곳이 없으면
            // 상세로 바꿔 둔다 — `/play` 를 남겨 두면 플레이어를 닫자마자 같은 재생이 다시 시작된다.
            // (셸은 `/play` 해시를 마지막 화면으로 저장하지 않으므로 재실행 복원도 이 화면으로 돌아온다.)
            const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
            if (idx > 0) router.back();
            else router.replace(`/contents/${id}`);
        });
        // lang 은 넘기는 순간의 값이면 된다 — 의존값에 넣으면 언어 전환이 재생 넘기기를 다시 일으킨다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [native, src, videoKey, startAt, id, router]);

    useEffect(() => {
        if (native) return;
        if (!src) return;
        const container = stageRef.current;
        if (!container) return;

        endedRef.current = false;
        lastSentRef.current = -1;
        setFatal("");
        setCurrentTime(startAt);
        setDuration(cmsDurationRef.current);

        let cancelled = false;
        const player = createPlayer({
            container,
            events: {
                onReady: (d) => setDuration((prev) => d || prev),
                // 초 단위로만 갱신한다 — 차량 CPU 에서 초당 4회 리렌더는 낭비다.
                onTimeUpdate: (time) =>
                    setCurrentTime((prev) => (Math.floor(prev) === Math.floor(time) ? prev : time)),
                onPlay: () => setPaused(false),
                onPause: () => {
                    setPaused(true);
                    saveProgress();
                },
                onBuffering: setBuffering,
                onEnded: () => handleEndedRef.current(),
                onError: (message) => setFatal(message),
            },
        });
        playerRef.current = player;

        player
            .load(src, { startAt })
            .then(() => {
                if (cancelled) return;
                player.play();
            })
            .catch((e: unknown) => {
                if (cancelled) return;
                setFatal(e instanceof Error ? e.message : tRef.current("player.error"));
            });

        return () => {
            cancelled = true;
            // 화면을 떠나기 직전 위치를 저장한 뒤 파기한다(SPA 이탈은 pagehide 가 오지 않는다).
            saveProgress();
            player.destroy();
            playerRef.current = null;
        };
    }, [native, videoKey, src, startAt, saveProgress]);

    // ── 이탈 시 저장 (탭 숨김 / 페이지 종료) ──
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === "hidden") saveProgress({ useBeacon: true });
        };
        const onPageHide = () => saveProgress({ useBeacon: true });
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("pagehide", onPageHide);
        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("pagehide", onPageHide);
        };
    }, [saveProgress]);

    // ── 터치 조작 ──
    const togglePlay = useCallback(() => {
        const player = playerRef.current;
        if (!player) return;
        if (player.isPaused()) player.play();
        else player.pause();
    }, []);

    const seekBy = useCallback((delta: number) => {
        const player = playerRef.current;
        if (!player) return;
        player.seek(player.getCurrentTime() + delta);
    }, []);

    const goBack = useCallback(() => router.back(), [router]);

    // 컨트롤을 숨긴다(빈 곳 탭). 정지 중에도 숨길 수 있게 타이머와 별개로 바로 내린다.
    const hideControls = useCallback(() => {
        if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
        setControlsVisible(false);
    }, []);

    // Android 시스템 뒤로가기는 WebView 셸이 history.back() 으로 넘긴다 — 라우터가 그대로
    // 이전 화면으로 돌아가고, 언마운트 정리에서 진행률이 저장된다. 여기서 따로 잡을 키가 없다.

    // ── 렌더 ──

    // 유료 미구매(직접 URL 접근 포함)는 재생을 허용하지 않고 상세로 돌려보낸다.
    if (setup?.blocked) return <Navigate to={`/contents/${id}`} replace />;

    const loading = showLoading || setupLoading;
    const error = showError || setupError;
    const noSource = !!setup && !setup.src;
    // 브릿지가 재생을 거절했으면 그 사유를 보여 준다(웹 플레이어로 몰래 폴백하지 않는다 —
    // 셸 안에서 웹 재생이 돌면 DRM·MediaSession 요건을 못 지킨 채 재생된다).
    const failMessage = noSource
        ? t("player.no_source")
        : handoffError
          ? `${t("player.error")} (${handoffError})`
          : fatal;

    return (
        <div id="contents" className="sub_page web_player">
            {/*
              어댑터가 이 컨테이너에 자기 `<video>` 를 심는다. 빈 곳을 탭하면 컨트롤을 다시 띄운다.
              ⚠️ AsyncBoundary **밖**에 둔다. 안에 두면 조회 완료 렌더와 컨테이너 마운트 렌더가
              한 틱 어긋나, 플레이어 생성 이펙트가 컨테이너를 못 찾고 조용히 건너뛴다.
            */}
            <div ref={stageRef} className="web_player__stage" onClick={showControls} />

            <AsyncBoundary
                loading={loading}
                error={error}
                onRetry={() => {
                    reloadShow();
                    reloadSetup();
                }}
            >
                {failMessage ? (
                    <div className="web_player__fallback">
                        <p className="web_player__fallback_msg">{failMessage}</p>
                        <button type="button" className="web_player__btn" onClick={goBack}>
                            <span>{t("player.back")}</span>
                        </button>
                    </div>
                ) : native ? null : (
                    <Controls
                        visible={controlsVisible}
                        title={title}
                        subtitle={subtitle}
                        paused={paused}
                        buffering={buffering}
                        currentTime={currentTime}
                        duration={duration}
                        onTogglePlay={togglePlay}
                        onSeekBy={seekBy}
                        onBack={goBack}
                        onInteract={showControls}
                        onDismiss={hideControls}
                    />
                )}
            </AsyncBoundary>

            {/* 다음 화 유료 → 대여 모달 */}
            {rentFlow.modals}
        </div>
    );
}

/**
 * 재생에 필요한 값을 한 번에 해석한다.
 *
 * 시청 상태 조회를 **한 번**만 한다 — "마지막 본 회차" 판정, 유료 게이트, 이어보기 위치,
 * 유료 다음화 권한이 모두 같은 응답에서 나온다.
 */
async function resolvePlaySetup(
    contents: Content | null,
    videoIdParam: string,
    contentId: string,
): Promise<PlaySetup> {
    const empty: PlaySetup = {
        video: null,
        src: "",
        startAt: 0,
        blocked: false,
        nextAble: false,
    };
    if (!contents) return empty;

    const seasons = contents.seasons ?? [];
    // 회차 전체 + 대표 영상 id.
    const episodeIds = [resolveVideo(contents)?._id, ...seasons.map((s) => s?.video?._id)].filter(
        Boolean,
    ) as string[];

    // 시리즈면 "마지막 본 회차" 판정을 위해, 단편이면 이어보기·게이트를 위해 조회한다.
    const statusMap = episodeIds.length ? await fetchWatchStatus(episodeIds) : {};

    // ?v 가 없으면 상세 '바로보기'와 동일하게 마지막 본 회차부터 이어지게 한다.
    const videoId =
        videoIdParam ||
        (seasons.some((s) => s?.video?._id)
            ? (pickLastWatchedVideoId(statusMap, episodeIds) ?? "")
            : "");

    const video = findVideoById(contents, videoId || undefined);
    const src = hlsUrl(video?.stream?.manifests?.hls_path);
    if (!video || !src) return { ...empty, video: video ?? null };

    // 서버측 게이트가 없으므로 여기서 유료 권한을 확인한다(화면이 이 값으로 <Navigate> 한다).
    // 네이티브로 넘기기 전에 여기서 걸러지므로, 브릿지에는 시청 권한이 확인된 회차만 간다.
    if (video.price === "유료" && statusMap[video._id]?.able !== true) {
        return { ...empty, video, src, blocked: true };
    }

    // 이어보기: 저장 위치가 사실상 끝(끝 3초 이내)이면 처음부터 본다.
    const savedPlay = Number(statusMap[video._id]?.play ?? 0);
    const cmsDuration = video.stream?.duration ?? 0;
    const startAt = savedPlay > 0 && !isWatchComplete(savedPlay, cmsDuration) ? savedPlay : 0;

    // 현재 회차의 시즌/에피소드. 문구 조립은 화면이 한다 — 여기서 t() 를 쓰면
    // 언어가 이 함수의 의존값이 되어 언어 전환마다 재조회·재생 중단이 일어난다.
    const currentSeason = seasons.find((s) => s?.video?._id === video._id);

    // 다음 에피소드. 결제 유형에 따라 종료 시 동작이 갈린다.
    const nextEp = findNextEpisode(contents, video._id);
    const nextVid = nextEp?.video;
    const nextHref = nextVid?._id ? `/play/${contentId}?v=${nextVid._id}` : undefined;
    const isPaidNext = nextVid?.price === "유료";

    // Chromium(hls.js) 웹 폴백은 다중 오디오에서 복제 트랙 버그(c430a4c) 위험 구간이다.
    // 원인을 빨리 찾을 수 있도록 CMS 메타데이터 기준으로 미리 남긴다.
    const audioTracks = video.stream?.audio_tracks?.length ?? 0;
    if (audioTracks > 1) {
        console.warn(`[play] 오디오 트랙 ${audioTracks}개 콘텐츠 — 웹 폴백(hls.js)에서 주의.`);
    }

    return {
        video,
        src,
        startAt,
        season: currentSeason?.season,
        episode: currentSeason?.episode,
        blocked: false,
        autoNextHref: nextVid?.price === "무료" ? nextHref : undefined,
        nextPaidHref: isPaidNext ? nextHref : undefined,
        nextPaidVideoId: isPaidNext ? nextVid?._id : undefined,
        nextPaidCost: isPaidNext ? (nextVid?.popcorn ?? 0) : undefined,
        nextSeason: nextEp?.season,
        nextEpisode: nextEp?.episode,
        nextAble: !!nextVid?._id && statusMap[nextVid._id]?.able === true,
    };
}
