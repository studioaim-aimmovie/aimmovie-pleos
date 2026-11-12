// 마이페이지(마이리스트 + 시청기록).

import MyListWrap from "@/components/mylist_wrap";
import { useT } from "@/i18n/LocaleProvider";

export default function MyPage() {
    const t = useT();
    return (
        <div id="contents" className="sub_page mypage_page">
            <h2 className="tit">{t("common.myPage")}</h2>
            <MyListWrap />
        </div>
    );
}
