// 재생 진입점.
//
// 재생을 시작하는 버튼(홈 KV "바로보기", 상세 "바로보기"·회차, 시청기록 카드)은 모두 이 함수를 부른다.
// 하는 일은 `/play/:id(?v=)` 로 이동하는 것뿐이고, 네이티브 플레이어로 넘길지 웹 플레이어로 돌릴지는
// 그 화면이 게이트·이어보기를 해석한 뒤 `src/native/playback.ts` 에서 정한다.
//
// 버튼 쪽에서 곧바로 브릿지를 부르지 않는 이유: 브릿지에는 회차 `_id` 와 시작 위치가 필요한데,
// 그 값(마지막 본 회차·저장 위치·유료 권한)은 시청 상태를 조회해야 나온다. 그 조회를 버튼마다
// 따로 두면 판정이 여러 곳에 흩어진다. `/play` 한 곳에서 해석하고 한 곳에서 넘긴다.

export interface PlayActionContext {
    /** 콘텐츠 `_id`. */
    contentId: string;
    /** 특정 회차를 지정할 때(`?v=`). 없으면 `/play` 가 마지막 본 회차를 고른다. */
    episodeVideoId?: string;
    router: { push: (href: string) => void };
}

export type PlayActionResult = { ok: true } | { ok: false; error: string };

/** 재생 경로. 링크의 href 로도 쓴다. */
export function playHref(contentId: string, episodeVideoId?: string): string {
    if (!contentId) return "#";
    return episodeVideoId
        ? `/play/${contentId}?v=${encodeURIComponent(episodeVideoId)}`
        : `/play/${contentId}`;
}

export const playVideoAction = async ({
    contentId,
    episodeVideoId,
    router,
}: PlayActionContext): Promise<PlayActionResult> => {
    if (!contentId) return { ok: false, error: "no_content" };
    router.push(playHref(contentId, episodeVideoId));
    return { ok: true };
};
