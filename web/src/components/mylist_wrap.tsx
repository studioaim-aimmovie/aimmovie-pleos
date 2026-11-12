// 마이페이지 본문. 세로·가로를 CSS 가 나눈다.

import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import { useSession } from "@/compat/session";
import { useAuth } from "@/auth/AuthContext";
import { useMotionObserver } from "@/components/useMotionObserver";
import { useT } from "@/i18n/LocaleProvider";
import { getPopcornBalance } from "@aim/core/api/videoStatus";
import { fetchMyInfo, type MyInfo } from "@/api/myInfo";
import FavoriteList from "@/components/FavoriteList";
import WatchHistoryList from "@/components/WatchHistoryList";
import WithdrawSheet from "@/components/WithdrawSheet";

export default function MyListWrap() {
    useMotionObserver();
    const t = useT();
    const { data: session } = useSession();
    const { logout } = useAuth();
    // 내 팝콘 잔고. 로그인 상태에서 조회.
    const [balance, setBalance] = useState<number | null>(null);
    useEffect(() => {
        if (!session?.user) return;
        let cancelled = false;
        getPopcornBalance().then((b) => {
            if (!cancelled) setBalance(b);
        });

        return () => {
            cancelled = true;
        };
    }, [session?.user]);

    // 내 정보. 페어링 세션의 user.id 는 DB _id(ObjectId)라 이메일로 쓸 수 없어 화면에 들어올 때마다 조회한다.
    const [myInfo, setMyInfo] = useState<MyInfo | null>(null);
    useEffect(() => {
        if (!session?.user) return;
        let cancelled = false;
        fetchMyInfo().then((info) => {
            if (!cancelled) setMyInfo(info);
        });
        return () => {
            cancelled = true;
        };
    }, [session?.user]);

    const name = myInfo?.name || session?.user?.name || "";
    // 조회 전·실패 시에는 비워 둔다(ObjectId 를 이메일처럼 보여 주지 않는다).
    const email = myInfo?.email ?? "";
    // SNS(구글/애플) 로그인은 비밀번호가 없어 '비밀번호 변경하기' 숨김.
    const isSocial = !!session?.user?.is_social;
    // 소셜 종류. 이메일(credentials) 계정은 아이콘 미노출.
    const provider = session?.user?.provider;
    const snsIcon = provider === "google" || provider === "apple" ? provider : null;
    // 회원 탈퇴 바텀시트
    const [withdrawOpen, setWithdrawOpen] = useState(false);

    // 로그아웃하면 AuthContext 가 상태를 지우고 GuestGate 가 이 화면을 막는다.
    // alert 는 띄우지 않는다(WebView 셸에 따라 삼켜질 수 있다) — 화면이 곧바로 로그인 안내로 바뀐다.
    const handleLogout = async () => {
        await logout();
    };

    return (
        <>
            {/* 나의 정보 및 팝콘 */}
            <div className="panel_type1">
                <div className="panel_tit motion_target1">
                    <p>{t("mypage.myinfo")}</p>
                </div>
                <div className="panel_cont motion_target1">
                    <div className="account_box">
                        <div className="info">
                            <p className="name">{name}</p>
                            <p className="email">
                                {snsIcon && <span className={`icon ${snsIcon}`} />}
                                {email}
                            </p>
                        </div>
                        {/* <div className="right">
                            <div className="popcorn">
                                <span className="lb">
                                    <i className="ico_popcorn" />내 팝콘
                                </span>
                                <span className="val">{(balance ?? 0).toLocaleString()}개</span>
                            </div>
                            <div className="btns">
                                <Link href="/popcorn/history" className="btn_history">
                                    나의 팝콘 내역
                                </Link>
                                <Link href="/popcorn" className="btn_charge">
                                    충전하기
                                </Link>
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>

            {/* 나의 시청기록 */}
            <div className="panel_type1">
                <div className="panel_tit motion_target1">
                    <p>{t("mypage.mywatched")}</p>
                </div>
                <div className="panel_cont motion_target1">
                    <WatchHistoryList />
                </div>
            </div>

            {/* 찜한 콘텐츠 (그리드는 기존 유지 — 4개) */}
            <div className="panel_type1">
                <div className="panel_tit motion_target1">
                    <p>{t("mypage.myfavorites")}</p>
                </div>
                <div className="panel_cont motion_target1">
                    <FavoriteList />
                </div>
            </div>

            {/* 내 구독내역 / 개별구매 — 추후 공개 예정, 우선 숨김
            <div className="panel_type1">
                <div className="panel_tit motion_target1">
                    <p>내 구독내역</p>
                </div>
                <div className="panel_cont motion_target1">
                    <div className="no_list">
                        <p>구독내역이 없습니다.</p>
                    </div>
                </div>
            </div>

            <div className="panel_type1">
                <div className="panel_tit motion_target1">
                    <p>개별구매</p>
                </div>
                <div className="panel_cont motion_target1">
                    <div className="no_list">
                        <p>새 콘텐츠를 구매하거나 대여할 수 있습니다.</p>
                        <Link href="/" className="btn_type1">
                            콘텐츠 둘러보기
                        </Link>
                    </div>
                </div>
            </div>
            */}

            {/* 계정정보 */}
            <div className="panel_type1">
                <div className="panel_tit motion_target1">
                    <p>{t("mypage.myaccount")}</p>
                </div>
                <div className="panel_cont motion_target1">
                    <ul className="account_menu">
                        {/* 비밀번호 변경. /pwinquiry 는 로그인한 본인만 들어오고 서버가 Bearer
                            토큰으로 사용자를 판별하므로 `?id=` 를 붙이지 않는다.

                            ⚠️ `isSocial` 은 지금 사실상 항상 false 다 — compat/session 의 useSession
                            이 `is_social` 을 채우지 않는다(페어링 응답에 실려 오지 않는다). 세션이 그
                            값을 싣게 되면 비밀번호 없는 계정에는 감추는 규칙이 곧바로 적용된다. */}
                        {!isSocial && (
                            <li>
                                <Link href="/pwinquiry">{t("mypage.changepassword")}</Link>
                            </li>
                        )}
                        <li className="arrow">
                            <Link href="/policy/service">{t("join.agree_terms")}</Link>
                        </li>
                        <li className="arrow">
                            <Link href="/policy/privacy">{t("footer.privacy")}</Link>
                        </li>
                        <li>
                            <button
                                type="button"
                                className="txt"
                                onClick={() => setWithdrawOpen(true)}
                            >
                                {t("mypage.withdraw")}
                            </button>
                        </li>
                        <li>
                            <button type="button" className="txt" onClick={handleLogout}>
                                {t("common.logout")}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <WithdrawSheet
                open={withdrawOpen}
                balance={balance}
                onClose={() => setWithdrawOpen(false)}
            />
        </>
    );
}
