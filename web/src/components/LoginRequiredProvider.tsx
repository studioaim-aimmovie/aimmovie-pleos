import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useRouter } from "@/compat/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { useT } from "@/i18n/LocaleProvider";

// 어디서든 "로그인 후 이용가능합니다" 공용 모달을 띄우는 트리거.
// (좋아요/즐겨찾기 등 액션을 미로그인 상태로 시도할 때 사용)
const LoginRequiredContext = createContext<() => void>(() => {});

export function useLoginRequired() {
    return useContext(LoginRequiredContext);
}

export function LoginRequiredProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const t = useT();
    const [open, setOpen] = useState(false);
    const requireLogin = useCallback(() => setOpen(true), []);

    return (
        <LoginRequiredContext.Provider value={requireLogin}>
            {children}
            <ConfirmModal
                open={open}
                message={t("common.login_message")}
                confirmLabel={t("common.login")}
                cancelLabel={t("common.cancel")}
                onConfirm={() => {
                    setOpen(false);
                    router.push("/login");
                }}
                onClose={() => setOpen(false)}
            />
        </LoginRequiredContext.Provider>
    );
}
