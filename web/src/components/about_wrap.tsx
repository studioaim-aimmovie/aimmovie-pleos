// 회사 소개. 터치 스크롤이라 스크롤 연동 연출(.scene_sticky)을 세로·가로 모두 쓴다.
import { useEffect, useRef } from "react";
import { useMotionObserver } from "@/components/useMotionObserver";
import Footer from "@/components/Footer";
import { useT } from "@/i18n/LocaleProvider";
import { asset } from "@/lib/asset";
import { renderMessage } from "@aim/core/i18n/rich";
import type { MessageKey } from "@aim/core/i18n";

// 특징 소개 박스 4개 (문구는 사전 about.box*_title / about.box*_body)
const BOX_KEYS: { title: MessageKey; body: MessageKey }[] = [
    { title: "about.box1_title", body: "about.box1_body" },
    { title: "about.box2_title", body: "about.box2_body" },
    { title: "about.box3_title", body: "about.box3_body" },
    { title: "about.box4_title", body: "about.box4_body" },
];

export default function AboutWrap() {
    useMotionObserver();
    const t = useT();

    // scene: 화면 중앙에 고정(sticky)된 자리에서 문구가 순서대로 나타났다 사라진다.
    //  - scene를 스크롤하는 동안 진행도(0~1)를 문구 개수만큼 구간으로 나눠, 한 번에 하나만 .on(크로스페이드).
    //  - 2번 문구(index>=1) 구간부터 배경을 어둡게(.dark) 유지 → 위로 스크롤하면 역방향으로 복귀.
    const sceneRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;
        const sticky = scene.querySelector<HTMLElement>(".scene_sticky");
        const phrases = Array.from(scene.querySelectorAll<HTMLElement>(".phrase, .cta"));
        if (!sticky || !phrases.length) return;
        const n = phrases.length;
        let raf = 0;
        const LEAD = 0.35; // 각 구간 앞 35%는 배경만 바뀌고 글자는 아직(배경 전환 후의 '텀')
        const FIRST_LEAD = 0.12; // 첫 문구도 초기엔 숨겼다가 살짝 스크롤하면 등장(등장 모션)
        const SECOND_LEAD = 0.15; // 2번 문구는 배경 전환 직후 더 빨리 등장(짧은 텀)
        // 문구별 구간 가중치 — 가운데를 가장 길게, 첫/마지막도 충분히 보이도록. 개수가 3이 아니면 균등.
        const WEIGHTS = n === 3 ? [1, 2.5, 1] : Array<number>(n).fill(1);
        const TOTAL_W = WEIGHTS.reduce((a, b) => a + b, 0);
        const update = () => {
            raf = 0;
            const vh = window.innerHeight;
            const track = scene.offsetHeight - vh; // sticky가 고정된 채 스크롤되는 총 거리
            const scrolled = Math.min(Math.max(-scene.getBoundingClientRect().top, 0), track);
            const progress = track > 0 ? scrolled / track : 0; // 0~1
            // 가중치 누적으로 현재 구간(idx)과 구간 내 진행도(local) 계산
            let idx = 0;
            let segStart = 0;
            let segEnd = 1;
            let acc = 0;
            for (let i = 0; i < n; i++) {
                const start = acc / TOTAL_W;
                const end = (acc + WEIGHTS[i]) / TOTAL_W;
                idx = i;
                segStart = start;
                segEnd = end;
                if (progress < end) break;
                acc += WEIGHTS[i];
            }
            const local = segEnd > segStart ? (progress - segStart) / (segEnd - segStart) : 0; // 0~1
            // '텀'을 시간 지연 대신 스크롤 거리로 줌 → 빠르게 스크롤해도 글자를 건너뛰지 않음.
            // 첫 문구는 짧은 리드(초기 숨김 → 등장), 나머지는 배경 전환 후의 텀.
            const lead = idx === 0 ? FIRST_LEAD : idx === 1 ? SECOND_LEAD : LEAD;
            const show = local >= lead;
            phrases.forEach((el, i) => el.classList.toggle("on", i === idx && show));
            sticky.classList.toggle("dark", idx >= 1); // 2번 문구 구간부터 어두운 배경 유지
        };

        // 순수 스크롤 진행도 기반(네이티브 scroll-snap 미사용) → sticky와 충돌 없이 매끄럽고 안정적.
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };

        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            if (raf) cancelAnimationFrame(raf);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    return (
        <div className="about_inner">
            {/* 배경 그라디언트 — fill 색상만 천천히 전환 */}
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

            {/* 히어로 (100vh, 내용은 상단 40% 지점에 배치 + 등장 모션) */}
            <div className="hero">
                <div className="hero_inner motion_target1">
                    <img src={asset("/images/about/logo.svg")} alt="AIMMOVIE" className="logo" />
                    <h2 className="title">{renderMessage(t("about.hero_title"))}</h2>
                    <p className="desc">
                        {renderMessage(t("about.hero_desc1"))}
                        <br />
                        {renderMessage(t("about.hero_desc2"))}
                    </p>
                </div>
            </div>

            {/* 인트로 헤드라인 */}
            <h3 className="intro motion_target1">{renderMessage(t("about.intro"), "grad")}</h3>

            {/* 특징 박스 (박스별로 개별 등장) */}
            <div className="boxes">
                {BOX_KEYS.map((k) => (
                    <div key={k.title} className="box motion_target1">
                        <p className="box_title">{t(k.title)}</p>
                        <p className="box_body">{renderMessage(t(k.body))}</p>
                    </div>
                ))}
            </div>

            {/* 스크롤 연출: 화면 중앙에 고정(scene_sticky)된 자리에서 문구가 순서대로 나타났다 사라진다.
                스크롤 진행도에 따라 한 번에 하나씩 .on → 크로스페이드 교체. 2번 문구부터 배경 #151a23. */}
            <div className="scene" ref={sceneRef}>
                <div className="scene_sticky">
                    {/* 어두운 배경 하단 블러 글로우 — .dark일 때 함께 노출 */}
                    <div className="scene_glow" aria-hidden="true" />
                    <p className="phrase stage_light">{renderMessage(t("about.scene1"), "pt")}</p>
                    <p className="phrase stage_dark bg_switch">
                        {renderMessage(t("about.scene2"), "pt")}
                    </p>
                    <p className="cta stage_dark">{renderMessage(t("about.cta"), "cy")}</p>
                </div>
            </div>

            <Footer />
        </div>
    );
}
