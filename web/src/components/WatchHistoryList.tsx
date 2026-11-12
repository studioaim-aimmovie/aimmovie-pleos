import { useEffect, useState } from "react";
import Image from "@/compat/Image";
import { useRouter } from "@/compat/navigation";
import { useSession } from "@/compat/session";
import { usePlaybackEpoch } from "@/native/playback";
import {
    fetchWatchHistory,
    deleteWatchHistory,
    isWatchComplete,
    type WatchHistoryItem,
} from "@aim/core/api/videoStatus";
import {
    imageUrl,
    localizedImagePath,
    prepareLabels,
    resolveText,
    FALLBACK_IMAGE,
    FALLBACK_IMAGE_V,
} from "@aim/core/domain/contents";
import { playVideoAction } from "@/compat/playAction";
import { useCountry } from "@/hooks/useCountry";
import { useIsPortrait } from "@/hooks/useLayoutMode";
import { useT, useLang } from "@/i18n/LocaleProvider";
import ConfirmModal from "@/components/ConfirmModal";
import ContentLabels from "@/components/ContentLabels";

// 나의 시청기록 그리드. /authapi/videostatus/watched(전체) 기반.
// apps/tv 의 WatchHistoryList 에서 옮겼다(원본: apps/web components/sub/WatchHistoryList.tsx).
// 포스터 + 제목 + 진행바, 탭하면 이어보기(/play/{콘텐츠id}?v={videoId}).
//
// 세로는 apps/web 모바일처럼 세로 포스터(언어별)·라벨·포스터 위 삭제(X) 버튼을 쓰고, 가로는 TV 처럼
// 가로 포스터를 쓴다. TV 의 hover 미리보기 모달이 없으므로(터치에는 hover 가 없다)
// 삭제 버튼은 **가로에서도** 포스터 위에 둔다 — 그러지 않으면 가로 창에서 기록을 지울 길이 없다.
export default function WatchHistoryList() {
    const { data: session } = useSession();
    const isPortrait = useIsPortrait();
    const { lang } = useLang();
    const isAuthed = !!session?.user;
    const router = useRouter();
    const country = useCountry();
    const t = useT();
    // 네이티브 플레이어에서 돌아오면(onPlaybackFinished) 다시 조회해 방금 본 위치를 진행바에 반영한다.
    const playbackEpoch = usePlaybackEpoch();
    const [items, setItems] = useState<WatchHistoryItem[] | null>(null);
    // 삭제 확인 대상 콘텐츠 id(있으면 확인 팝업 노출).
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);
    useEffect(() => {
        if (!isAuthed) {
            setItems([]);
            return;
        }
        let cancelled = false;
        fetchWatchHistory().then((list) => {
            if (!cancelled) setItems(list);
        });
        return () => {
            cancelled = true;
        };
    }, [isAuthed, playbackEpoch]);

    // 시청기록에서 카드 제거(콘텐츠 단위). 그 콘텐츠에 속한 시청 영상들을 백엔드에서 삭제.
    // 낙관적 UI로 먼저 제거하고, 실패하면 롤백한다. able(시청 권한)은 백엔드가 보존.
    const removeCard = async (cid: string) => {
        const prevItems = items ?? [];
        const belongs = (it: WatchHistoryItem) =>
            (it.contents?._id || it.video.parent || it.video._id) === cid;
        const videoIds = prevItems.filter(belongs).map((it) => it.video._id);
        if (videoIds.length === 0) return;
        setItems(prevItems.filter((it) => !belongs(it))); // 낙관적 제거
        const ok = await deleteWatchHistory(videoIds);
        if (!ok) {
            setItems(prevItems); // 실패 롤백
            // window.alert 은 WebView 셸 설정에 따라 조용히 삼켜진다 — 확인 모달로 알린다.
            setDeleteFailed(true);
        }
    };
    const [deleteFailed, setDeleteFailed] = useState(false);

    // 조회 전(null)엔 아무것도 그리지 않음(깜빡임 방지).
    if (items === null) return null;
    if (items.length === 0) {
        return (
            <div className="no_list">
                <p>{t("mypage.mywatched.empty")}</p>
            </div>
        );
    }

    // 같은 콘텐츠(시리즈의 여러 회차)는 콘텐츠 단위로 묶어 최신 시청 1건만 노출.
    const seen = new Set<string>();
    const visible = [...items]
        .sort((a, b) => (b.playAt ?? "").localeCompare(a.playAt ?? "")) // 최신순 보장
        .filter((it) => {
            const cid = it.contents?._id || it.video.parent || it.video._id;
            if (!cid || seen.has(cid)) return false;
            seen.add(cid);
            return true;
        });

    return (
        <>
            <ul className="list_type4 watch_history_list">
                {visible.map((it) => {
                    const v = it.video;
                    const c = it.contents;
                    // 재생 링크용 콘텐츠 id: 콘텐츠 우선 → video.parent → (폴백) video._id
                    const contentId = c?._id || v.parent || v._id;
                    const play = () =>
                        void playVideoAction({ contentId, episodeVideoId: v._id, router });
                    // 리스트 썸네일은 콘텐츠 포스터만 사용(없으면 기본이미지). 비디오 이미지로는 폴백하지 않음.
                    // 세로는 세로 포스터(표시 언어 우선 — apps/web 과 같다), 가로는 TV 처럼 가로 포스터.
                    // 카드 썸네일이므로 CMS 축소본 w640 을 요청한다.
                    const poster = isPortrait
                        ? imageUrl(
                              localizedImagePath(c?.images, "poster_vertical", lang) ||
                                  localizedImagePath(c?.images, "poster_horizontal", lang),
                              FALLBACK_IMAGE_V,
                              "w640",
                          )
                        : imageUrl(
                              c?.images?.poster_horizontal || c?.images?.poster_vertical,
                              FALLBACK_IMAGE,
                              "w640",
                          );
                    // 포스터 위 오버레이 라벨(위치별). populate된 label만 남는다.
                    const labels = prepareLabels(c?.labels);
                    const title = resolveText(c?.titles, country) || resolveText(v.titles, country);
                    const percent = Math.min(100, Math.max(0, it.play_percent ?? 0));
                    // 남은 시간: play(위치)가 있으면 duration-play, 없으면 percent로 추정.
                    const duration = v.stream?.duration ?? 0;
                    const remaining =
                        duration > 0
                            ? Math.max(
                                  0,
                                  duration - (it.play ?? Math.round((duration * percent) / 100)),
                              )
                            : 0;
                    // 끝까지 본 콘텐츠는 진행바 숨김(이어볼 게 없으므로). 끝 3초 이내 or 100%.
                    const completed =
                        (duration > 0 && isWatchComplete(it.play ?? 0, duration)) || percent >= 100;
                    const showProgress = percent > 0 && !completed;
                    // 시리즈면 러닝타임 숨김 — 백엔드 is_series 플래그 기준(찜 목록과 동일 규칙).
                    const isSeries = !!c?.is_series;
                    const card = (
                        <>
                            <div
                                className="bg_area"
                                style={{ cursor: "pointer" }}
                                onClick={play}
                            >
                                <div className="bg">
                                    <Image
                                        src={poster}
                                        alt={title}
                                        fill
                                        style={{ objectFit: "cover" }}
                                    />
                                </div>
                                {/* 타임라인(진행바): 끝까지 본 건 숨김 */}
                                {showProgress && (
                                    <span className="progress_bar">
                                        <i style={{ width: `${percent}%` }} />
                                    </span>
                                )}
                                {/* 삭제 버튼: stopPropagation 으로 카드 탭(재생)과 분리한다. */}
                                <button
                                    type="button"
                                    className="btn_delete"
                                    aria-label={t("common.delete")}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setPendingDelete(contentId);
                                    }}
                                >
                                    {t("common.delete")}
                                </button>
                                <ContentLabels labels={labels} />
                            </div>

                            <p className="tit">{title}</p>
                        </>
                    );
                    return (
                        <li key={v._id}>
                            {/* 가로는 TV 마크업(.focus_card)을 유지한다 — list4 와 같은 이유로 `li` 안쪽. */}
                            {isPortrait ? card : <div className="focus_card">{card}</div>}
                        </li>
                    );
                })}
            </ul>
            <ConfirmModal
                open={pendingDelete !== null}
                message={t("common.delete_message")}
                confirmLabel={t("common.delete")}
                cancelLabel={t("common.cancel")}
                onConfirm={() => {
                    if (pendingDelete) removeCard(pendingDelete);
                    setPendingDelete(null);
                }}
                onClose={() => setPendingDelete(null)}
            />
            <ConfirmModal
                open={deleteFailed}
                message={t("watch.delete_failed")}
                confirmLabel={t("common.confirm")}
                hideCancel
                onConfirm={() => setDeleteFailed(false)}
                onClose={() => setDeleteFailed(false)}
            />
        </>
    );
}
