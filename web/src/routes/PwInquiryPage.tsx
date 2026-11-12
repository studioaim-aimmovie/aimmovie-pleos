// 비밀번호 변경.
//
// 로그인한 본인만 들어오고 서버가 Bearer 토큰으로 사용자를 판별하므로 쿼리를 쓰지 않는다.
// 헤더의 마이페이지 드롭다운이 붙여 보내는 `?id=` 는 무시된다.

import PwWrap from "@/components/pwwrap";

export default function PwInquiryPage() {
    return (
        <div id="contents" className="signup_page">
            <PwWrap />
        </div>
    );
}
