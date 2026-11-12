// 팝콘 충전 안내 — apps/tv 의 PopcornPage 에서 옮겼다(원본: apps/web 의 app/(view)/popcorn/page.tsx).
//
// ⚠️ 차량에는 결제 단계가 없다(차량 네이티브 앱과 같은 1차 제외 항목).
// web 의 같은 화면은 PopcornPackages 가 포트원 V2 결제창을 띄우지만, 이 앱은 상품 버튼을 누르면
// aimmovie.com·모바일 앱에서 충전하라는 안내만 띄운다(문구는 i18n/pleosMessages.ts 의 차량판).
//
// web 페이지의 하단 안내 세 블록(계정·결제 / 해지·환불 / 서비스 이용 사양)은 옮기지 않았다 —
// 차량에서 일어날 수 없는 결제·해지 절차를 설명하는 문구다.

import { useState } from "react";
import { POPCORN_PRODUCTS, bonusPercent } from "@aim/core/api/popcornProducts";

import BackButton from "@/components/BackButton";
import ConfirmModal from "@/components/ConfirmModal";
import { asset } from "@/lib/asset";
import { useT } from "@/i18n/LocaleProvider";

export default function PopcornPage() {
    const t = useT();
    // 충전 불가 안내. window.alert 은 WebView 셸 설정에 따라 삼켜질 수 있어 모달로 띄운다.
    const [noticeOpen, setNoticeOpen] = useState(false);
    const notifyUnavailable = () => setNoticeOpen(true);

    return (
        <div id="contents" className="sub_page popcorn_page">
            <BackButton className="back_btn" />
            <div className="top">
                <div>
                    <img src={asset("/images/logo.svg")} className="logo" alt="AIMMOVIE" />
                    <p className="tit">{t("popcorn.guide_title")}</p>
                    <p>{t("popcorn.guide_desc")}</p>
                    <div className="box">
                        {POPCORN_PRODUCTS.map((product) => (
                            <div
                                key={product.id}
                                className={product.premium ? "premium" : undefined}
                            >
                                {product.premium && (
                                    <span className="label">{t("popcorn.first_benefit")}</span>
                                )}
                                <div className="num">
                                    <img
                                        src={
                                            product.premium
                                                ? asset("/images/img_popcornbox.svg")
                                                : asset("/images/img_popcorn.svg")
                                        }
                                        alt=""
                                    />
                                    <p>
                                        {t("popcorn.package_count", {
                                            count: product.base.toLocaleString(),
                                        })}
                                    </p>
                                    <p className="plus">
                                        {t("popcorn.package_plus", {
                                            count: product.bonus.toLocaleString(),
                                        })}
                                    </p>
                                    <span>
                                        {t("popcorn.package_bonus", {
                                            percent: bonusPercent(product),
                                        })}
                                    </span>
                                </div>
                                {/* web 은 여기서 결제창을 띄운다. 차량은 안내만. */}
                                <button
                                    type="button"
                                    className="btn_type4"
                                    onClick={notifyUnavailable}
                                >
                                    {t("popcorn.package_price", {
                                        amount: product.amount.toLocaleString(),
                                    })}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <ConfirmModal
                open={noticeOpen}
                message={t("popcorn.tv_unavailable")}
                confirmLabel={t("common.confirm")}
                hideCancel
                onConfirm={() => setNoticeOpen(false)}
                onClose={() => setNoticeOpen(false)}
            />
        </div>
    );
}
