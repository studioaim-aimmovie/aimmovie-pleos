// 유료 콘텐츠 대여(팝콘 차감) 확인 모달. window.confirm 대체.
// 디자인: Figma w_popup_sample(5122:4153) / 모바일 m_bottomsheet(5119:4093).
//
// apps/web 의 components/popcorn/RentModal.tsx 를 옮겼다(문구는 core 사전, 이미지 경로만 asset()).

import { useT } from "@/i18n/LocaleProvider";
import { asset } from "@/lib/asset";
import { useBackClose } from "@/lib/useBackClose";

interface RentModalProps {
    open: boolean;
    /** 콘텐츠 제목 */
    title: string;
    /** 시즌 번호 */
    season?: number;
    /** 에피소드 번호 */
    episode?: number;
    /** 필요한 팝콘(표시용) */
    cost: number;
    /** 현재 보유 팝콘. 조회 전이면 null */
    balance: number | null;
    /** 결제 처리 중 */
    pending?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export default function RentModal({
    open,
    title,
    season,
    episode,
    cost,
    balance,
    pending = false,
    onConfirm,
    onClose,
}: RentModalProps) {
    const t = useT();
    // 결제 처리 중에는 뒤로가기로도 닫지 않는다(딤 탭과 같은 이유).
    useBackClose(open, () => (pending ? false : onClose()));
    if (!open) return null;

    return (
        // 결제 처리 중에는 딤 탭으로 닫지 않는다 — 차감 결과를 보여 줄 자리가 없어진다.
        <div className="rent_modal_dimmed" onClick={pending ? undefined : onClose}>
            <div
                className="rent_modal"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal_head">
                    <p className="tit">{t("rent.title")}</p>
                    <button type="button" className="close" onClick={onClose} />
                </div>
                <div className="modal_con">
                    <div className="balance">
                        <img src={asset("/images/img_popcorn.svg")} alt="" />
                        <span>{t("rent.my_popcorn", { count: balance ?? 0 })}</span>
                    </div>
                    <p className="msg">
                        ‘{title}’{season ? t("rent.season", { season }) : ""}
                        {episode ? t("rent.episode", { episode }) : ""}
                        <br />
                        {t("rent.confirm")}
                    </p>
                    <button
                        type="button"
                        className={`btn_rent${pending ? " disabled" : ""}`}
                        onClick={() => {
                            if (!pending) onConfirm();
                        }}
                    >
                        {t("rent.button", { cost })}
                    </button>
                </div>
            </div>
        </div>
    );
}
