/**
 * 메인 래퍼(세로·가로 공용).
 *  - 콘텐츠는 mainData(pickContents)로 데이터 구동.
 *  - Slide1/Slide2 에는 데이터 props만 넘긴다.
 *  - KV 포스터는 세로면 세로 대표이미지, 가로면 가로 대표이미지를 쓴다.
 *  - **KV 미리보기 영상을 재생하지 않는다(정적 포스터만).** 주행 중 움직이는 이미지를 피하고,
 *    본편 플레이어(네이티브 Media3)와 디코더를 다투지 않게 한다.
 *  - "바로보기"는 compat/playAction 을 거쳐 `/play` 로 간다(네이티브 넘기기는 그 화면이 한다).
 */

import Image from "@/compat/Image";
import { useRouter } from "@/compat/navigation";
import { playVideoAction } from "@/compat/playAction";

import { useMotionObserver } from "@/components/useMotionObserver";
import { useIsPortrait } from "@/hooks/useLayoutMode";
import { useT } from "@/i18n/LocaleProvider";
import Slide1 from "@/components/Slide1";
import Slide2 from "@/components/Slide2";
import { pickContents, resolveText } from "@aim/core/domain/contents";
import { useCountry } from "@/hooks/useCountry";
import type { MainShowResponse } from "@aim/core/types/main";

interface dataProps {
    mainData: MainShowResponse;
}

export default function MainWrap(props: dataProps) {
    const router = useRouter();
    const isPortrait = useIsPortrait(); // 세로 창이면 세로 포스터
    const t = useT();
    const data = props.mainData.data;

    const country = useCountry();
    // 메인 상단 KV (main_contents 기준). 슬라이드와 동일한 가공 유틸 재사용.
    const kv = pickContents({ contents: data?.main_contents }, 0, country);
    // 세로 / 가로 대표이미지. 대표이미지(main)가 없으면 pickContents가 포스터→기본이미지로 폴백한다.
    const kvPoster = isPortrait ? kv.mainImageV : kv.mainImageH;
    const kvContentId = kv.videoId; // /play/[id], /contents/[id]는 콘텐츠 _id를 받는다.

    // 페이지(메뉴) 이름. 홈 페이지면 상단 타이틀을 숨긴다.
    const menuName = resolveText(data?.menu_name, country);
    // 홈 판정은 url_name 기준(언어 무관). 표시 언어 전환 시 menuName이 "Home"으로 바뀌므로
    // 로컬라이즈 텍스트 비교에 의존하지 않는다.
    const isHome = data?.url_name?.toLowerCase() === "home";

    // top10: { open, list:[{order, contents}] } 구조. list를 order 순으로 정렬해 사용.
    const top10List = [...(data?.top10?.list ?? [])].sort(
        (a, b) => (a?.order ?? 0) - (b?.order ?? 0),
    );

    // sections: [{ open, order, title, list:[{order, contents}] }]. order 순으로 정렬.
    // open===0(비공개)이거나 목록이 비면 노출하지 않는다.
    const sections = (Array.isArray(data?.sections) ? data.sections : [])
        .slice()
        .filter((s) => s?.open !== 0 && Array.isArray(s?.list) && s.list.length > 0)
        .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

    useMotionObserver();

    return (
        <>
            {!isHome && <h2>{menuName}</h2>}
            <div className="main_kv">
                <div className="img_area">
                    <div className="inner">
                        {kvPoster && (
                            <div className="bg">
                                <Image
                                    src={kvPoster}
                                    alt=""
                                    fill
                                    sizes="100vw"
                                    priority
                                    style={{ objectFit: "cover" }}
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div className="kv_txt motion_target1">
                    <div className="wrap_type1">
                        <h3>{kv.title}</h3>
                        <p className="sub_txt">{kv.summary}</p>
                        <div className="btn_area">
                            <button
                                type="button"
                                className="btn_type1"
                                onClick={() =>
                                    void playVideoAction({ contentId: kvContentId, router })
                                }
                            >
                                <span>{t("common.play_btn")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push(`/contents/${kvContentId}`)}
                                className="btn_type2"
                            >
                                <span>{t("common.info_btn")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <section className="main_section">
                {/* Top10: open===0(비공개)이거나 목록이 비면 노출하지 않는다. */}
                {data?.top10?.open !== 0 && top10List.length > 0 && (
                    <div className="panel_type1">
                        <div className="panel_tit motion_target1">
                            <div className="wrap_type1">
                                <p>AI Movie Top 10</p>
                            </div>
                        </div>
                        <div className="panel_cont motion_target1">
                            <Slide1 rankingData={top10List} />
                        </div>
                    </div>
                )}

                {sections.map((section, index) => (
                    <div className="panel_type1" key={section?._id ?? index}>
                        <div className="panel_tit motion_target1">
                            <div className="wrap_type1">
                                <p>{resolveText(section?.titles, country)}</p>
                            </div>
                        </div>

                        <div className="panel_cont motion_target1">
                            <Slide2 listData={section?.list} />
                        </div>
                    </div>
                ))}
            </section>
        </>
    );
}
