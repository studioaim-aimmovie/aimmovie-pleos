// 푸터(f_top/f_bottom + 사업자 정보 구조). 가로에서 이 구조를 그리는 규칙은 index.scss 의
// "푸터(가로)" 절에 있다.
//
// ⚠️ 언어 전환(setLang)의 유일한 진입점이 이 푸터다. 헤더는 lang 을 읽기만 한다.

import React, { useState, useRef } from "react";
import Link from "@/compat/Link";
import { useSession } from "@/compat/session";

import { useEffect } from "react";

import type { MenuItem } from "@aim/core/types/menu";
import { getMenuList } from "@aim/core/api/menu";
import { resolveCountry } from "@aim/core/api/country";
import { resolveText } from "@aim/core/domain/contents";
import { useT, useLang } from "@/i18n/LocaleProvider";

export default function Footer() {
    const { data: session } = useSession();

    // 탐색 메뉴 목록 (/api/main/list) — 헤더와 동일 소스. 편성은 resolveCountry(게스트 KR).
    const country = resolveCountry(session?.user?.country_code);
    const [menus, setMenus] = useState<MenuItem[]>([]);
    useEffect(() => {
        getMenuList(country)
            .then((json) => setMenus(Array.isArray(json?.data) ? json.data : []))
            .catch(() => {});
    }, [country]);

    const t = useT();
    const { lang, setLang } = useLang();
    // 선택된 언어 표시: "언어 : 한국어" / "Language : English". 라벨은 네이티브 표기(드롭다운과 동일).
    const langLabel = lang === "en" ? "English" : "한국어";
    const selectedText = `${t("footer.language")} : ${langLabel}`;
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);
    // 언어 선택 → setLang 이 localStorage 기록 + 컨텍스트 갱신으로 전체 전환.
    const chooseLang = (e: React.MouseEvent, next: "ko" | "en") => {
        e.preventDefault();
        setLang(next);
        setIsOpen(false);
    };
    // 셀렉트 박스 바깥을 탭하면 닫기(터치는 mousedown 대신 pointerdown 이 먼저 온다).
    useEffect(() => {
        if (!isOpen) return;
        const onDocDown = (e: PointerEvent) => {
            if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("pointerdown", onDocDown);
        return () => document.removeEventListener("pointerdown", onDocDown);
    }, [isOpen]);

    return (
        <footer className="footer">
            <div className="wrap_type1">
                <div className="f_top">
                    <div className="right">
                        <ul className="list_type3">
                            <li>
                                <p>{t("footer.nav")}</p>
                                <ul>
                                    {menus.map((m) => {
                                        // URL은 url_name 우선(/list/home), 없으면 _id.
                                        const slug = m?.url_name || m._id;
                                        return (
                                            <li key={m._id}>
                                                <Link href={`/list/${slug}`}>
                                                    {resolveText(m?.menu_name, lang)}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                            <li>
                                <p>{t("footer.policy")}</p>
                                <ul>
                                    <li>
                                        <Link href="/policy/privacy">{t("footer.privacy")}</Link>
                                    </li>
                                    <li>
                                        <Link href="/policy/service">{t("footer.terms")}</Link>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <p>{t("footer.support")}</p>
                                <ul>
                                    <li>
                                        <Link href="/contact">Contact Us</Link>
                                    </li>
                                    <li>
                                        <Link href="/creator">{t("footer.creator")}</Link>
                                    </li>
                                    <li>
                                        <Link href="/about">{t("footer.company")}</Link>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div className="left">
                        <div className="flex_area">
                            <Link href="/" className="footer_logo">
                                main
                            </Link>
                            {/* 언어 전환 */}
                            <div
                                className={`select_type2 ${isOpen ? "active" : ""}`}
                                ref={selectRef}
                            >
                                <div className="select_area">
                                    <p className="selected" onClick={() => setIsOpen((o) => !o)}>
                                        {selectedText}
                                    </p>
                                    <div className="select">
                                        <div className="scroll">
                                            <Link
                                                href="#"
                                                className="option"
                                                onClick={(e: React.MouseEvent) =>
                                                    chooseLang(e, "ko")
                                                }
                                            >
                                                한국어
                                            </Link>
                                            <Link
                                                href="#"
                                                className="option"
                                                onClick={(e: React.MouseEvent) =>
                                                    chooseLang(e, "en")
                                                }
                                            >
                                                English
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="f_bottom">
                    <div className="info">
                        <p>{t("footer.biz.company")}</p>
                        <p>{t("footer.biz.ceo")}</p>
                        <p>{t("footer.biz.address")}</p>
                        <p>{t("footer.biz.bizno")}</p>
                        <p>{t("footer.biz.mailorder")}</p>
                        <p>{t("footer.biz.tel")}</p>
                        <p>{t("footer.biz.email")}</p>
                    </div>
                    <p className="copy">{t("footer.copyright")}</p>
                </div>
            </div>
        </footer>
    );
}
