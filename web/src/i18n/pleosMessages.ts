// 차량 전용 문구 덮어쓰기.
//
// `@aim/core/i18n` 사전의 페어링·충전 안내 문구는 "이 TV가", "리모컨으로" 처럼 기기를 TV 로
// 못박아 두었다. 차량에서 다른 문장이 필요한 키를 여기서 덮어쓴다(키는 core 의 것을 그대로 쓴다).

import type { MessageKey } from "@aim/core/i18n";
import type { Lang } from "@aim/core/i18n/locale";

type Overrides = Partial<Record<MessageKey, string>>;

const ko: Overrides = {
    "tv.pairing_lead":
        "차량 화면에서 계정을 입력할 필요가 없습니다. 휴대폰이나 PC에서 승인하면 이 차량에 바로 로그인됩니다.",
    "tv.pairing_code_note": "승인하면 이 차량이 자동으로 로그인됩니다.",
    // 승인 화면(/tv)에 "무엇을 로그인시키는지"로 표시된다.
    "tv.device_generic": "AIMMOVIE 차량 앱",
    "popcorn.tv_unavailable":
        "차량에서는 팝콘을 충전할 수 없습니다. aimmovie.com 또는 AIMMOVIE 모바일 앱에서 충전해 주세요.",
};

const en: Overrides = {
    "tv.pairing_lead":
        "No need to type your account on the car screen. Approve on your phone or PC and this car signs in right away.",
    "tv.pairing_code_note": "Once approved, this car signs in automatically.",
    "tv.device_generic": "AIMMOVIE Car",
    "popcorn.tv_unavailable":
        "Popcorn can't be purchased in the car. Please top up at aimmovie.com or in the AIMMOVIE mobile app.",
};

const overrides: Record<Lang, Overrides> = { ko, en };

/** 덮어쓴 문구가 있으면 그것을, 없으면 undefined(→ core 사전으로 간다). */
export function pleosMessage(lang: Lang, key: MessageKey): string | undefined {
    return overrides[lang]?.[key];
}

// ── core 에 대응 키가 없는 차량 전용 문구 ──
// core 의 MessageKey 로는 표현할 수 없어 따로 둔다.
const pleosOnly = {
    ko: {
        rent_insufficient:
            "팝콘이 부족합니다. 충전은 aimmovie.com 또는 모바일 앱에서 가능합니다.",
        rent_unavailable:
            "차량에서는 콘텐츠를 대여할 수 없습니다. aimmovie.com 또는 모바일 앱에서 대여하면 차량에서도 바로 볼 수 있습니다.",
    },
    en: {
        rent_insufficient:
            "You don't have enough Popcorn. You can top up at aimmovie.com or in the mobile app.",
        rent_unavailable:
            "Rentals aren't available in the car. Rent on aimmovie.com or in the mobile app and watch it here right away.",
    },
} as const;

export type PleosOnlyKey = keyof (typeof pleosOnly)["ko"];

export function pleosText(lang: Lang, key: PleosOnlyKey): string {
    return pleosOnly[lang]?.[key] ?? pleosOnly.ko[key];
}
