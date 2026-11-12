// 팝콘 내역.
//
// ⚠️ 충전(PortOne)은 이 앱에서 제외한다. 결제 SDK 를 차량에 싣지 않으며,
// 충전 진입은 안내로 대체한다(PopcornHistory 안에서 처리).

import BackButton from "@/components/BackButton";
import PopcornHistory from "@/components/PopcornHistory";

export default function PopcornHistoryPage() {
    return (
        <div id="contents" className="sub_page popcorn_history_page">
            <BackButton className="back_btn" />
            <h2 className="tit">나의 팝콘 내역</h2>
            <PopcornHistory />
        </div>
    );
}
