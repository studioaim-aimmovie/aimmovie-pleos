// 공용 확인 모달. 시청기록 삭제 등 확인용(취소/확인) + 단일버튼/강제(로그인 유도) 모드 지원.
//
// 크기는 세로=mobile_style, 가로=index.scss 의 보정이 정한다.
//
// ⚠️ `window.alert` 대신 이 모달을 쓴다. Android WebView 는 셸이 WebChromeClient.onJsAlert 를
// 구현하지 않으면 alert 를 조용히 삼킨다 — 안내가 사라지는 실패 모드를 웹에서 막아 둔다.

import { useBackClose } from "@/lib/useBackClose";

interface Props {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
    /** 취소 버튼 숨김(확인 버튼만). 단일 액션 안내용. */
    hideCancel?: boolean;
    /** 딤 배경 클릭으로 닫기 허용(기본 true). false면 강제(닫기 불가). */
    dismissible?: boolean;
}

export default function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = "삭제",
    cancelLabel = "취소",
    onConfirm,
    onClose,
    hideCancel = false,
    dismissible = true,
}: Props) {
    // 시스템 뒤로가기로 닫는다. 강제 모달(dismissible=false)은 딤 탭처럼 뒤로가기로도 닫지 않는다.
    useBackClose(open, onClose, dismissible);
    if (!open) return null;
    return (
        <div className="confirm_modal_dimmed" onClick={dismissible ? onClose : undefined}>
            <div
                className="confirm_modal"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {title && <p className="tit">{title}</p>}
                <p className="msg">{message}</p>
                <div className="btns">
                    {!hideCancel && (
                        <button type="button" className="btn_cancel" onClick={onClose}>
                            {cancelLabel}
                        </button>
                    )}
                    <button type="button" className="btn_confirm" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
