// 크리에이터 지원 — apps/web 의 components/sub/creator_wrap.tsx 를 옮겼다(import·이미지 경로만 바꿨다).
//
// apps/tv 는 리모컨용으로 정적 격자·펼친 FAQ 로 바꿨지만, 차량은 터치 스크롤이라 web 연출을 그대로 쓴다.
// ⚠️ 하나만 뺐다: 외부 구글 폼으로 가는 "지원하기" 버튼. WebView 셸에서 외부 링크를 열면 앱 화면이
//    통째로 폼으로 넘어가거나(셸이 막지 않으면) 아무 반응이 없다(막으면). 외부 브라우저로 넘기는
//    브릿지가 생기면 되살린다(README "TV 와 다른 점").
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import "swiper/css";
import { useMotionObserver } from "@/components/useMotionObserver";
import Footer from "@/components/Footer";
import { useT } from "@/i18n/LocaleProvider";
import { asset } from "@/lib/asset";
import { renderAnimatedTitle, renderMessage } from "@aim/core/i18n/rich";
import type { MessageKey } from "@aim/core/i18n";

// 히어로 상단 태그 (문구는 사전 creator.tag1~3)
const TAG_KEYS: MessageKey[] = ["creator.tag1", "creator.tag2", "creator.tag3"];

// 파트너 로고 (public/images/creator/partner-01~11.svg)
const PARTNERS = Array.from({ length: 11 }, (_, i) => `partner-${String(i + 1).padStart(2, "0")}`);

// FAQ (문구는 사전 creator.faq_q*/a*)
const FAQ_KEYS: { q: MessageKey; a: MessageKey }[] = [
    { q: "creator.faq_q1", a: "creator.faq_a1" },
    { q: "creator.faq_q2", a: "creator.faq_a2" },
    { q: "creator.faq_q3", a: "creator.faq_a3" },
    { q: "creator.faq_q4", a: "creator.faq_a4" },
    { q: "creator.faq_q5", a: "creator.faq_a5" },
    { q: "creator.faq_q6", a: "creator.faq_a6" },
];

export default function CreatorWrap() {
    useMotionObserver();
    const t = useT();
    // 기본은 모두 닫힌 상태.
    const [openIdx, setOpenIdx] = useState<number | null>(null);

    return (
        <div className="creator_inner">
            {/* 배경 그라디언트 — 위치/블러는 원본 유지, fill 색상만 천천히 전환 */}
            <div className="bg_gradient" aria-hidden="true">
                <svg
                    viewBox="0 0 3031 1498"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* #FF5F8A(자주) → #EFFF5F(노랑) */}
                    <g className="blob b1" filter="url(#cbf)">
                        <ellipse className="g_pink" cx="2830" cy="728" rx="218.5" ry="378" />
                    </g>
                    <g className="blob b2" filter="url(#cbf)">
                        <ellipse className="g_pink" cx="210" cy="754" rx="327" ry="305" />
                    </g>
                    {/* #AF5FFF(보라) → #5FFAFF(하늘) */}
                    <g className="blob b3" filter="url(#cbf)">
                        <ellipse className="g_purple" cx="260" cy="964" rx="258" ry="184" />
                    </g>
                    {/* #9C62E8(보라 변형) → #5FFAFF(하늘) */}
                    <g className="blob b4" filter="url(#cbf)">
                        <ellipse className="g_purple2" cx="2790" cy="730" rx="169" ry="212" />
                    </g>
                    <defs>
                        {/* 블롭을 양끝으로 밀면서 블러가 잘리지 않도록 필터 영역을 넉넉히 잡는다 */}
                        <filter
                            id="cbf"
                            x="-1200"
                            y="-1000"
                            width="5431"
                            height="3498"
                            filterUnits="userSpaceOnUse"
                        >
                            <feGaussianBlur in="SourceGraphic" stdDeviation="175" />
                        </filter>
                    </defs>
                </svg>
            </div>

            {/* 히어로 */}
            <div className="hero motion_target1">
                <div className="logo_top">
                    <img src={asset("/images/creator/creator-logo.svg")} alt="AIMMOVIE" className="logo" />
                    <span className="for_creators">{t("creator.for_creators")}</span>
                </div>
                {/* 글자 단위 등장 애니메이션 + 인라인 마커({hl}/{brm}) */}
                <h2 className="title">{renderAnimatedTitle(t("creator.title"))}</h2>
                <p className="desc">
                    {renderMessage(t("creator.desc1"))}
                    <br />
                    {renderMessage(t("creator.desc2"))}
                </p>

                <ul className="tags">
                    {TAG_KEYS.map((k) => (
                        <li key={k}>{t(k)}</li>
                    ))}
                </ul>

            </div>

            {/* 파트너 로고 — 등속으로 계속 흘러가는 marquee */}
            <div className="partners motion_target1">
                <Swiper
                    modules={[Autoplay, FreeMode]}
                    className="partner_swiper"
                    loop
                    freeMode
                    allowTouchMove={false}
                    slidesPerView="auto"
                    centerInsufficientSlides
                    spaceBetween={80}
                    breakpoints={{
                        // 모바일은 간격 절반
                        0: { spaceBetween: 32 },
                        1033: { spaceBetween: 100 },
                    }}
                    speed={4000}
                    autoplay={{
                        delay: 0,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: false,
                    }}
                >
                    {/* 넓은 화면에서도 loop가 끊기지 않도록 로고 세트를 2번 반복 */}
                    {[...PARTNERS, ...PARTNERS].map((p, i) => (
                        <SwiperSlide key={`${p}-${i}`} className="logo_slide">
                            <div className="logo_box">
                                <img src={asset(`/images/creator/${p}.svg`)} alt="" />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* FAQ */}
            <div className="faq motion_target1">
                <p className="faq_head">{t("creator.faq_head")}</p>
                <ul className="faq_list">
                    {FAQ_KEYS.map((k, i) => {
                        const isOpen = openIdx === i;
                        return (
                            <li key={k.q} className={`faq_item${isOpen ? " active" : ""}`}>
                                <button
                                    type="button"
                                    className="q"
                                    onClick={() => setOpenIdx(isOpen ? null : i)}
                                >
                                    <span className="mark">Q.</span>
                                    <span className="txt">{t(k.q)}</span>
                                    <span className="toggle" aria-hidden="true" />
                                </button>
                                <div className="a">
                                    <span className="mark">A.</span>
                                    <div className="txt">
                                        <p>{t(k.a)}</p>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <Footer />
        </div>
    );
}
