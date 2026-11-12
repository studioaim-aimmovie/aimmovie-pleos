// 화면 진입 시 1회 조회하는 공통 훅.
//
// apps/web 은 RSC 가 서버에서 미리 받아 props 로 넘겼지만, 이 앱은 서버 렌더가 없어
// 각 화면이 직접 조회해야 한다. 그 반복을 여기로 모은다.
//
// 로딩/에러 표시가 화면마다 제각각이면 리모컨 UX 가 흔들리므로 상태 모양을 통일한다.

import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    /** 사용자에게 보여줄 문구. 실패가 없으면 "". */
    error: string;
    /** 다시 조회. 에러 화면의 "다시 시도" 버튼에 연결한다. */
    reload: () => void;
}

/**
 * @param fn   조회 함수. deps 가 바뀌면 다시 호출된다.
 * @param deps 의존값. 값이 준비되지 않아 조회를 미뤄야 하면 fn 에서 null 을 던지지 말고
 *             호출부에서 `enabled` 로 제어한다.
 */
export function useAsync<T>(
    fn: () => Promise<T>,
    deps: unknown[],
    options: { enabled?: boolean; errorMessage?: string } = {},
): AsyncState<T> {
    const { enabled = true, errorMessage = "정보를 불러오지 못했습니다." } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState("");
    const [nonce, setNonce] = useState(0);

    // 언마운트/재조회 후에 도착한 응답이 상태를 덮어쓰지 않도록 세대를 센다.
    const genRef = useRef(0);

    // fn 은 매 렌더 새로 만들어지는 경우가 많아 deps 에 넣지 않는다.
    // 재조회 시점은 호출부가 넘긴 deps 가 결정한다.
    const fnRef = useRef(fn);
    fnRef.current = fn;

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        const gen = ++genRef.current;
        setLoading(true);
        setError("");

        fnRef
            .current()
            .then((result) => {
                if (gen !== genRef.current) return; // 낡은 응답 무시
                setData(result);
            })
            .catch(() => {
                if (gen !== genRef.current) return;
                setError(errorMessage);
            })
            .finally(() => {
                if (gen !== genRef.current) return;
                setLoading(false);
            });

        return () => {
            // 세대를 올려 진행 중이던 응답을 무효화한다.
            genRef.current++;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, nonce, ...deps]);

    const reload = useCallback(() => setNonce((n) => n + 1), []);

    return { data, loading, error, reload };
}
