import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import { useSession } from "@/compat/session";
import { useCountry } from "@/hooks/useCountry";
import { getPopcornBalance } from "@aim/core/api/videoStatus";
import {
    getPopcornHistory,
    formatPopcornDate,
    resolvePopcornTitle,
    isAdminTx,
    POPCORN_PAGE_SIZE,
    type PopcornTx,
    type PopcornHistoryTab,
} from "@aim/core/api/popcorn";

const TABS: { key: PopcornHistoryTab; label: string }[] = [
    { key: "all", label: "전체 팝콘내역" },
    { key: "charge", label: "팝콘 충전내역" },
    { key: "use", label: "팝콘 사용내역" },
];

const EMPTY_MSG: Record<PopcornHistoryTab, string> = {
    all: "팝콘 내역이 없습니다.",
    charge: "팝콘 충전내역이 없습니다.",
    use: "팝콘 사용내역이 없습니다.",
};

// 현재 페이지 기준 표시할 페이지 번호(최대 5개 윈도우).
function pageWindow(current: number, totalPages: number): number[] {
    const size = Math.min(5, totalPages);
    let start = Math.max(1, current - 2);
    const end = Math.min(totalPages, start + size - 1);
    start = Math.max(1, end - size + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function PopcornHistory() {
    const { data: session } = useSession();
    const country = useCountry();
    const [tab, setTab] = useState<PopcornHistoryTab>("all");
    const [page, setPage] = useState(1);
    // 서버 사이드 필터·페이징: 백엔드가 type 필터 + 10건/페이지 + total을 내려준다.
    const [items, setItems] = useState<PopcornTx[]>([]);
    const [total, setTotal] = useState(0);
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.user) return;
        let cancelled = false;
        setLoading(true);
        getPopcornHistory(tab, page).then((res) => {
            if (cancelled) return;
            setItems(res.list);
            setTotal(res.total);
            if (res.balance != null) setBalance(res.balance);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [session?.user, tab, page]);

    // 잔고는 내역 응답에 없을 때만 별도 조회(폴백).
    useEffect(() => {
        if (!session?.user || balance != null) return;
        let cancelled = false;
        getPopcornBalance().then((b) => {
            if (!cancelled && b != null) setBalance(b);
        });
        return () => {
            cancelled = true;
        };
    }, [session?.user, balance]);

    const changeTab = (next: PopcornHistoryTab) => {
        if (next === tab) return;
        setTab(next);
        setPage(1);
    };

    // 페이지 수 = ceil(total / 10). 목록/필터는 서버가 처리하므로 응답을 그대로 노출.
    const totalPages = Math.max(1, Math.ceil(total / POPCORN_PAGE_SIZE));
    const isEmpty = !loading && items.length === 0;

    return (
        <div className="ph_body">
            <aside className="ph_side">
                {TABS.map((t) => (
                    <button
                        type="button"
                        key={t.key}
                        className={`ph_tab ${tab === t.key ? "on" : ""}`}
                        onClick={() => changeTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </aside>

            <div className="ph_main">
                <div className="ph_balance">
                    <div className="left">
                        <span className="ico_popcorn" />
                        <span className="lb">내 팝콘</span>
                        <span className="val">{(balance ?? 0).toLocaleString()}개</span>
                    </div>
                    {/* 충전 진입. 차량에는 결제 단계가 없어 /popcorn 은 "다른 기기에서 충전" 안내 화면이다. */}
                    <Link href="/popcorn" className="btn_charge">
                        충전하기
                    </Link>
                </div>

                <div className={`ph_list ${isEmpty ? "empty" : ""}`}>
                    {isEmpty ? (
                        <p className="empty_msg">{EMPTY_MSG[tab]}</p>
                    ) : (
                        <>
                            <div className="list_lines">
                                {items.map((tx, i) => {
                                    // admin(관리자 조정) 또는 사용 거래에 제목 라인 노출.
                                    const isAdmin = isAdminTx(tx);
                                    const title =
                                        isAdmin || tx.type === "use"
                                            ? resolvePopcornTitle(tx, country)
                                            : "";
                                    return (
                                        <div className="line" key={i}>
                                            <div className="left">
                                                <p className="t">
                                                    {tx.amount.toLocaleString()}개{" "}
                                                    {tx.type === "charge" ? "충전" : "사용"}
                                                </p>
                                                {title && (
                                                    <p className="c">
                                                        {isAdmin ? title : <>&lt;{title}&gt;</>}
                                                    </p>
                                                )}
                                                <p className="d">
                                                    {formatPopcornDate(tx.created_at)}
                                                </p>
                                            </div>
                                            <div className="right">
                                                <p className={`amt ${tx.type}`}>
                                                    {tx.type === "charge" ? "+" : "-"}
                                                    {tx.amount.toLocaleString()}
                                                </p>
                                                <p className="bal">
                                                    {tx.balance_after.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {totalPages > 1 && (
                                <div className="ph_pagination">
                                    <button
                                        type="button"
                                        className="arrow first"
                                        disabled={page <= 1}
                                        onClick={() => setPage(1)}
                                        aria-label="처음"
                                    />
                                    <button
                                        type="button"
                                        className="arrow prev"
                                        disabled={page <= 1}
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        aria-label="이전"
                                    />
                                    <div className="nums">
                                        {pageWindow(page, totalPages).map((n) => (
                                            <button
                                                type="button"
                                                key={n}
                                                className={`num ${n === page ? "on" : ""}`}
                                                onClick={() => setPage(n)}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        className="arrow next"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        aria-label="다음"
                                    />
                                    <button
                                        type="button"
                                        className="arrow last"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(totalPages)}
                                        aria-label="끝"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
