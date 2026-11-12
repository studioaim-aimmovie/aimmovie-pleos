// i18n 리치 텍스트 렌더러 — 사전 문자열의 인라인 마커를 React 노드로 변환한다.
// 마커: {hl}..{/hl}=강조 span, {br}=줄바꿈, {brm}=모바일 전용 줄바꿈(br_m), \n=줄바꿈.
// 언어별로 강조/줄바꿈 위치가 달라도 문자열 안에서 표현할 수 있게 한다.
import { Fragment, type ReactNode } from "react";

type Run =
    | { type: "text"; text: string; hl: boolean }
    | { type: "br" }
    | { type: "brm" };

// 문자열을 런(run) 시퀀스로 분해. {hl}..{/hl} 안은 hl=true, {br}/{brm}/\n 은 브레이크.
function tokenize(str: string): Run[] {
    const runs: Run[] = [];
    // {hl} {/hl} {br} {brm} 및 개행을 경계로 분할.
    const parts = str.split(/(\{hl\}|\{\/hl\}|\{brm\}|\{br\}|\n)/g);
    let hl = false;
    for (const part of parts) {
        if (part === "") continue;
        if (part === "{hl}") hl = true;
        else if (part === "{/hl}") hl = false;
        else if (part === "{brm}") runs.push({ type: "brm" });
        else if (part === "{br}" || part === "\n") runs.push({ type: "br" });
        else runs.push({ type: "text", text: part, hl });
    }
    return runs;
}

/**
 * 사전 문자열 → 노드. 강조 런은 `<span className={hlClass}>`(요소별 색상 클래스 주입).
 * 예: renderMessage(t("about.intro"), "grad")
 */
export function renderMessage(str: string, hlClass = ""): ReactNode[] {
    return tokenize(str).map((run, i) => {
        if (run.type === "br") return <br key={i} />;
        if (run.type === "brm") return <br key={i} className="br_m" />;
        if (run.hl)
            return (
                <span key={i} className={hlClass}>
                    {run.text}
                </span>
            );
        return <Fragment key={i}>{run.text}</Fragment>;
    });
}

/**
 * 글자 단위 등장 애니메이션 타이틀(크리에이터 히어로). 각 글자를 `.char` span으로 분해해
 * 전역 인덱스 기반 transitionDelay를 준다. 강조 런의 글자엔 `hl` 클래스, {brm}=공백+모바일 줄바꿈.
 */
export function renderAnimatedTitle(str: string): ReactNode[] {
    const out: ReactNode[] = [];
    let ci = 0; // 전역 글자 인덱스(등장 딜레이용) — 공백은 세지 않는다.
    tokenize(str).forEach((run, ri) => {
        if (run.type === "br") {
            out.push(<br key={`br${ri}`} />);
            return;
        }
        if (run.type === "brm") {
            // 데스크탑: 공백 / 모바일: 줄바꿈 (기존 sep과 동일)
            out.push(<Fragment key={`brm${ri}`}>{" "}</Fragment>);
            out.push(<br key={`brmb${ri}`} className="br_m" />);
            return;
        }
        // 단어 단위로 묶는다 → 단어 내부(글자 사이)에서는 줄바꿈되지 않고 단어 사이 공백에서만 끊김.
        // (글자마다 inline-block이라 그대로 두면 "turn"/"." 처럼 단어가 쪼개진다.)
        const words = run.text.split(" ");
        words.forEach((word, wi) => {
            if (wi > 0) out.push(<Fragment key={`sp${ri}-${wi}`}>{" "}</Fragment>); // 단어 사이 공백(줄바꿈 지점)
            if (word === "") return;
            const chars = Array.from(word).map((ch) => {
                const idx = ci;
                ci += 1;
                return (
                    <span
                        key={`c${idx}`}
                        className={`char${run.hl ? " hl" : ""}`}
                        style={{ transitionDelay: `${idx * 0.08}s` }}
                    >
                        {ch}
                    </span>
                );
            });
            // 단어 래퍼: 내부 글자 사이 줄바꿈 금지.
            // font: inherit — 전역 리셋(span=16px/400)을 무시하고 .title의 폰트를 상속시켜야
            // 안쪽 .char(font-size:inherit)가 타이틀 크기(80px 등)를 유지한다.
            out.push(
                <span key={`w${ri}-${wi}`} style={{ whiteSpace: "nowrap", font: "inherit" }}>
                    {chars}
                </span>,
            );
        });
    });
    return out;
}
