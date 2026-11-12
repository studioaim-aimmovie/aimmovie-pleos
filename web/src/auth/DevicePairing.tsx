// 페어링 로그인 화면. apps/tv 의 DevicePairing 에서 옮겼다.
//
// 차량 화면은 코드만 표시하고, 실제 인증은 이미 로그인된 폰/PC에서 한다
// (정차 중이라도 차량 화면에서 아이디·비밀번호를 치게 하지 않는다 — 네이티브 차량 앱과 같은 방식).
//
//  1) POST /authapi/device/code  → user_code 표시 + QR
//  2) 사용자가 폰에서 승인
//  3) POST /authapi/device/token 을 interval 간격으로 폴링 → 토큰 수령
//
// 문구는 모두 `@aim/core/i18n` 사전을 통한다. 이 화면은 앱의 첫 진입점이라
// 여기만 한국어로 굳어 있으면 en 사용자가 앱을 켠 순간부터 읽을 수 없다.

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { apiRoot } from "@aim/core/config";
import type { MessageKey } from "@aim/core/i18n";
import { renderMessage } from "@aim/core/i18n/rich";
import { setTokens } from "./tokenStore";
import { useAuth } from "./AuthContext";
import { useT } from "../i18n/LocaleProvider";

/**
 * 페어링 요청의 platform 값. CMS 는 이 값을 자유 문자열로 저장해 기기 목록에 보여 준다.
 * 네이티브 차량 앱(car/pleos 의 DevicePairing.PLATFORM)과 같은 값을 써서, 셸이 웹이든
 * 네이티브든 CMS 에서는 같은 "차량" 기기로 보이게 한다.
 */
const PAIRING_PLATFORM = "pleos";

interface CodeResponse {
    result: boolean;
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete: string;
    expires_in: number;
    interval: number;
}

type Phase = "loading" | "waiting" | "expired" | "error";

/**
 * 기기 이름 키 — 승인 화면에서 "무엇을 로그인시키는지" 알아볼 수 있게 보낸다.
 * core 사전에는 TV 이름뿐이라, generic 키를 차량 문구로 덮어써서 쓴다(i18n/pleosMessages.ts).
 */
const DEVICE_NAME_KEY: MessageKey = "tv.device_generic";

