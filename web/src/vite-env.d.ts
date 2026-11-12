/// <reference types="vite/client" />

// @aim/core 에 주입할 값들. .env(.local) 로 지정한다.
interface ImportMetaEnv {
    /** CMS(API) 호스트. 예: https://cms.aimmovie.com (끝에 / 없이) */
    readonly VITE_API_ROOT: string;
    /** HLS/미디어 CDN 호스트. */
    readonly VITE_CDN_URL: string;
    /**
     * 팝콘 차감 대여를 차량에서 허용할지. "false" 면 대여 창 대신 웹·모바일에서 대여하라고 안내한다.
     * 지정하지 않으면 허용(기존 동작). Pleos 가 결제·포인트 정책을 확정하기 전(2027년 예정) 심사용 빌드에서 끈다.
     */
    readonly VITE_RENT_ENABLED?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
