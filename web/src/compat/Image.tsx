// next/image 대체.
//
// Next 이미지 최적화기(리사이즈·포맷 변환·소스셋)는 서버가 필요하다. 패키지 앱에는
// 서버가 없으므로 그냥 <img> 로 렌더한다.
//
// 창 크기가 구역마다 바뀌지만 소스셋 대신 CMS 축소본을 쓴다. 원본이 크면
// 디코딩 비용이 그대로 오므로, 크기를 줄이는 일은 CMS 가 맡는다. `@aim/core` 의
// `imageUrl(path, fallback, size)` 가 `/uploadimg/resize/{w640,w1920}/` 경로를 만들고,
// CMS 는 리사이즈본이 없으면 요청 시점에 원본에서 만들어 내려준다.
//
// ⚠️ 기본 로딩은 lazy 다. 리사이즈본이 생긴 뒤에도 이 기본값을 유지한다. 화면 밖 카드까지
// eager 로 한꺼번에 요청하면 지금 보여야 할 첫 줄 썸네일이 그 뒤에 줄을 서기 때문이다.
// 지금 화면에 반드시 있어야 하는 이미지(KV, 상세 히어로)에만 `priority` 를 붙인다.
//
// (배경) 예전에는 CMS 가 리사이즈본 없이 /uploadimg/origin 원본만 내려줬다. 포스터 한 장이
// 평균 2.9MB, 최대 15.9MB(4K)였고 4K 한 장의 디코딩 비트맵이 약 31MB 라, AndroidTV 의
// 좁은 힙에서는 화면 밖 이미지가 곧바로 폐기되고 다시 들어올 때 재요청·재디코딩이 일어났다.

import type { CSSProperties, ImgHTMLAttributes } from "react";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    /** next/image 의 fill — 부모를 채운다. position:absolute + inset:0 으로 대응한다. */
    fill?: boolean;
    /** 아래 셋은 최적화기 전용이라 무시한다. */
    priority?: boolean;
    quality?: number;
    sizes?: string;
    unoptimized?: boolean;
    style?: CSSProperties;
}

export default function Image({
    src,
    alt,
    width,
    height,
    fill,
    priority,
    quality: _quality,
    sizes: _sizes,
    unoptimized: _unoptimized,
    style,
    loading,
    decoding,
    ...rest
}: Props) {
    const fillStyle: CSSProperties | undefined = fill
        ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
        : undefined;

    return (
        // rest 를 먼저 펼친다. 뒤에 두면 호출부가 loading 을 직접 넘겼을 때 아래의
        // priority 처리를 덮어써 버린다.
        <img
            {...rest}
            src={src}
            alt={alt}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            // priority 는 next/image 에서 preload 힌트였다. 여기서는 "즉시 로딩" 으로 옮긴다.
            // 그 외에는 lazy 가 기본이며, 호출부가 loading 을 직접 준 경우에만 그 값을 따른다.
            loading={priority ? "eager" : (loading ?? "lazy")}
            decoding={decoding ?? "async"}
            style={fillStyle ? { ...fillStyle, ...style } : style}
        />
    );
}
