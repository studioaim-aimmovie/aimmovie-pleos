// 회사 정보 — apps/web 의 app/(view)/about/page.tsx 대응.

import BackButton from "@/components/BackButton";
import AboutWrap from "@/components/about_wrap";

export default function AboutPage() {
    return (
        <div id="contents" className="sub_page about_page">
            <BackButton className="back_btn" />
            <AboutWrap />
        </div>
    );
}
