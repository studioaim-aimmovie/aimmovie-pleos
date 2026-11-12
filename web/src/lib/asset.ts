/**
 * `public/` 에 둔 정적 파일의 경로를 만든다.
 *
 * ⚠️ **`<img src="/images/…">` 처럼 절대 경로를 직접 쓰면 실기에서 깨진다.**
 *
 * 패키지 앱은 `file://` 로 열린다. 그 문서에서 `/images/logo.svg` 는 **디스크 루트**를
 * 가리키므로 파일을 찾지 못한다. 그래서 `vite.config.ts` 가 `base: "./"` 를 지정하지만,
 * 그것이 고쳐 주는 것은 Vite 가 아는 참조뿐이다 — 번들 자산 경로와 CSS 의 `url(...)` 은
 * 상대 경로로 바뀌지만, **JSX 안의 문자열 리터럴은 Vite 가 손대지 않는다.**
 *
 * 개발 서버(http)에서는 절대 경로도 그대로 동작해서 눈에 띄지 않고, 빌드도 통과한다.
 * ipk 를 설치한 뒤에야 이미지가 비어 보이므로 반드시 이 함수를 거친다.
 *
 * HashRouter 를 쓰므로 문서 URL 의 경로 부분(`…/index.html`)은 화면을 옮겨도 바뀌지
 * 않는다. 따라서 index.html 기준 상대 경로가 어느 화면에서나 같게 풀린다.
 */
export function asset(path: string): string {
    return path.startsWith("/") ? path.slice(1) : path;
}
