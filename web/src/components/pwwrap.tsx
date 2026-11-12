// 새 비밀번호 설정 — apps/tv 의 pwwrap 에서 옮겼다(원본: apps/web components/common/pwwrap.tsx).
//
// web 과 다른 점이 넷 있다(셋은 apps/tv 와 같다).
//
// 1. **리셋 토큰 흐름이 없다.** 로그인 자체가 디바이스 페어링이라 "비밀번호 찾기" 흐름이 없고,
//    이 화면은 마이페이지에서만 들어온다. 그래서 로그인 상태 변경만 다룬다.
// 2. **전송 경로가 다르다.** web 은 자체 프록시 `/join/pass` 를 쓰지만 이 앱은 CMS 로 직접
//    보낸다(@aim/core 의 changePassword — apiClient 가 Bearer 를 붙인다).
// 3. **화면 키보드 입력이다.** 값은 제어 상태로 들고 있는다 — IME·화면 키보드가 값을 넣는
//    방식이 기기마다 달라 비제어 폼으로 읽으면 빈 값이 잡히는 일이 있다(apps/tv 실측).
// 4. **`window.alert` 을 쓰지 않는다.** WebView 셸이 alert 를 삼킬 수 있어
//     - 입력값 검사 실패는 각 입력칸 **아래에 빨간 문구**로 띄우고,
//     - 서버 응답 실패는 버튼 위에 같은 방식으로 띄우며,
//     - 성공은 공용 `ConfirmModal` 로 알린 뒤 돌아간다.

import { useState } from "react";
import { changePassword } from "@aim/core/api/user";

import BackButton from "@/components/BackButton";
import ConfirmModal from "@/components/ConfirmModal";
import { useRouter } from "@/compat/navigation";
import { useT } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/cn";

// 8~20자, 영문·숫자·특수문자를 모두 포함하고 공백이 없어야 한다.
// apps/web 의 pwwrap.tsx 와 **같은 정규식**이다 — 한쪽만 고치면 플랫폼마다 통과 기준이
// 달라지므로 함께 고칠 것.
const PW_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[{\]};:'",<.>/?\\|`~]).{8,20}$/;

// 검사에 실패하면 고쳐야 하는 칸으로 포커스를 옮겨 화면 키보드를 바로 띄운다.
const focusInput = (id: string) => document.getElementById(id)?.focus();

/** 어느 칸에 무엇이 잘못됐는가. `form` 은 특정 칸에 매이지 않는 서버 응답 오류다. */
interface PwErrors {
    password?: string;
    retype?: string;
    form?: string;
}

export default function PwWrap() {
    const router = useRouter();
    const t = useT();
    const [password, setPassword] = useState("");
    const [retype, setRetype] = useState("");
    const [pending, setPending] = useState(false);
    const [errors, setErrors] = useState<PwErrors>({});
    // 변경 성공 안내. 확인을 누르면 들어온 자리로 돌아간다.
    const [doneOpen, setDoneOpen] = useState(false);

    const handleSubmit = async () => {
        if (pending) return;

        const next = password.trim();
        const confirm = retype.trim();

        // alert 처럼 한 건씩 끊어 알리지 않고 **한 번에 모아** 각 칸 아래에 붙인다.
        // 인라인 문구는 동시에 보여도 서로 방해하지 않고, 고칠 곳을 한눈에 알 수 있다.
        const found: PwErrors = {};
        if (!next) found.password = t("pw.err_empty");
        else if (!PW_RULE.test(next)) found.password = t("pw.err_rule");
        if (!confirm) found.retype = t("pw.err_retype_empty");
        else if (next && next !== confirm) found.retype = t("pw.err_mismatch");

        if (found.password || found.retype) {
            setErrors(found);
            // 고쳐야 하는 첫 칸으로 포커스를 옮긴다(화면 키보드가 그 칸에 바로 열린다).
            focusInput(found.password ? "new_password" : "password_retype");
            return;
        }

        setErrors({});
        setPending(true);
        try {
            const data = await changePassword({ new_password: next });
            if (data.result) {
                setDoneOpen(true);
                return;
            }
            setErrors({ form: data.message || t("pw.fail") });
        } catch {
            setErrors({ form: t("pw.error") });
        } finally {
            setPending(false);
        }
    };

    // 비밀번호가 바뀌었어도 이 기기의 토큰은 그대로 유효하다. 로그아웃시키지 않고
    // 들어온 자리로 되돌린다(web 은 /login 으로 보내지만 이 앱에는 그 화면이 없다).
    const finishDone = () => {
        setDoneOpen(false);
        setPassword("");
        setRetype("");
        router.back();
    };

    return (
        <div className="login_area id_find_completed">
            <BackButton className="back_btn" />
            <div className="wrap_type1">
                <div className="panel_type4">
                    <div className="cont_area">
                        <h2>{t("common.set_new_password")}</h2>

                        <div className="input_type1 pass">
                            <label htmlFor="new_password">
                                {t("pw.label")} <span>{t("pw.rule")}</span>
                            </label>
                            <input
                                id="new_password"
                                name="new_password"
                                type="password"
                                placeholder={t("pw.placeholder")}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    // 고치는 중에 빨간 문구가 남아 있으면 지금 상태가
                                    // 여전히 잘못된 것처럼 읽힌다. 손대는 즉시 지운다.
                                    if (errors.password)
                                        setErrors((prev) => ({ ...prev, password: undefined }));
                                }}
                            />
                            {/* web 과 같은 마크업을 유지한다 — `.input_type1 .message` 스타일이
                                이 구조에 걸려 있다. 오류가 없으면 빈 문단이라 아무것도 보이지 않는다. */}
                            <p className={cn("message", errors.password && "error")}>
                                {errors.password ?? ""}
                            </p>
                        </div>

                        <div className="input_type1 pass">
                            <label htmlFor="password_retype">{t("pw.retype_label")}</label>
                            <input
                                id="password_retype"
                                name="password_retype"
                                type="password"
                                placeholder={t("pw.retype_placeholder")}
                                value={retype}
                                onChange={(e) => {
                                    setRetype(e.target.value);
                                    if (errors.retype)
                                        setErrors((prev) => ({ ...prev, retype: undefined }));
                                }}
                            />
                            <p className={cn("message", errors.retype && "error")}>
                                {errors.retype ?? ""}
                            </p>
                        </div>

                        {/* 서버 응답 오류(전송 실패·CMS 거부)는 특정 칸의 문제가 아니므로
                            버튼 바로 위에 둔다. 없을 때는 렌더하지 않아 여백을 만들지 않는다. */}
                        {errors.form && <p className="form_message error">{errors.form}</p>}

                        {/* 중복 전송은 handleSubmit 의 pending 가드가 막는다. */}
                        <button type="button" className="btn_type1" onClick={handleSubmit}>
                            {t("mypage.changepassword")}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                open={doneOpen}
                message={t("pw.done")}
                confirmLabel={t("common.confirm")}
                hideCancel
                // 확인 말고는 나갈 길을 두지 않는다 — 안내를 보지 못한 채 닫히지 않게.
                dismissible={false}
                onConfirm={finishDone}
                onClose={finishDone}
            />
        </div>
    );
}
