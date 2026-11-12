import { useCallback, useRef, useState } from "react";
import { unlockVideo, getPopcornBalance } from "@aim/core/api/videoStatus";
import ConfirmModal from "@/components/ConfirmModal";
import RentModal from "@/components/RentModal";
import type { RentTarget } from "@/components/useRentFlow.types";
import { useLang, useT } from "@/i18n/LocaleProvider";
import { pleosText } from "@/i18n/pleosMessages";

export type { RentTarget };

// Pleos 는 결제 모듈이 없고 결제·IAP 정책을 2027년에 정한다. 보유 포인트(팝콘) 차감 대여도 허용 여부가
// 미정이라(2026-10-19 Pleos 회신), 심사용 빌드에서 대여를 끌 수 있게 한다. 이미 대여한(able) 콘텐츠는
// 이 흐름을 거치지 않으므로 그대로 재생된다.
const RENT_ENABLED = import.meta.env.VITE_RENT_ENABLED !== "false";

// 유료 대여 흐름 공용 훅. 상세페이지·플레이어가 start()만 호출하고 modals 를 렌더한다.
//
// ⚠️ 차량에는 충전(PortOne) 단계가 없다.
// 잔고가 부족하면 폰/PC 에서 충전하도록 안내만 한다. 대여(unlock)·잔고 조회는 그대로 쓴다.
// 안내는 window.alert 대신 ConfirmModal 로 띄운다(WebView 셸이 alert 를 삼킬 수 있다).
export function useRentFlow() {
    const t = useT();
    const { lang } = useLang();
    const [notice, setNotice] = useState<string | null>(null);
    const [target, setTarget] = useState<RentTarget | null>(null);
    const [view, setView] = useState<"rent" | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [pending, setPending] = useState(false);
    // 이벤트 리스너(플레이어 ended)에서도 최신 target을 읽도록 ref 보관.
    const targetRef = useRef<RentTarget | null>(null);
    targetRef.current = target;

    const close = useCallback(() => {
        setView(null);
        setTarget(null);
    }, []);

    const start = useCallback(
        async (t: RentTarget) => {
            if (!RENT_ENABLED) {
                setNotice(pleosText(lang, "rent_unavailable"));
                return;
            }
            setTarget(t);
            setView("rent");
            setBalance(await getPopcornBalance());
        },
        [lang],
    );

    // 차감 시도: 성공→onUnlocked, 잔고부족→충전 모달, 그 외→에러 안내.
    const attemptUnlock = useCallback(async () => {
        const rent = targetRef.current;
        if (!rent) return;
        const res = await unlockVideo(rent.videoId, { idempotencyKey: crypto.randomUUID() });
        if (res.result) {
            const cb = rent.onUnlocked;
            close();
            cb();
            return;
        }
        if (res.reason) {
            // 잔고 부족. 차량에서는 충전할 수 없으므로 안내만 하고 흐름을 닫는다.
            close();
            setNotice(pleosText(lang, "rent_insufficient"));
            return;
        }
        setNotice(res.message || t("rent.fail"));
    }, [close, lang, t]);

    const confirmRent = useCallback(async () => {
        if (pending) return;
        setPending(true);
        try {
            await attemptUnlock();
        } finally {
            setPending(false);
        }
    }, [pending, attemptUnlock]);

    const modals = (
        <>
            <RentModal
                open={view === "rent"}
                title={target?.title ?? ""}
                season={target?.season}
                episode={target?.episode}
                cost={target?.cost ?? 0}
                balance={balance}
                pending={pending}
                onConfirm={confirmRent}
                onClose={close}
            />
            <ConfirmModal
                open={notice !== null}
                message={notice ?? ""}
                confirmLabel={t("common.confirm")}
                hideCancel
                onConfirm={() => setNotice(null)}
                onClose={() => setNotice(null)}
            />
        </>
    );

    return { start, modals };
}
