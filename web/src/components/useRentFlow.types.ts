// 대여 흐름 훅(useRentFlow)의 공용 계약.
export interface RentTarget {
    /** 대여(차감) 대상 영상 _id */
    videoId: string;
    /** 필요 팝콘(표시용 — 실제 차감은 서버 기준) */
    cost: number;
    /** 콘텐츠 제목 */
    title: string;
    season?: number;
    episode?: number;
    /** 시청 권한 확보(차감/이미보유) 후 실행 — 재생/이동 */
    onUnlocked: () => void;
}
