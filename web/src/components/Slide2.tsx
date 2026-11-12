/**
 * Slide2 (섹션 가로 캐러셀) — 세로·가로 공용 터치 캐러셀.
 *
 * 원본: 세로 = apps/web 의 components/slide/Slide2.mobile.tsx (세로 포스터 배경 + 진행바 + 라벨)
 *       가로 = apps/tv 의 components/Slide2.tsx (가로 포스터 <img> + 진행바, 미리보기 모달 없음)
 *
 * 입력·분기 방식은 Slide1 과 같다(파일 머리말 참고).
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
    listData?: ContentEntry[];
}

// 세로 = apps/web Slide2.mobile 의 0 구간, 가로 = apps/tv Slide2 의 1033 구간 값 그대로.
// slidesOffsetAfter 는 원본에 없다. 끝까지 넘기면 마지막 카드가 화면 오른쪽 끝에 붙어 잘려 보여서 왼쪽 여백과 같게 둔다.
const SWIPER_PARAMS = {
    portrait: { slidesPerView: 3.36, spaceBetween: 12, slidesOffsetBefore: 16, slidesOffsetAfter: 16, slidesPerGroup: 3 },
    landscape: { slidesPerView: 5.47, spaceBetween: 24, slidesOffsetBefore: 24, slidesOffsetAfter: 24, slidesPerGroup: 5 },
} as const;

export default function Slide2(props: dataProps) {
    // 데이터가 배열이 아닐 수 있으니 방어적으로 처리
    const country = useCountry();
    const mode = useLayoutMode();
    const slides = (Array.isArray(props.listData) ? props.listData : []).map((it, i) =>
        pickContents(it, i, country),
    );

    const router = useRouter();

    // 이어보기 진행바: 로그인 시 슬라이드 회차 영상들의 시청상태를 한 번에 조회.
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
    }, [session?.user, props.listData, playbackEpoch]);

    // 슬라이드(포스터) 탭 → 상세페이지로 이동(여기서 "바로보기"로 재생).
    const goToDetail = (videoId: string) => {
        if (!videoId) return;
        router.push(`/contents/${videoId}`);
    };

    if (slides.length === 0) return null;

    const portrait = mode === "portrait";

    return (
        <div className="slide_type2_area">
            <Swiper
                key={mode}
                {...SWIPER_PARAMS[mode]}
                allowTouchMove
                loop={false}
                speed={500}
                observer
                observeParents
                watchSlidesProgress
                className="slide_type2"
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
                    return (
                        <SwiperSlide key={slide.key}>
                            {portrait ? (
                                <div
                                    className="bg_area"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => goToDetail(slide.videoId)}
                                >
                                    {/* 세로는 세로 포스터(imageV). .bg는 배경이미지(bg_cover) 방식. 영문 시 byCountry.US 우선 */}
                                    <div
                                        className="bg"
                                        style={{ backgroundImage: `url(${slide.imageVLocalized})` }}
                                    ></div>
                                    {progress}
                                    <ContentLabels labels={slide.labels} />
                                </div>
                            ) : (
                                // 가로는 TV 마크업 — .focus_card 는 레이아웃 중립 박스다(web_style 머리말).
                                <div className="focus_card">
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
