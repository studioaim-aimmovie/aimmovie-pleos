// 팝콘 충전 상품 카탈로그 — 가격의 단일 진실원본(서버·클라 공용).
// 프론트 표시 + 서버 결제금액 검증(위변조 방지)에 함께 사용한다.
// (추후 CMS로 옮길 수 있으나, 지금은 서버가 소유해 금액검증의 기준으로 삼는다.)

export interface PopcornProduct {
    /** 상품 식별자(결제 요청/검증 키) */
    id: string;
    /** 결제 금액(원) */
    amount: number;
    /** 기본 지급 팝콘 */
    base: number;
    /** 보너스 팝콘 */
    bonus: number;
    /** 첫 충전 혜택 카드 여부(UI 강조) */
    premium?: boolean;
}

export const POPCORN_PRODUCTS: PopcornProduct[] = [
    { id: "pc_first_9900", amount: 9900, base: 100, bonus: 100, premium: true },
    { id: "pc_1000", amount: 1000, base: 10, bonus: 1 },
    { id: "pc_3000", amount: 3000, base: 30, bonus: 3 },
    { id: "pc_5000", amount: 5000, base: 50, bonus: 5 },
    { id: "pc_10000", amount: 10000, base: 100, bonus: 10 },
    { id: "pc_20000", amount: 20000, base: 200, bonus: 20 },
    { id: "pc_30000", amount: 30000, base: 300, bonus: 30 },
    { id: "pc_50000", amount: 50000, base: 500, bonus: 50 },
    { id: "pc_100000", amount: 100000, base: 1000, bonus: 100 },
];

/** 상품 id로 조회. 없으면 undefined. */
export function getPopcornProduct(id?: string): PopcornProduct | undefined {
    return POPCORN_PRODUCTS.find((p) => p.id === id);
}

/** 총 지급 팝콘(기본+보너스). */
export function totalPopcorn(p: PopcornProduct): number {
    return p.base + p.bonus;
}

/** 결제창에 표시할 주문명. */
export function popcornOrderName(p: PopcornProduct): string {
    return `팝콘 ${totalPopcorn(p)}개`;
}

/** 보너스 비율(%) — UI 배지용. */
export function bonusPercent(p: PopcornProduct): number {
    return p.base > 0 ? Math.round((p.bonus / p.base) * 100) : 0;
}
