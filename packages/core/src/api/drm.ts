// DRM 라이선스 토큰 발급 클라이언트.
// 백엔드 /authapi/drm/license (web 프록시 /api/drm/license).
//
// 서버가 가격·시청권·보안 레벨을 판단하고 DoveRunner 라이선스 토큰을 발급한다. 토큰 hash 는
// drm_type 에 바인딩되므로, 반드시 실제로 재생에 쓸 DRM 종류로 요청해야 한다.
//
// 전송은 configure()로 주입한 authFetch 를 쓴다.
//   - web/mobile : Next 프록시가 세션 JWT 를 body.user 로 붙이고 deviceType 을 "web" 으로 고정한다.
//   - tv         : CMS 에 Bearer 로 직접 보내므로 deviceType 을 함께 보낸다(보안 레벨 결정).
// 그래서 body 는 프록시와 CMS 가 모두 읽는 videoId 를 쓴다(CMS 는 video·videoId 둘 다 받는다).

import { authFetch } from "../config";

const LICENSE_ENDPOINT = "/api/drm/license";

/** 라이선스를 요청할 DRM 시스템. CMS 는 정확히 이 표기만 인식한다(다르면 Widevine 으로 발급). */
export type DrmSystem = "Widevine" | "PlayReady" | "FairPlay";

/** 보안 레벨을 결정하는 기기 구분. web·app=SW, tv=HW. web 프록시 경유 시에는 무시된다. */
export type DrmDeviceType = "web" | "app" | "tv";

/** 라이선스 서버 요청 1건에 필요한 값. */
export interface DrmLicense {
    /** DoveRunner 라이선스 토큰. */
    token: string;
    /** 라이선스 서버 URL. */
    licenseUrl: string;
    /** 토큰을 실어 보낼 요청 헤더 이름(pallycon-customdata-v2). 하드코딩하지 않고 이 값을 쓴다. */
    header: string;
    /** 실제로 발급된 토큰의 DRM 종류. 요청과 다르면(표기 오류 등으로 서버가 Widevine 으로 바꿔 발급) 재생이 실패한다. */
    drmType: DrmSystem;
}

/** 라이선스 발급 결과. 실패 시 message 는 사용자에게 그대로 보여 줄 수 있는 문구다. */
export type DrmLicenseResult =
    | { ok: true; license: DrmLicense }
    | {
          ok: false;
          message: string;
          /** 유료 콘텐츠인데 시청권이 없음(대여·결제 유도). */
          needUnlock?: boolean;
          /** 회원 레벨이 DRM 재생 최소 레벨보다 낮음. */
          needPermission?: boolean;
      };

// 서버가 사유를 주지 않은 실패(네트워크 오류, JSON 이 아닌 응답 등)에 보여 줄 문구.
// "재생할 수 없는 콘텐츠" 는 서버가 판단한 사유(시청권 없음 등)와 헷갈리므로 쓰지 않는다.
const UNKNOWN_FAILURE = "영상을 재생할 수 없습니다.";

/** 영상 _id 로 DRM 라이선스 토큰을 발급받는다. 네트워크 오류도 실패 결과로 돌려준다(throw 하지 않음). */
export async function requestDrmLicense(
    videoId: string,
    drmType: DrmSystem,
    opts: { deviceType?: DrmDeviceType } = {},
): Promise<DrmLicenseResult> {
    if (!videoId) return { ok: false, message: "영상 정보가 필요합니다." };
    try {
        const res = await authFetch(LICENSE_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoId, drmType, deviceType: opts.deviceType }),
        });
        const data = await res.json().catch(() => null);
        if (!data) return { ok: false, message: UNKNOWN_FAILURE };
        if (!data.result) {
            return {
                ok: false,
                message: data.message || "재생할 수 없는 콘텐츠입니다.",
                needUnlock: data.need_unlock === true,
                needPermission: data.need_permission === true,
            };
        }
        return {
            ok: true,
            license: {
                token: data.token,
                licenseUrl: data.license_url,
                header: data.header,
                drmType: data.drm_type,
            },
        };
    } catch {
        return { ok: false, message: UNKNOWN_FAILURE };
    }
}
