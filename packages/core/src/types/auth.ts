// /authapi/user/* 응답 타입 (회원/인증).
// auth.ts 및 app/(view)/{join,findid,findpass}/**/route.ts 프록시가 참조한다.
//
// 실제 서버 응답(http://192.168.0.87:8066/authapi/user/*)을 관찰해 정의했다.
// 대부분 { result, message } 형태이며, 로그인/아이디찾기만 추가 데이터를 돌려준다.

import type { ApiMessageResponse } from "./api";

// ─────────────────────────────────────────────────────────────
// 로그인 — POST /authapi/user/login
// ─────────────────────────────────────────────────────────────

export interface LoginRequest {
    id: string;
    password: string;
}

/** 로그인 성공 시 내려오는 사용자 정보. (auth.ts authorize가 사용) */
export interface AuthUser {
    id: string;
    name: string;
    _id: string;
    /** 가입 레벨. 0=이메일 미인증, 1=인증완료, -1=탈퇴(WITHDRAWN). */
    level?: number | string;
    /** 국가/휴대폰(SNS 가입 시 없을 수 있음). phone 빈값이면 최초 로그인 후 팝업으로 입력받는다. */
    country_code?: string;
    country_dial?: string;
    phone?: string;
}

/**
 * 로그인 응답.
 *  - 성공: { result: true, user }
 *  - 실패: { result: false, message } (예: "존재하지 않는 사용자입니다.")
 */
export interface LoginResponse extends ApiMessageResponse {
    user?: AuthUser;
}

// ─────────────────────────────────────────────────────────────
// 아이디 중복 확인 — POST /authapi/user/checkId
// result: true = 사용 가능(계정 없음), false = 이미 사용 중
// ─────────────────────────────────────────────────────────────

export interface CheckIdRequest {
    id: string;
}

export type CheckIdResponse = ApiMessageResponse;

// ─────────────────────────────────────────────────────────────
// 회원가입 — POST /authapi/user/join
// ─────────────────────────────────────────────────────────────

export interface JoinRequest {
    name: string;
    phone: string;
    id: string;
    password: string;
    /** 국가코드/국가번호(휴대폰 인증 1단계에서 수집). */
    country_code?: string;
    country_dial?: string;
    /** 서버 휴대폰 인증 증빙 토큰(있을 때만 백엔드가 검증, 추후 필수 전환). */
    phone_verify_token?: string;
    /** 가입 레벨. 클라이언트는 "0"으로 고정 전송한다. */
    level: string;
    agree_service: boolean;
    agree_privacy: boolean;
    agree_marketing: boolean;
    agree_information_provision: boolean;
}

export type JoinResponse = ApiMessageResponse;

// ─────────────────────────────────────────────────────────────
// 아이디 찾기 — POST /authapi/user/findid
//  - 성공: { result: true, user: { id } }
//  - 실패: { result: false, message } (예: "계정 없음")
// ─────────────────────────────────────────────────────────────

export interface FindIdRequest {
    name: string;
    phone: string;
}

export interface FindIdResponse extends ApiMessageResponse {
    user?: {
        id: string;
    };
}

// ─────────────────────────────────────────────────────────────
// 비밀번호 찾기 - 코드 발송 — POST /authapi/user/findpass
// ─────────────────────────────────────────────────────────────

export interface FindPassRequest {
    id: string;
}

export type FindPassResponse = ApiMessageResponse;

// ─────────────────────────────────────────────────────────────
// 비밀번호 찾기 - 코드 검증 — POST /authapi/user/findpass/verify
// ─────────────────────────────────────────────────────────────

export interface FindPassVerifyRequest {
    id: string;
    code: string;
}

// 코드 검증 성공 시 비밀번호 재설정용 임시 토큰(JWT, 10분)을 함께 반환.
export interface FindPassVerifyResponse extends ApiMessageResponse {
    reset_token?: string;
}

// ─────────────────────────────────────────────────────────────
// 비밀번호 변경 — POST /authapi/user/userpasschange
// ─────────────────────────────────────────────────────────────

// 사용자 식별은 서버가 토큰/JWT로 처리(body.id 미사용).
// - 로그인(마이페이지) 변경: JWT 인증 + { new_password }
// - 비로그인 리셋 플로우: { reset_token, new_password } (verify 응답의 reset_token)
export interface PassChangeRequest {
    new_password: string;
    reset_token?: string;
}

export type PassChangeResponse = ApiMessageResponse;
