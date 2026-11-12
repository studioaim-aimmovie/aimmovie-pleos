// 회원 탈퇴 바텀시트.
//
//  - 탈퇴 실패를 `window.alert` 대신 버튼 위 인라인 문구(`.sheet_error`)로 알린다. WebView 셸이
//    WebChromeClient.onJsAlert 를 구현하지 않으면 alert 가 조용히 삼켜진다.
//  - 완료 후 로그아웃은 AuthContext 의 logout 을 쓴다. `location.href = "/"` 는 패키지
//    오리진에서 "/" 가 파일시스템 루트로 풀려 화면이 깨진다.

import { useState } from "react";
import { withdrawAccount } from "@aim/core/api/user";
import type { MessageKey } from "@aim/core/i18n";

import { useAuth } from "@/auth/AuthContext";
import { useT } from "@/i18n/LocaleProvider";
import { useBackClose } from "@/lib/useBackClose";

interface Props {
    open: boolean;
    balance: number | null;
    onClose: () => void;
}

// 동의 항목 (Figma 5295-11331 기준). 전부 체크해야 탈퇴 가능. 라벨은 사전 키로 관리.
const AGREEMENT_KEYS: MessageKey[] = ["mypage.withdraw.agree"];

export default function WithdrawSheet(props: Props) {
    // 닫히면 본문을 언마운트해 체크 상태·완료 화면을 초기화한다(다시 열면 처음부터).
    if (!props.open) return null;
    return <WithdrawSheetBody {...props} />;
}

function WithdrawSheetBody({ onClose }: Props) {
    const t = useT();
    const { logout } = useAuth();
    const [checks, setChecks] = useState<boolean[]>(() => AGREEMENT_KEYS.map(() => false));
    const [submitting, setSubmitting] = useState(false);
    // 탈퇴 성공 후 완료 화면 전환 여부.
    const [done, setDone] = useState(false);
    const [failMessage, setFailMessage] = useState<string | null>(null);
    const allChecked = checks.every(Boolean);

    const toggle = (i: number) => setChecks((prev) => prev.map((c, idx) => (idx === i ? !c : c)));

    const handleWithdraw = async () => {
        if (!allChecked || submitting) return;
        setSubmitting(true);
        setFailMessage(null);
        const res = await withdrawAccount();
        if (res.result) {
            setDone(true); // 완료 화면으로 전환(로그아웃은 확인 시).
            return;
        }
        setSubmitting(false);
        setFailMessage(res.message || t("mypage.withdraw.fail"));
    };

    // 완료 화면에서 확인/닫기 → 로그아웃(세션이 탈퇴 상태이므로 반드시 정리).
    const finishWithdraw = async () => {
        await logout();
    };
    // 완료 상태에선 배경/닫기 버튼도 로그아웃으로.
    const dismiss = done ? finishWithdraw : onClose;
    // 시스템 뒤로가기는 닫기 버튼과 같다. 탈퇴 요청 중에는 닫지 않는다.
    useBackClose(true, () => {
        if (submitting && !done) return false;
        void dismiss();
    });

    return (
        <div className="withdraw_sheet_dimmed" onClick={dismiss}>
            <div
                className="withdraw_sheet"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sheet_title">
                    <p>{t("mypage.withdraw")}</p>
                    <button
                        type="button"
                        className="btn_close"
                        onClick={dismiss}
                        aria-label={t("common.close")}
                    />
                </div>
                {done ? (
                    <div className="sheet_con">
                        <div className="sheet_body">
                            <div className="sheet_desc">
                                <p className="tit">{t("mypage.withdraw.done_title")}</p>
                                <p className="txt">{t("mypage.withdraw.done_desc")}</p>
                            </div>
                        </div>
                        <button type="button" className="btn_withdraw" onClick={finishWithdraw}>
                            {t("common.confirm")}
                        </button>
                    </div>
                ) : (
                    <div className="sheet_con">
                        <div className="sheet_body">
                            <div className="sheet_desc">
                                <p className="tit">{t("mypage.withdraw.confirm")}</p>
                                <p className="txt">{t("mypage.withdraw.desc")}</p>
                            </div>
                            <div className="agree_checks">
                                {AGREEMENT_KEYS.map((key, i) => (
                                    <div className="check_type1" key={i}>
                                        <input
                                            type="checkbox"
                                            id={`withdraw_agree_${i}`}
                                            checked={checks[i]}
                                            onChange={() => toggle(i)}
                                        />
                                        <label htmlFor={`withdraw_agree_${i}`}>
                                            <span></span>
                                            {t(key)}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* 탈퇴 거부 안내. 버튼 바로 위에 둬서 왜 진행되지 않는지 보이게 한다. */}
                        {failMessage && <p className="sheet_error">{failMessage}</p>}
                        <button
                            type="button"
                            className="btn_withdraw"
                            disabled={!allChecked || submitting}
                            onClick={handleWithdraw}
                        >
                            {t("mypage.withdraw.submit")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
