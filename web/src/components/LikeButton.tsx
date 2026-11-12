import { useLike } from "@/components/useLike";

// 카드(list4/Slide1/Slide2)용 좋아요 버튼. 카드 링크 이동을 막고 좋아요만 토글한다.
export default function LikeButton({
    contentId,
    className = "btn_type3 like",
}: {
    contentId?: string;
    className?: string;
}) {
    const { liked, toggle } = useLike(contentId);
    return (
        <button
            type="button"
            tabIndex={-1}
            aria-pressed={liked}
            className={`${className}${liked ? " on" : ""}`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle();
            }}
        >
            like
        </button>
    );
}
