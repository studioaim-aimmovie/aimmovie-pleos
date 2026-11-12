// 헤더(세로=모바일, 가로=데스크탑 마크업을 함께 그리고 CSS 의 m_only/d_only 가 하나만 보이게 한다).
//
//  - 마이페이지 드롭다운(가로)은 hover 가 아니라 **탭으로 열고 닫는다**. 차량은 터치 전용이라
//    hover 가 없다. 바깥을 탭하면 닫힌다.
//  - 로그아웃은 AuthContext 의 logout 을 쓴다. `window.location.href = "/"` 는 패키지
//    오리진(file:// 등)에서 "/" 가 파일시스템 루트로 풀려 화면이 깨진다.
//  - 로그인 링크는 디바이스 페어링 화면(/login)으로 간다.

import React, { useEffect, useRef, useState } from "react";
import Link from "@/compat/Link";
import { usePathname, useRouter } from "@/compat/navigation";
import { useSession } from "@/compat/session";
import { useAuth } from "@/auth/AuthContext";

import type { MenuItem } from "@aim/core/types/menu";
import { resolveText } from "@aim/core/domain/contents";
import { useIsPortrait } from "@/hooks/useLayoutMode";
import { useT, useLang } from "@/i18n/LocaleProvider";
import { useTransitionMount } from "@/hooks/useTransitionMount";

interface HeaderProps {
    /** 상단 메뉴 목록. LayoutShell 이 조회해 넘긴다(조회 전에는 빈 배열). */
    menus: MenuItem[];
}

