// `<Link href="/contents/123">` 의 href 를 to 로 바꿔 react-router 의 Link 로 넘기는 얇은 래퍼.

import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
    href: string;
    children?: ReactNode;
    /** SPA 에는 해당 없음. 받되 무시한다. */
    prefetch?: boolean;
    /** react-router 의 replace 로 넘긴다. */
    replace?: boolean;
    scroll?: boolean;
}

const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
    { href, prefetch: _prefetch, scroll: _scroll, replace, children, ...rest },
    ref,
) {
    // 외부 링크(http…)나 mailto: 는 라우터가 아니라 그대로 <a> 로 둔다.
    if (/^([a-z]+:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return (
            <a ref={ref} href={href} {...rest}>
                {children}
            </a>
        );
    }

    return (
        <RouterLink ref={ref} to={href} replace={replace} {...rest}>
            {children}
        </RouterLink>
    );
});

export default Link;