/** 남은 시간을 `m:ss` 로. 자리수가 흔들리지 않아야 값이 튀어 보이지 않는다. */
function formatRemaining(ms: number): string {
    const total = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function DevicePairing() {
    const { refresh } = useAuth();
    const t = useT();
    const [phase, setPhase] = useState<Phase>("loading");
    const [code, setCode] = useState<CodeResponse | null>(null);
    // 코드 만료 시각. 폴링 중단 판단과 남은 시간 표시가 같은 값을 봐야 하므로 상태로 올린다.
    const [deadline, setDeadline] = useState(0);
    const [remainingMs, setRemainingMs] = useState(0);
    const [message, setMessage] = useState("");
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // 폴링·만료 타이머를 한 곳에서 정리하기 위한 참조.
    const stopped = useRef(false);

    const issue = useCallback(async () => {
        setPhase("loading");
        setMessage("");
        try {
            const res = await fetch(`${apiRoot()}/authapi/device/code`, {
                method: "POST",
                credentials: "omit",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: PAIRING_PLATFORM,
                    device_name: t(DEVICE_NAME_KEY),
                }),
            });
            // ⚠️ res.json() 을 무방비로 호출하면 안 된다.
            // CMS 에 라우트가 없으면 캐치올이 JSON 이 아닌 본문("error")을 200 으로 돌려주는데,
            // 그때 파싱 예외가 아래 catch 로 빠져 "네트워크 연결" 이라는 엉뚱한 안내가 나간다.
            // 서버까지 도달했는지 여부를 메시지로 구분할 수 있어야 원인을 찾는다.
            const data = (await res.json().catch(() => null)) as CodeResponse | null;

            if (!data) {
                setPhase("error");
                setMessage(t("tv.pairing_err_parse", { status: res.status }));
                return;
            }
            if (!res.ok || !data.result) {
                setPhase("error");
                setMessage(t("tv.pairing_err_code"));
                return;
            }
            setCode(data);
            setDeadline(Date.now() + data.expires_in * 1000);
            setPhase("waiting");
        } catch {
            // 여기까지 오면 응답 자체를 못 받은 것이다(연결 실패·CORS 차단·주소 오류).
            setPhase("error");
            setMessage(t("tv.pairing_err_network"));
        }
    }, [t]);

    useEffect(() => {
        stopped.current = false;
        void issue();
        return () => {
            stopped.current = true;
        };
    }, [issue]);

    // QR — verification_uri_complete 를 인코딩한다.
    // 폰으로 찍으면 코드 입력 단계까지 건너뛴다.
    useEffect(() => {
        if (!code || !canvasRef.current) return;
        void QRCode.toCanvas(canvasRef.current, code.verification_uri_complete, {
            // 캔버스 픽셀 크기. 화면에 보이는 크기는 CSS(.pairing__qrBox canvas)가 정한다 —
            // 세로 구역에서는 줄여 그리므로 원본 해상도를 넉넉히 둬야 흐려지지 않는다.
            width: 400,
            margin: 1,
            // 차량 화면을 폰 카메라로 찍는다. 반사·시야각에도 읽히도록 대비를 최대로.
            color: { dark: "#000000", light: "#ffffff" },
        }).catch(() => {
            /* QR 실패해도 코드 수동 입력으로 로그인할 수 있다 */
        });
    }, [code]);

    // 남은 시간을 1초마다 갱신한다.
    // "N분간 유효합니다" 라는 정적 문구만 두면 만료 30초 전에도 같은 값이 남아,
    // 사용자는 화면이 곧 바뀔 것을 모른 채 폰에서 코드를 입력하다 만료를 맞는다.
    useEffect(() => {
        if (phase !== "waiting" || !deadline) return;
        const tick = () => setRemainingMs(deadline - Date.now());
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [phase, deadline]);

    // 폴링 + 만료 처리
    useEffect(() => {
        if (phase !== "waiting" || !code || !deadline) return;

        let intervalSec = code.interval || 5;
        let timer: ReturnType<typeof setTimeout>;

        const poll = async () => {
            if (stopped.current) return;
            if (Date.now() >= deadline) {
                setPhase("expired");
                return;
            }
            try {
                const res = await fetch(`${apiRoot()}/authapi/device/token`, {
                    method: "POST",
                    credentials: "omit",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ device_code: code.device_code }),
                });
                const data = await res.json().catch(() => null);

                if (res.ok && data?.result && data.access_token) {
                    // 네이티브 셸이면 보안 저장소에 넘기고 저장이 끝날 때까지 기다린다(tokenStore.ts).
                    const saved = await setTokens({
                        accessToken: data.access_token,
                        refreshToken: data.refresh_token,
                        accessExpiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
                        user: data.user,
                    });
                    if (stopped.current) return;
                    if (!saved) {
                        // 코드는 이미 소비됐다 — 같은 코드로 다시 폴링하지 않고 오류 화면(재시도)으로 보낸다.
                        setPhase("error");
                        return;
                    }
                    refresh();
                    return; // 폴링 종료 — 라우터가 로그인 상태를 보고 화면을 바꾼다
                }

                const errCode = data?.code;
                if (errCode === "expired_token" || errCode === "invalid_device_code") {
                    setPhase("expired");
                    return;
                }
                // slow_down 이면 서버가 알려준 간격으로 늦춘다.
                if (errCode === "slow_down") {
                    intervalSec = Number(data?.interval) || intervalSec + 2;
                }
            } catch {
                /* 일시적 네트워크 오류는 다음 폴링에서 회복한다 */
            }
            timer = setTimeout(poll, intervalSec * 1000);
        };

        timer = setTimeout(poll, intervalSec * 1000);
        return () => clearTimeout(timer);
    }, [phase, code, deadline, refresh]);

    return (
        <div className="pairing">
            <div className="pairing__inner">
                <h1 className="pairing__title">{t("common.login")}</h1>
                <p className="pairing__lead">{t("tv.pairing_lead")}</p>

                {phase === "loading" && (
                    <div className="pairing__panel pairing__panel--notice">
                        <p className="pairing__msg">{t("tv.pairing_issuing")}</p>
                    </div>
                )}

                {/* 재시도 버튼은 이 화면의 유일한 조작 지점이다. 정상 흐름(코드 발급 → 폰 승인 →
                폴링)은 입력이 필요 없다. */}
                {phase === "error" && (
                    <div className="pairing__panel pairing__panel--notice">
                        <p className="pairing__msg">{message}</p>
                        <button
                            type="button"
                            className="pairing__retry"
                            onClick={() => void issue()}
                        >
                            {t("common.retry")}
                        </button>
                    </div>
                )}

                {phase === "expired" && (
                    <div className="pairing__panel pairing__panel--notice">
                        <p className="pairing__msg">{t("tv.pairing_expired")}</p>
                        <p className="pairing__note">{t("tv.pairing_expired_note")}</p>
                        <button
                            type="button"
                            className="pairing__retry"
                            onClick={() => void issue()}
                        >
                            {t("tv.pairing_new_code")}
                        </button>
                    </div>
                )}

                {phase === "waiting" && code && (
                    <div className="pairing__body">
                        <div className="pairing__panel pairing__panel--steps">
                            <ol className="pairing__list">
                                <li className="pairing__step">
                                    <span className="pairing__num">1</span>
                                    <span className="pairing__stepText">
                                        {renderMessage(
                                            t("tv.pairing_step_visit", {
                                                url: code.verification_uri.replace(
                                                    /^https?:\/\//,
                                                    "",
                                                ),
                                            }),
                                            "pairing__url",
                                        )}
                                    </span>
                                </li>
                                <li className="pairing__step">
                                    <span className="pairing__num">2</span>
                                    <span className="pairing__stepText">
                                        {t("tv.pairing_step_enter")}
                                    </span>
                                </li>
                            </ol>
                            <div className="pairing__code">{code.user_code}</div>
                            <p className="pairing__note">{t("tv.pairing_code_note")}</p>
                            {/* 폴링이 돌고 있다는 사실과 남은 시간을 같은 줄에서 알린다.
                                누를 것이 없는 화면이라 "지금 무슨 상태인지" 가 특히 중요하다. */}
                            <p className="pairing__status">
                                {t("tv.pairing_waiting")}
                                <span className="pairing__remaining">
                                    {t("common.remaining", {
                                        time: formatRemaining(remainingMs),
                                    })}
                                </span>
                            </p>
                        </div>
                        <div className="pairing__panel pairing__panel--qr">
                            <p className="pairing__qrTitle">{t("tv.pairing_qr_title")}</p>
                            <div className="pairing__qrBox">
                                <canvas ref={canvasRef} />
                            </div>
                            <p className="pairing__note">{t("tv.pairing_qr_note")}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
