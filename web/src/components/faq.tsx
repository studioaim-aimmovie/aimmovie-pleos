// FAQ 바텀시트 — apps/web 의 components/common/faq.tsx 를 옮겼다(import 만 compat 으로 바꿨다).
import React from "react";
import { useRouter } from "@/compat/navigation";
import { useEffect, useState } from "react";
import type { FaqItem } from "@aim/core/types/faq";
import { resolveHtmlImages } from "@aim/core/domain/contents";

export default function Faq({ faqs = [] }: { faqs?: FaqItem[] }) {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const toggleActive = (index: number) => {
        setActiveIndex((prev) => (prev === index ? null : index));
    };
    const closeClick = () => {
        router.back();
    };
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);
    return (
        <div className="popup_type3 active">
            <div className="bg" onClick={closeClick}></div>

            <div className="popup">
                <div className="close_btn" onClick={closeClick}>
                    <span></span>
                    <span></span>
                </div>
                <div className="tit">
                    <p>FAQ</p>
                </div>
                <div className="scroll bg_none">
                    {faqs.length === 0 ? (
                        <div className="no_list">
                            <p>등록된 FAQ가 없습니다.</p>
                        </div>
                    ) : (
                        faqs.map((faq, index) => (
                            <div
                                className={`list ${activeIndex === index ? "active" : ""}`}
                                key={faq._id ?? index}
                            >
                                <button type="button" onClick={() => toggleActive(index)}>
                                    {faq.title}
                                </button>
                                <div className="answers">
                                    {/* contents는 관리자 입력 HTML(리치텍스트).
                                        상대경로 <img src>에 CMS 호스트를 붙여 렌더. */}
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: resolveHtmlImages(faq.contents),
                                        }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
