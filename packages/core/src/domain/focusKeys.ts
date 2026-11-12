/** 헤더 첫 번째 메뉴 항목의 고정 focusKey. btn_area에서 위 방향키로 진입 시 setFocus 대상. */
export const HEADER_MENU_FIRST_KEY = "HEADER_MENU_FIRST";

/**
 * 헤더 검색 열기 아이콘의 고정 focusKey. mypage 아이콘에서 왼쪽 방향키로
 * 되돌아올 때 setFocus 대상(드롭다운 메뉴 링크로 새는 것을 막는다).
 */
export const SEARCH_ICON_KEY = "HEADER_SEARCH_ICON";

/**
 * 헤더 검색 입력창의 고정 focusKey. 검색 패널이 열릴 때 곧바로 포커스를 주는
 * setFocus 대상이다(FocusableInput 의 onFocus 가 실제 `<input>.focus()` 까지 이어서
 * 호출하므로 커서와 TV 소프트키보드가 함께 뜬다).
 */
export const SEARCH_INPUT_KEY = "HEADER_SEARCH_INPUT";

/**
 * 헤더 검색 실행 버튼(돋보기)의 고정 focusKey.
 *
 * 이 버튼은 web_style 에서 입력창 위에 `position: absolute` 로 **겹쳐** 놓은 아이콘이라
 * 박스가 입력창 박스 안에 통째로 들어 있다. Norigin 은 기준 요소의 경계를 넘어선 것만
 * 방향 후보로 잡으므로 **어느 방향으로도 닿지 않는다.** 그래서 입력창 ↔ 이 버튼은
 * 방향키를 가로채 `setFocus` 로 직접 잇는다(`Header.tsx`).
 */
export const SEARCH_SUBMIT_KEY = "HEADER_SEARCH_SUBMIT";

/**
 * 메인 KV "바로보기" 버튼의 고정 focusKey. 메인 진입 시 기본 포커스 대상이며,
 * 상세 화면의 같은 역할은 `view_wrap.tsx` 의 PLAY_NOW_KEY 가 담당한다.
 */
export const WATCH_NOW_KEY = "WATCH_NOW";
