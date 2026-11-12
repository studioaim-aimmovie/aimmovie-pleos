/**
 * 웹 플레이어(폴백)의 터치 컨트롤.
 *
 * 차량 실사용 재생은 네이티브 Media3 플레이어의 컨트롤을 쓴다(android 의 PlayScreen.kt).
 * 이 화면은 브릿지가 없는 개발 환경·브릿지 실패 시의 폴백이라, 네이티브와 같은 최소 조작만 둔다:
 * 탭으로 표시/숨김, 5초 자동 숨김(상위 소유), ±10초, 재생/일시정지, 뒤로.
 *
 * ### 설계 규칙
 *  - 표시 상태와 자동 숨김 타이머는 상위(`routes/Play.tsx`)가 소유한다.
 *  - 빈 곳 탭은 컨트롤을 숨긴다. 버튼 탭은 전파를 끊어 숨김으로 이어지지 않게 한다.
 *  - 버튼은 차량 터치 기준(최소 48px, 주요 버튼은 더 크게)으로 잡는다 — 크기는 index.scss.
 */

import type { MouseEvent } from "react";
import { useT } from "@/i18n/LocaleProvider";

interface ControlsProps {
    /** 컨트롤 표시 여부. false 면 렌더하지 않는다. */
    visible: boolean;
    /** 콘텐츠 제목. */
    title: string;
    /** 시리즈면 "시즌 1 · 2회차" 같은 부제. 단편이면 빈 문자열. */
    subtitle?: string;
    /** 지금 정지 상태인가(= 버튼에 ▶ 를 보여야 하는가). */
    paused: boolean;
    /** 버퍼링 중 — 스피너 표시. */
    buffering: boolean;
    /** 현재 위치(초). */
    currentTime: number;
    /** 전체 길이(초). 0이면 진행바를 비활성으로 그린다. */
    duration: number;
    onTogglePlay: () => void;
    /** 상대 이동(초). 음수면 되감기. */
    onSeekBy: (deltaSeconds: number) => void;
    onBack: () => void;
    /** 어떤 조작이든 있었음을 알린다 — 상위의 자동 숨김 타이머를 되돌리는 용도. */
    onInteract: () => void;
    /** 빈 곳을 탭했을 때 — 컨트롤을 숨긴다. */
    onDismiss: () => void;
}

/** 되감기/빨리감기 한 번의 이동량(초). */
export const SEEK_STEP_SEC = 10;

/** 초 → "1:02:03" / "02:03". 진행 시간 표기 공용. */
export function formatClock(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function Controls({
    visible,
    title,
    subtitle = "",
    paused,
    buffering,
    currentTime,
    duration,
    onTogglePlay,
    onSeekBy,
    onBack,
    onInteract,
    onDismiss,
}: ControlsProps) {
    const t = useT();
    if (!visible) {
        // 숨어 있어도 버퍼링 표시는 남긴다 — 화면이 멈춘 것인지 기다리는 것인지 알 수 있어야 한다.
        return buffering ? <p className="web_player__buffering">{t("player.buffering")}</p> : null;
    }

    const percent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

    // 버튼 탭은 숨김(onDismiss)으로 번지지 않게 막고, 자동 숨김 타이머만 되돌린다.
    const act = (fn: () => void) => (e: MouseEvent) => {
        e.stopPropagation();
        onInteract();
        fn();
    };

    return (
        <div
            className="web_player__controls"
            role="group"
            aria-label={title}
            // 컨트롤 바깥(영상 위 빈 곳)을 탭하면 숨긴다.
            onClick={(e) => {
                if (e.target === e.currentTarget) onDismiss();
            }}
        >
            <div className="web_player__topbar">
                <button type="button" className="web_player__back" onClick={act(onBack)}>
                    <span>{t("player.back")}</span>
                </button>
            </div>

            <div className="web_player__bottombar" onClick={(e) => e.stopPropagation()}>
                <p className="web_player__title">{title}</p>
                {subtitle ? <p className="web_player__subtitle">{subtitle}</p> : null}

                <div className="web_player__progress">
                    <span className="web_player__time">{formatClock(currentTime)}</span>
                    <div
                        className="web_player__bar"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={Math.floor(duration)}
                        aria-valuenow={Math.floor(currentTime)}
                    >
                        <span className="web_player__bar_fill" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="web_player__time">{formatClock(duration)}</span>
                </div>

                <div className="web_player__buttons">
                    <button
                        type="button"
                        className="web_player__btn"
                        onClick={act(() => onSeekBy(-SEEK_STEP_SEC))}
                    >
                        <span>{t("player.rewind", { sec: SEEK_STEP_SEC })}</span>
                    </button>

                    <button
                        type="button"
                        className="web_player__btn web_player__btn--main"
                        onClick={act(onTogglePlay)}
                    >
                        <span>{paused ? t("player.play") : t("player.pause")}</span>
                    </button>

                    <button
                        type="button"
                        className="web_player__btn"
                        onClick={act(() => onSeekBy(SEEK_STEP_SEC))}
                    >
                        <span>{t("player.forward", { sec: SEEK_STEP_SEC })}</span>
                    </button>
                </div>
            </div>

            {buffering ? <p className="web_player__buffering">{t("player.buffering")}</p> : null}
        </div>
    );
}
