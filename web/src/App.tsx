// 앱 셸 — 라우터 + Provider 구성.
//
// ⚠️ HashRouter 를 쓴다.
// 패키지 파일(file:// 또는 셸의 로컬 에셋 오리진)에는 경로를 매핑해 줄 서버가 없어
// History API 라우터는 새로고침·딥링크에서 깨진다. 해시 라우팅이면 진입점이 index.html 하나로 고정된다.
//
// 뒤로 가기: Android 시스템 뒤로가기다. 셸이 WebView.canGoBack()/goBack() 으로 넘기면 해시 라우팅의 브라우저
// history 가 그대로 이전 화면으로 돌아간다 — 웹 쪽에 키 처리가 필요 없다.
//
// ⚠️ 레이아웃(세로/가로)으로 라우트 트리를 가르지 않는다. 창 구역이 840↔1700 으로 바뀔 때
// 화면이 리마운트되면 스크롤·검색어·조회 결과가 사라진다. 분기는 CSS 와 말단 컴포넌트가 한다
// (hooks/useLayoutMode.ts).

import { useEffect } from "react";
import {
    HashRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
    useNavigationType,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import { isGuestAllowed } from "./auth/guestPolicy";
import DevicePairing from "./auth/DevicePairing";
import { LocaleProvider, useT } from "./i18n/LocaleProvider";
import ConfirmModal from "./components/ConfirmModal";
import { LikeStatusProvider } from "./components/LikeStatusProvider";
import { LoginRequiredProvider } from "./components/LoginRequiredProvider";
import LayoutShell from "./components/LayoutShell";

import Home from "./routes/Home";
import ListPage from "./routes/ListPage";
import ContentDetail from "./routes/ContentDetail";
import Play from "./routes/Play";
import Search from "./routes/Search";
import MyPage from "./routes/MyPage";
import PopcornHistoryPage from "./routes/PopcornHistoryPage";
import PopcornPage from "./routes/PopcornPage";
import FaqPage from "./routes/FaqPage";
import PolicyPage from "./routes/PolicyPage";
import ContactPage from "./routes/ContactPage";
import CreatorPage from "./routes/CreatorPage";
import AboutPage from "./routes/AboutPage";
import PwInquiryPage from "./routes/PwInquiryPage";

import "./styles/index.scss";

/**
 * 새 화면으로 들어가면 스크롤을 최상단으로 되돌린다.
 *
 * 뒤로 가기(POP)로 돌아올 때는 되돌리지 않는다 — 브라우저가 그 화면의 스크롤 위치를 복원해야
 * 목록을 보다가 상세에 들어갔다 나와도 보던 자리에 남는다(터치 스크롤 UX 의 기본).
 * 경로가 바뀔 때만 보므로, 창 구역 전환(리사이즈)은 스크롤에 손대지 않는다.
 */
function ScrollResetOnNavigate() {
    const location = useLocation();
    const navType = useNavigationType();
    useEffect(() => {
        if (navType === "POP") return;
        window.scrollTo(0, 0);
    }, [location.pathname, navType]);
    return null;
}

/**
 * 게스트 접근 제어.
 *
 * 정책은 auth/guestPolicy.ts 를 따른다.
 * 허용되지 않은 경로에 미로그인으로 들어오면 **먼저 확인 모달로 안내한 뒤**,
 * [로그인]을 고르면 페어링 화면으로, [취소]를 고르면 홈으로 보낸다
 * (모달 없이 곧바로 넘기면 사용자가 왜 화면이 바뀌었는지 알 수 없다).
 *
 * 차단된 화면의 본문은 렌더하지 않는다. 상세·마이페이지 같은 화면은 마운트되는 순간
 * 로그인 전제의 조회를 시작하므로, 모달 뒤에서 실패한 조회 화면이 비쳐 보이게 된다.
 * 헤더·푸터는 LayoutShell 이 그대로 그리며,
 * 본문 자리에는 한 화면 높이의 빈 칸(`.guest_gate_blank`)을 둬서 푸터가 화면 한가운데로
 * 올라붙지 않게 한다.
 *
 * 모달의 열림 여부를 별도 상태로 두지 않고 경로와 로그인 상태에서 곧바로 계산한다.
 * 확인/취소가 경로를 바꾸는 순간 차단 조건이 풀리면서 모달이 자연스럽게 사라지므로,
 * 남아 있는 상태가 실제 화면과 어긋날 여지가 없다.
 */
function GuestGate({ children }: { children: React.ReactNode }) {
    const { isLoggedIn } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const t = useT();

    if (!isLoggedIn && !isGuestAllowed(location.pathname)) {
        return (
            <>
                <div className="guest_gate_blank" />
                <ConfirmModal
                    open
                    message={t("common.login_message")}
                    confirmLabel={t("common.login")}
                    cancelLabel={t("common.cancel")}
                    // 차단된 화면에는 머물 수 없으므로 딤 배경 클릭으로 닫지 못하게 막는다.
                    dismissible={false}
                    onConfirm={() => navigate("/login", { replace: true })}
                    onClose={() => navigate("/", { replace: true })}
                />
            </>
        );
    }
    return <>{children}</>;
}

/** 로그인 상태에서 /login 에 들어오면 홈으로 되돌린다. */
function LoginRoute() {
    const { isLoggedIn } = useAuth();
    if (isLoggedIn) return <Navigate to="/" replace />;
    return <DevicePairing />;
}

export default function App() {
    return (
        <HashRouter>
            <LocaleProvider>
                <AuthProvider>
                    <LoginRequiredProvider>
                        <LikeStatusProvider>
                            <ScrollResetOnNavigate />
                            <LayoutShell>
                                <GuestGate>
                                    <Routes>
                                        <Route path="/login" element={<LoginRoute />} />
                                        <Route path="/" element={<Home />} />
                                        <Route path="/list/:type" element={<ListPage />} />
                                        <Route path="/contents/:id" element={<ContentDetail />} />
                                        {/* 재생. `?v=<영상 _id>` 로 특정 회차를 지정한다(없으면 마지막 본 회차). */}
                                        <Route path="/play/:id" element={<Play />} />
                                        <Route path="/search" element={<Search />} />
                                        <Route path="/mypage" element={<MyPage />} />
                                        <Route
                                            path="/popcorn/history"
                                            element={<PopcornHistoryPage />}
                                        />
                                        {/* 충전 안내. 차량에는 결제 단계가 없어 안내만 한다. */}
                                        <Route path="/popcorn" element={<PopcornPage />} />
                                        <Route path="/faq" element={<FaqPage />} />
                                        <Route path="/contact" element={<ContactPage />} />
                                        <Route path="/policy/:type" element={<PolicyPage />} />
                                        <Route path="/creator" element={<CreatorPage />} />
                                        <Route path="/about" element={<AboutPage />} />
                                        {/* 비밀번호 변경. 헤더의 마이페이지 드롭다운에서만 들어온다. */}
                                        <Route path="/pwinquiry" element={<PwInquiryPage />} />
                                        {/* 알 수 없는 경로는 홈으로. 해시 라우팅이라 404 화면이 필요 없다. */}
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </GuestGate>
                            </LayoutShell>
                        </LikeStatusProvider>
                    </LoginRequiredProvider>
                </AuthProvider>
            </LocaleProvider>
        </HashRouter>
    );
}
