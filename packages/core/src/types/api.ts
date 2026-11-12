// CMS(API) 응답 공통 봉투(envelope) 타입.
// 모든 응답은 성공 여부 `result`를 가지며, 크게 두 형태로 나뉜다.
//  - 데이터 조회형: { result, data }        → ApiResponse<T>
//  - 처리 결과형(회원/인증): { result, message } → ApiMessageResponse
// 실제 서버 응답(http://192.168.0.87:8066)을 관찰해 정의했다.

/** 데이터를 `data`로 감싸 돌려주는 조회형 응답. (예: /api/main/list, /api/contents/show) */
export interface ApiResponse<T> {
    result: boolean;
    data: T;
}

/**
 * 처리 결과만 돌려주는 응답. (예: /authapi/user/* 대부분)
 * `result`로 성공/실패를 구분하고, `message`에 사용자 노출 문구가 담긴다.
 */
export interface ApiMessageResponse {
    result: boolean;
    /** 실패 사유 또는 안내 문구. 성공 응답에서는 없을 수 있다. */
    message?: string;
}
