// 표시 언어 컨텍스트.
//
// 이 앱은 APK 안 WebView 에서 패키지 파일로 뜨고 서버 렌더도 없어 쿠키에 기댈 수
// 없다. 그래서 localStorage 에 저장한다.
// (`@aim/core/i18n` 의 사전·t()·normalizeLang 을 쓰고, 차량에 맞지 않는
//  문구만 `pleosMessages.ts` 에서 덮어쓴다.)
//
// 인터페이스 — t(key, vars) / lang / setLang.

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { t as translate, type MessageKey, type TVars } from "@aim/core/i18n";
import { DEFAULT_LANG, normalizeLang, type Lang } from "@aim/core/i18n/locale";
import { pleosMessage } from "./pleosMessages";

const STORAGE_KEY = "aim.pleos.lang";

interface LocaleValue {
    lang: Lang;
    setLang: (next: Lang) => void;
    t: (key: MessageKey, vars?: TVars) => string;
}

const LocaleContext = createContext<LocaleValue | null>(null);

function readStoredLang(): Lang {
    try {
        return normalizeLang(window.localStorage.getItem(STORAGE_KEY));
    } catch {
        return DEFAULT_LANG;
    }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>(() => readStoredLang());

    const setLang = useCallback((next: Lang) => {
        const normalized = normalizeLang(next);
        setLangState(normalized);
        try {
            window.localStorage.setItem(STORAGE_KEY, normalized);
        } catch {
            /* 저장 실패해도 이번 실행 동안은 언어가 유지된다 */
        }
    }, []);

    // <html lang> 을 맞춰 둔다 — 폰트/줄바꿈 규칙에 영향을 준다.
    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    const value = useMemo<LocaleValue>(
        () => ({
            lang,
            setLang,
            t: (key, vars) => {
                const override = pleosMessage(lang, key);
                if (override === undefined) return translate(lang, key, vars);
                // 덮어쓴 문구에도 core 와 같은 `{name}` 보간 규칙을 적용한다.
                if (!vars) return override;
                return override.replace(/\{(\w+)\}/g, (_, name: string) =>
                    name in vars ? String(vars[name]) : `{${name}}`,
                );
            },
        }),
        [lang, setLang],
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
    const ctx = useContext(LocaleContext);
    if (!ctx) throw new Error("useLocale 은 LocaleProvider 안에서만 사용할 수 있습니다.");
    return ctx;
}

/** `const t = useT(); t("footer.nav")` */
export function useT(): (key: MessageKey, vars?: TVars) => string {
    return useLocale().t;
}

/** 현재 언어 + 전환 함수. */
export function useLang(): { lang: Lang; setLang: (next: Lang) => void } {
    const { lang, setLang } = useLocale();
    return { lang, setLang };
}
