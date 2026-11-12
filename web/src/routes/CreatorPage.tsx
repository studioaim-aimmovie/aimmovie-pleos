// 크리에이터 지원.

import BackButton from "@/components/BackButton";
import CreatorWrap from "@/components/creator_wrap";

export default function CreatorPage() {
    return (
        <div id="contents" className="sub_page creator_page">
            <BackButton className="back_btn" />
            <CreatorWrap />
        </div>
    );
}
