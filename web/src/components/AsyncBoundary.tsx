// 조회 상태(로딩/실패)를 화면마다 같은 모양으로 보여 준다.
//
// 화면마다 표현이 다르면 사용자가 멈춘 건지 로딩 중인지 구분하지 못한다. 실패하면 "다시 시도"
// 한 가지 조작만 둔다(차량 통신은 터널·지하 주차장에서 자주 끊긴다).

import type { ReactNode } from "react";
import { useT } from "@/i18n/LocaleProvider";

interface Props {
    loading: boolean;
    error: string;
    onRetry: () => void;
    children: ReactNode;
}

export default function AsyncBoundary({ loading, error, onRetry, children }: Props) {
    const t = useT();

    if (loading) {
        return (
            <div className="async_state">
                <p className="async_state__msg">{t("common.loading")}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="async_state">
                <p className="async_state__msg">{error}</p>
                <button type="button" onClick={onRetry} className="btn async_state__retry">
                    <span>{t("common.retry")}</span>
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
