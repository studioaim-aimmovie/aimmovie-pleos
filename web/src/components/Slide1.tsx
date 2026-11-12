/**
 * Slide1 (AI Movie Top 10) — 세로·가로 공용 터치 캐러셀.
 *
 * 세로 = 세로 포스터 배경 + 랭킹 + 진행바 + 라벨
 * 가로 = 가로 포스터 <img> + 랭킹 + 진행바
 *
 * 입력은 Swiper 터치 스와이프만 쓴다(prev/next 버튼·hover 미리보기 없음). loop 는 끈다.
 *
 * ⚠️ 행 수치는 Swiper `breakpoints`(폭 기준)로 가르지 않고 레이아웃 모드(창 비율)로 가른다.
 *    가로/세로 판정이 CSS 와 한 곳에서 같아야 카드 마크업(세로/가로 포스터)과 슬라이드 수가 어긋나지 않는다.
 *    모드가 바뀌면 Swiper 만 다시 만든다(`key`) — 화면(라우트)·창 스크롤은 그대로다.
 */

import { useEffect, useState } from "react";
import { useRouter } from "@/compat/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "@/compat/Image";
import { useSession } from "@/compat/session";
import { usePlaybackEpoch } from "@/native/playback";
import {
    fetchWatchStatus,
    lastWatchedProgress,
    type VideoStatusMap,
} from "@aim/core/api/videoStatus";

import "swiper/css";
import "@/styles/swiper.css";

import ContentLabels from "@/components/ContentLabels";
import { pickContents } from "@aim/core/domain/contents";
import { useCountry } from "@/hooks/useCountry";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import type { ContentEntry } from "@aim/core/types/main";

interface dataProps {
    rankingData?: ContentEntry[];
}

// 가로도 터치로 넘겨야 하므로 allowTouchMove 를 켠다.
// slidesOffsetAfter: 끝까지 넘기면 마지막 카드가 화면 오른쪽 끝에 붙어 잘려 보여서 왼쪽 여백과 같게 둔다.
const SWIPER_PARAMS = {
    portrait: { slidesPerView: 2.62, spaceBetween: 16, slidesOffsetBefore: 16, slidesOffsetAfter: 16, slidesPerGroup: 2 },
    landscape: { slidesPerView: 4.58, spaceBetween: 24, slidesOffsetBefore: 24, slidesOffsetAfter: 24, slidesPerGroup: 4 },
} as const;

export default function Slide1(props: dataProps) {
    // 데이터가 배열이 아닐 수 있으니 방어적으로 처리
    const country = useCountry();
    const mode = useLayoutMode();
    const slides = (Array.isArray(props.rankingData) ? props.rankingData : []).map((it, i) =>
        pickContents(it, i, country),
    );

    const router = useRouter();

    // 이어보기 진행바: 로그인 시 슬라이드 회차 영상들의 시청상태를 한 번에 조회.
    // 회차(episodes) 목록으로 매칭 → 한 영상이 여러 콘텐츠에 속하면 각 콘텐츠 카드에 모두 노출.
    const { data: session } = useSession();
    // 네이티브 플레이어에서 돌아오면(onPlaybackFinished) 다시 조회해 방금 본 위치를 진행바에 반영한다.
    const playbackEpoch = usePlaybackEpoch();
    const [statusMap, setStatusMap] = useState<VideoStatusMap>({});
    useEffect(() => {
        if (!session?.user) return;
        const ids = slides.flatMap((s) => s.episodes.map((e) => e.id));
        if (ids.length === 0) return;
        let cancelled = false;
        fetchWatchStatus([...new Set(ids)]).then((m) => {
            if (!cancelled) setStatusMap(m);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user, props.rankingData, playbackEpoch]);

    // 슬라이드(포스터) 탭 → 상세페이지로 이동(여기서 "바로보기"로 재생).
    const goToDetail = (videoId: string) => {
        if (!videoId) return;
        router.push(`/contents/${videoId}`);
    };

    if (slides.length === 0) return null;

    const portrait = mode === "portrait";

    return (
        <div className="slide_type1_area">
            <Swiper
                key={mode}
                {...SWIPER_PARAMS[mode]}
                allowTouchMove
                loop={false}
                speed={500}
                observer
                observeParents
                watchSlidesProgress
                className="slide_type1"
            >
                {slides.map((slide) => {
                    // 이 콘텐츠 회차 중 마지막 본 회차 진행률. 본 기록 있을 때만.
                    const prog = lastWatchedProgress(statusMap, slide.episodes);
                    const progress =
                        prog && prog.percent > 0 ? (
                            <span className="progress_bar">
                                <i style={{ width: `${prog.percent}%` }} />
                            </span>
                        ) : null;
                    // 순위가 10이면 두 자리 숫자라 위치/자간을 보정하는 ranking_ten 클래스를 추가
                    const ranking = (
                        <div className={`ranking ${slide.order === 10 ? "ranking_ten" : ""}`}>
                            {slide.order}
                        </div>
                    );
                    return (
                        <SwiperSlide key={slide.key}>
                            {portrait ? (
                                <>
                                    {ranking}
                                    <div
                                        className="bg_area"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => goToDetail(slide.videoId)}
                                    >
                                        {/* 세로는 세로 포스터(imageV). .bg는 배경이미지(bg_cover) 방식. 영문 시 byCountry.US 우선 */}
                                        <div
                                            className="bg"
                                            style={{
                                                backgroundImage: `url(${slide.imageVLocalized})`,
                                            }}
                                        ></div>
                                        {progress}
                                        <ContentLabels labels={slide.labels} />
                                    </div>
                                </>
                            ) : (
                                // 가로는 .focus_card 로 감싼다 — 레이아웃 중립 박스다(web_style 머리말).
                                <div className="focus_card">
                                    {ranking}
                                    <div
                                        className="bg_area"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => goToDetail(slide.videoId)}
                                    >
                                        <div className="bg">
                                            <Image
                                                src={slide.imageH}
                                                alt={slide.title}
                                                fill
                                                style={{ objectFit: "cover" }}
                                            />
                                        </div>
                                        {progress}
                                        <ContentLabels labels={slide.labels} />
                                    </div>
                                </div>
                            )}
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </div>
    );
}
