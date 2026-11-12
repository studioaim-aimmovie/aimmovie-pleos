import { useFavorite } from "@/components/useLike";

// 카드(list4/Slide1/Slide2)용 즐겨찾기 버튼. 카드 링크 이동을 막고 즐겨찾기만 토글한다.
export default function FavoriteButton({
    contentId,
    className = "btn_type3 favorites",
}: {
    contentId?: string;
    className?: string;
}) {
    const { favorited, toggle } = useFavorite(contentId);
    return (
        <button
            type="button"
            tabIndex={-1}
            aria-pressed={favorited}
            className={`${className}${favorited ? " on" : ""}`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle();
            }}
        >
            favorites
        </button>
    );
}