export default function Header({ menus }: HeaderProps) {
    const { data: session } = useSession();
    const { logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const isPortrait = useIsPortrait();
    const t = useT();
    // 메뉴명 표시 언어(푸터에서 고른 ko/en). 유저 국가와 독립.
    const { lang } = useLang();
    const [isActive, setIsActive] = useState(false);
    // 마이페이지 드롭다운(가로) 열림 상태. 마운트 + 가시성(.mypage_area.on) 모두 이 상태로 제어한다.
    const [isMypageOpen, setMypageOpen] = useState(false);
    const mypageAreaRef = useRef<HTMLDivElement>(null);
    // 검색 입력: 비제어(ref)로 다룬다. 제어형 value는 한글 IME 조합 중 리렌더로
    // 글자가 초기화돼 "마지막 글자만 입력되는" 문제가 있어 ref에서 값을 읽는다.
    const searchInputRef = useRef<HTMLInputElement>(null);
    // 검색 패널: 닫힘 시 DOM에서 언마운트한다.
    // (opacity transition 유지 — transitionend 발화 후 언마운트)
    const {
        ref: searchRef,
        isOpen: isSearch,
        mounted: searchMounted,
        active: searchActive,
        setOpen: setSearch,
    } = useTransitionMount<HTMLDivElement>();

    // 세로/가로 경계를 넘어가면(창 구역 전환) 열려 있던 모바일 메뉴·드롭다운을 닫는다.
    // 모바일 메뉴는 `body.fixed` 로 스크롤을 잠그므로, 열린 채 가로로 바뀌면 잠금만 남는다.
    useEffect(() => {
        setIsActive((open) => {
            if (open) {
                document.body.classList.remove("fixed");
                document.body.style.top = ``;
                window.scrollTo(0, scrollY.current);
            }
            return false;
        });
        setMypageOpen(false);
    }, [isPortrait]);

    // 드롭다운 바깥을 탭하면 닫는다(hover 가 없으니 "벗어나면 닫힘"을 이걸로 대신한다).
    useEffect(() => {
        if (!isMypageOpen) return;
        const onPointerDown = (e: PointerEvent) => {
            if (!mypageAreaRef.current?.contains(e.target as Node)) setMypageOpen(false);
        };
        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [isMypageOpen]);

    // 화면을 옮기면 드롭다운을 닫는다.
    useEffect(() => {
        setMypageOpen(false);
    }, [pathname]);

    const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
    const [topScroll, setTopScroll] = useState<"scroll" | "top" | null>("top");
    const lastScrollY = useRef(typeof window !== "undefined" ? window.pageYOffset : 0);

    const scrollY = useRef(0);

    const isActiveMenu = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    const handleClick = () => {
        if (!isActive) {
            scrollY.current = window.scrollY;
            document.body.classList.add("fixed");
            document.body.style.top = `-${scrollY.current}px`;

            setIsActive(true);
        } else {
            document.body.classList.remove("fixed");
            document.body.style.top = ``;
            window.scrollTo(0, scrollY.current);
            setIsActive(false);
        }
    };

    const closeNav = () => {
        if (isActive) {
            document.body.classList.remove("fixed");
            document.body.style.top = ``;
            window.scrollTo(0, scrollY.current);
            setIsActive(false);
        }
    };

    const searchClick = () => {
        if (!isSearch) {
            scrollY.current = window.scrollY;
            document.body.classList.add("fixed");
            document.body.style.top = `-${scrollY.current}px`;

            setSearch(true);
        } else {
            document.body.classList.remove("fixed");
            document.body.style.top = ``;
            window.scrollTo(0, scrollY.current);
            setSearch(false);
        }
    };

    // 검색 패널이 열리면 입력창에 포커스를 줘 화면 키보드를 곧바로 띄운다.
    // 차량 화면에서 입력창을 한 번 더 탭하게 하지 않으려는 것이다.
    useEffect(() => {
        if (searchMounted && isSearch) searchInputRef.current?.focus();
    }, [searchMounted, isSearch]);

    // 검색 실행: 검색어가 있으면 /search?str= 로 이동하고 검색 패널을 닫는다.
    const doSearch = () => {
        const str = (searchInputRef.current?.value ?? "").trim();
        if (!str) return;
        // 화면 키보드를 내린다 — 결과 목록이 키보드에 가려지지 않게.
        searchInputRef.current?.blur();
        router.push(`/search?str=${encodeURIComponent(str)}`);
        if (searchInputRef.current) searchInputRef.current.value = "";
        if (isSearch) searchClick();
    };

    // 로그아웃. AuthContext 의 logout 이 서버 폐기 → 상태 초기화까지 처리한다(파일 머리말 참고).
    const handleLogout = async () => {
        setMypageOpen(false);
        await logout();
    };
    useEffect(() => {
        // 스크롤 저크 방지: 매 스크롤 이벤트마다 처리하지 않고 rAF로 프레임당 1회만 계산.
        // setState는 동일값이면 React가 bail-out 하므로 top↔scroll / 방향 전환 시에만 리렌더.
        let ticking = false;
        const updateScrollDirection = () => {
            // 고무줄 오버스크롤은 pageYOffset을 음수로 만든다. 음수를 그대로 두면
            // 반동 복귀(-값→0) 구간이 "하향 스크롤"로 오인돼 최상단에서 헤더가 사라진다.
            // → 0 이상으로 clamp 해 음수 오버스크롤이 방향 계산에 영향 주지 않게 한다.
            const pageY = Math.max(0, window.pageYOffset);
            const atTop = pageY < 50;
            setTopScroll(atTop ? "top" : "scroll");
            if (atTop) {
                // 최상단에선 방향과 무관하게 항상 표시(안전장치).
                setScrollDirection("up");
                lastScrollY.current = pageY;
            } else {
                const delta = pageY - lastScrollY.current;
                if (Math.abs(delta) > 10) {
                    setScrollDirection(delta > 0 ? "down" : "up");
                    lastScrollY.current = pageY; // 10px 넘게 움직였을 때만 기준점 갱신(히스테리시스)
                }
            }
            ticking = false;
        };
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(updateScrollDirection);
        };

        // 마운트 직후 현재 스크롤 위치로 한 번 보정 (load 이벤트가 이미 지났거나
        // SPA 이동으로 발생하지 않는 경우 대비)
        updateScrollDirection();
        window.addEventListener("load", onScroll);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("load", onScroll);
        };
    }, []);

    return (
        <header
            className={`header ${scrollDirection === "down" ? "hidden" : "active"} ${topScroll === "top" ? "top" : "scroll"}`}
        >
            <div className="left">
                {/* div 마크업을 유지한다 — 스타일이 요소 선택자에 걸려 있다. */}
                <div className="ham_btn m_only" onClick={handleClick}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <h1 className="logo">
                    <Link href="/" aria-label="AIMMOVIE"></Link>
                </h1>
                <nav className={isActive ? "nav active" : "nav"}>
                    <div className="nav_close" onClick={handleClick}>
                        close
                    </div>
                    <ul>
                        {/*선택 메뉴 .on — /api/main/list 기반 동적 메뉴 */}
                        {menus.map((m) => {
                            // URL은 url_name 우선(/list/home). 없으면 _id로 폴백.
                            const slug = m?.url_name || m._id;
                            const href = `/list/${slug}`;
                            return (
                                <li
                                    key={m._id}
                                    className={isActiveMenu(href) ? "on" : ""}
                                    onClick={closeNav}
                                >
                                    <Link href={href}>{resolveText(m?.menu_name, lang)}</Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
            <div className="right">
                <div className="search_area">
                    <button type="button" className="search_open_icon" onClick={searchClick}>
                        search
                    </button>
                    {searchMounted && (
                        <div ref={searchRef} className={searchActive ? "search active" : "search"}>
                            <button type="button" className="search_close" onClick={searchClick}>
                                close
                            </button>
                            <div className="input_area1">
                                <input
                                    type="text"
                                    // 화면 키보드의 엔터 키를 "검색"으로 띄운다.
                                    enterKeyHint="search"
                                    placeholder={t("common.search")}
                                    aria-label="검색창"
                                    ref={searchInputRef}
                                    onKeyDown={(e) => {
                                        // 한글 IME 조합 중(isComposing) Enter는 '조합 확정'이라
                                        // 검색을 실행하지 않는다. 조합이 끝난 뒤 Enter에만 검색.
                                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                            e.preventDefault();
                                            doSearch();
                                        }
                                    }}
                                />
                                <button type="button" className="search_btn" onClick={doSearch}>
                                    {t("common.search")}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {session?.user ? (
                    <div
                        ref={mypageAreaRef}
                        className={`mypage_area${isMypageOpen ? " on" : ""}`}
                    >
                        {/* m_only/d_only는 CSS로 하나만 보이는 반응형 중복 요소다.
                            세로는 마이페이지로 바로 가고, 가로는 드롭다운을 연다. */}
                        <Link href="/mypage" className="mypage_icon m_only">
                            my page
                        </Link>
                        <Link
                            href="#"
                            className="mypage_icon d_only"
                            aria-expanded={isMypageOpen}
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                e.preventDefault();
                                setMypageOpen((open) => !open);
                            }}
                        >
                            my page
                        </Link>
                        {isMypageOpen && (
                            <div className="mypage_menu">
                                <p>{session.user.name}</p>
                                <ul>
                                    <li>
                                        <Link href="/mypage">
                                            <span className="my"></span>
                                            {t("common.myPage")}
                                        </Link>
                                    </li>
                                    {/* SNS(구글/애플) 로그인은 비밀번호가 없으므로 변경 버튼 숨김 */}
                                    {!session.user.is_social && (
                                        <li>
                                            <Link
                                                href={`/pwinquiry?id=${encodeURIComponent(session.user.id)}`}
                                            >
                                                <span className="pass"></span>
                                                {t("mypage.changepassword")}
                                            </Link>
                                        </li>
                                    )}
                                    <li>
                                        <Link
                                            href="#"
                                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                                e.preventDefault();
                                                void handleLogout();
                                            }}
                                        >
                                            <span className="logout"></span>
                                            {t("common.logout")}
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mypage_area">
                        <Link href="/login" className="login_link m_only">
                            Login
                        </Link>
                        <Link href="/login" className="login_link d_only">
                            Login
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
