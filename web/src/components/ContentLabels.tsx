// 카드 포스터(.bg_area) 위 라벨 오버레이.
//
// position 값(DB 문자열)은 미리 정해 둔 클래스로 매핑한다. 스타일은 index.scss 의 `.content_label`.

import { cn } from "@/lib/cn";
import type { CardLabel } from "@aim/core/domain/contents";

const LABEL_POSITION_CLASS: Record<string, string> = {
    "top-left": "pos_tl",
    "top-center": "pos_tc",
    "top-right": "pos_tr",
    "bottom-left": "pos_bl",
    "bottom-center": "pos_bc",
    "bottom-right": "pos_br",
};

/** 알 수 없는 값은 기본값(top-left)으로 폴백한다. */
function labelPositionClass(position: string): string {
    return LABEL_POSITION_CLASS[position] ?? LABEL_POSITION_CLASS["top-left"];
}

export default function ContentLabels({ labels }: { labels?: CardLabel[] }) {
    if (!labels?.length) return null;
    return (
        <>
            {labels.map((l, i) => (
                <span key={i} className={cn("content_label", labelPositionClass(l.position))}>
                    <img src={l.image} alt="" />
                </span>
            ))}
        </>
    );
}
