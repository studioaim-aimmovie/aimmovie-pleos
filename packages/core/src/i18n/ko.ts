// 정적 UI 문자열 한국어 사전 (i18n 밑작업 골격).
// - 키 규칙: "영역.항목" dot 표기 (예: common.login, footer.terms, login.google).
// - ko를 소스 오브 트루스로 삼아, en(en.ts)이 동일 키를 갖도록 MessageKey 타입으로 강제한다.
// - 여기 있는 항목은 시드(예시)이며, 실제 마이그레이션 때 화면 문자열을 이 사전으로 옮기며 확장한다.
const ko = {
  // 공통 버튼/라벨
  "common.confirm": "확인",
  "common.cancel": "취소",
  "common.delete": "삭제",
  "common.login": "로그인",
  "common.logout": "로그아웃",
  "common.myPage": "마이페이지",
  "common.play_btn": "바로보기",
  "common.info_btn": "상세정보",
  "common.login_message": "로그인 후 이용가능합니다.",
  "common.search": "검색하기",
  "common.delete_message": "이 콘텐츠를 시청기록에서 삭제할까요?",
  // 앱 종료 확인 — apps/tv 의 홈에서 리모컨 Back.
  "common.exit": "종료",
  "common.exit_message": "앱을 종료하시겠습니까?",
  "common.set_new_password": "새 비밀번호 설정",
  "common.change_password_btn": "비밀번호 변경하기",
  "common.find_email": "이메일 아이디 찾기",
  "common.find_email_btn": "아이디 찾기",
  "common.find_email_complete": "아이디 찾기 완료",
  "common.find_email_result": "고객님의 아이디가 다음과 같습니다.",
  "common.network_error": "네트워크 연결을 확인해주세요.",
  "common.close": "닫기",
  "common.loading": "불러오는 중입니다…",
  "common.retry": "다시 시도",
  "common.view": "보기",
  "common.popcorn_count": "{count}개",
  "common.popcorn_free": "팝콘Free",
  "common.purchased": "구매",
  "common.remaining": "{time} 남음",

  // 검색 결과
  "search.results": "검색결과",
  "search.no_result": "입력하신 검색어와 일치하는 결과가 없습니다.",
  "search.tip1": "다른 키워드를 입력해 보세요.",
  "search.tip2": "영화 제목, 시리즈 제목으로 검색해 보세요.",
  "search.tip3":
    "액션, 스릴러, 코미디, 로맨스 또는 드라마와 같은 장르명으로 검색해 보세요.",

  // 푸터
  "footer.nav": "탐색",
  "footer.policy": "정책",
  "footer.support": "고객 지원",
  "footer.terms": "이용약관",
  "footer.privacy": "개인정보 처리방침",
  "footer.creator": "크리에이터 지원",
  "footer.company": "회사 정보",
  "footer.language": "언어",
  // 사업자정보 (푸터 하단 — Footer.tsx). 라벨+값 한 줄 단위. 숫자류(사업자등록번호·전화·이메일)는 언어 공통.
  "footer.biz.company": "상호 : 주식회사 스튜디오 에임",
  "footer.biz.ceo": "대표자 : 이무신",
  "footer.biz.address":
    "본점 소재지 : 경기도 부천시 원미구 부천로198번길 18, 202동 1402호(춘의동, 춘의테크노파크 2차)",
  "footer.biz.bizno": "사업자등록번호 : 602-86-03127",
  "footer.biz.mailorder": "통신판매업 신고번호 : 제 2026-부천원미-1442호",
  "footer.biz.tel": "전화 : +82-70-7636-1117",
  "footer.biz.email": "이메일(문의·고객센터 통합) : aim@aimworks.co.kr",
  "footer.copyright": "Copyright@2026 AIMMOVIE. All rights reserved.",

  // 웰컴(랜딩) — 히어로
  "welcome.hero_unit": "분.",
  "welcome.hero_title": "딱 좋은 이야기의 길이",
  "welcome.hero_sub1": "짧은 영상은 아쉽고, 긴 정주행은 부담스러운 순간.",
  "welcome.hero_sub2": "30분이면 새로운 이야기에 빠져들고, 한 편을 온전히 즐길 수 있어요.",
  "welcome.hero_sub3": "지금 모든 작품을 무료로 시청할 수 있어요.",
  "welcome.hero_cta": "지금 무료로 시작하기  →",
  "welcome.hero_cta_tag": "숏폼보다 깊게, 시리즈보다 가볍게",
  // 웰컴 — 키워드 섹션
  "welcome.kw_label": "FIND YOUR STORY",
  "welcome.kw_title1": "지금 끌리는 키워드로",
  "welcome.kw_title2": "이야기를 골라보세요.",
  "welcome.kw_sub": "장르부터 분위기까지, 오늘의 취향에 맞는 한 편.",
  // 웰컴 — WHY 30 MINUTES (섹션3)
  "welcome.why_label": "WHY 30 MINUTES",
  "welcome.why_title1": "뭘 볼지 고민하는 시간보다",
  "welcome.why_title2": "더 빠르게 빠져드는 에임무비",
  "welcome.why_sub1": "출퇴근길 30분, 밥친구로 30분, 잠들기 전 30분",
  "welcome.why_sub2": "당신의 빈 시간을 기억에 남는 한 편으로.",
  // 웰컴 — 작품(섹션4)
  "welcome.work_title1": "오늘,",
  "welcome.work_title2": "어떤 이야기에 빠져볼까요?",
  "welcome.work_sub1":
    "글로벌 20개국, 100명 이상의 감독들이 전하는 다채로운 시선",
  "welcome.work_sub2": "30분이면 새로운 세계를 만날 수 있으니까.",
  "welcome.work_play": "지금 시청하기",
  "welcome.signup_continue_cta": "회원가입하고 이어서보기",
  "welcome.signup_continue_title": "다음 이야기가\n너무 궁금해!",
  "welcome.signup_continue_msg":
    "지금 바로 에임무비에 가입하고\n이어지는 다음 화를 바로 감상해 보세요!",
  // 웰컴 — MADE DIFFERENT(섹션5)
  "welcome.feat_label": "MADE DIFFERENT",
  "welcome.feat_title1": "가벼운 소비와",
  "welcome.feat_title2": "긴 몰입 사이",
  "welcome.feat.safe_title": "안심하고 보는 콘텐츠",
  "welcome.feat.safe_title2": "",
  "welcome.feat.safe_body1": "유해성 여부와 저작권 기준을",
  "welcome.feat.safe_body2": "꼼꼼하게 확인하고 검증 과정을",
  "welcome.feat.safe_body3": "통과한 작품만 소개합니다.",
  "welcome.feat.genre_title": "취향을 채우는 장르",
  "welcome.feat.genre_title2": "",
  "welcome.feat.genre_body1": "SF부터 스릴러, 판타지, 로맨스까지.",
  "welcome.feat.genre_body2": "오늘의 기분과 취향에 맞는",
  "welcome.feat.genre_body3": "이야기를 골라보세요.",
  "welcome.feat.make_title": "내가 만드는 이야기",
  "welcome.feat.make_title2": "",
  "welcome.feat.make_body1": "다음 전개를 직접 선택하고",
  "welcome.feat.make_body2": "투표하여 작품의 세계가",
  "welcome.feat.make_body3": "계속 이어지는 경험을 만나보세요.",
  // 웰컴 — 최종 CTA(섹션6). 버튼 문구는 welcome.hero_cta 재사용.
  "welcome.final_title1": "30분이면 충분해요.",
  "welcome.final_title2": "지금, 골라보세요.",
  "welcome.final_sub1": "긴 고민은 필요 없어요.  지금 끌리는 첫 작품을 골라보세요.",
  "welcome.final_sub2": "지금 모든 작품을 무료로 시청할 수 있어요.",
  "welcome.final_cta": "작품 둘러보기 →",

  // 로그인
  "login.title": "로그인",
  "login.google": "Google로 시작하기",
  "login.apple": "Apple로 시작하기",
  "login.or": "또는",
  "login.email_join": "이메일로 가입하기",
  "login.email_login": "이메일로 로그인",
  "login.save_id": "아이디 저장",
  "login.find_password": "비밀번호 찾기",
  "login.email_placeholder": "이메일을 입력해주세요.",
  "login.password": "비밀번호",
  "login.password_placeholder": "비밀번호를 입력해주세요.",
  "login.withdrawn":
    "탈퇴한 계정입니다. 복구를 원하시면 고객센터로 문의해 주세요.",
  "login.withdrawn_requested":
    "탈퇴 신청된 계정입니다. 복구를 원하시면 고객센터로 문의해 주세요.",
  "login.invalid_credentials": "아이디 또는 비밀번호가 일치하지 않습니다.",
  "login.email_unverified":
    "이메일 인증 후 이용 가능합니다. 가입 시 받으신 이메일에서 인증을 완료해 주세요.",
  "login.resend_done": "가입 대기 상태라면 인증 메일을 보냈습니다. 메일함을 확인해 주세요.",
  "login.resend_rate_limited": "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  "login.server_error": "서버 연결에 실패했습니다. 관리자에게 문의하세요.",
  "login.invalid_info": "로그인 정보가 올바르지 않습니다.",
  "login.social_failed":
    "소셜 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.",

  //아이디 찾기
  "findid.name_placeholder": "한글로 공백없이 입력해주세요.",
  "findid.phone_placeholder": "-없이 숫자만 입력해주세요.",
  "findid.fail": "아이디 찾기 실패",
  "findid.error": "아이디 찾기 중 오류 발생",

  //비밀번호 찾기
  "findpass.desc1": "가입시 등록한 이메일 아이디를 입력해 주세요.",
  "findpass.desc2": "이메일로 임시 로그인 코드를 발송해 드립니다.",
  "findpass.send_code": "코드 발송",
  "findpass.code_placeholder": "코드를 입력해주세요.",
  "findpass.reset_btn": "비밀번호 재설정하기",
  "findpass.email_empty": "이메일을 입력해주세요.",
  "findpass.code_sent": "입력하신 이메일로 임시 로그인 코드를 발송했습니다.",
  "findpass.send_fail": "코드 발송에 실패했습니다.",
  "findpass.send_error": "코드 발송 중 오류가 발생했습니다.",
  "findpass.code_empty": "인증 코드를 입력해주세요.",
  "findpass.code_invalid": "인증 코드가 일치하지 않습니다.",
  "findpass.verify_error": "인증 처리 중 오류가 발생했습니다.",

  //회원가입
  "join.title": "회원가입",
  "join.flag": "국가선택",
  "join.flag.south_korea": "대한민국",
  "join.phone": "휴대폰번호",
  "join.phone.placeholder": "‘-’없이 숫자만 입력하세요",
  "join.authcode": "인증코드",
  "join.authcode.placeholder": "인증코드 6자리를 입력하세요",
  "join.authcode.btn": "인증코드 받기",
  "join.next.btn": "다음 단계",
  "join.name": "이름",
  "join.name.placeholder": "이름을 입력해주세요.",
  "join.email": "이메일 아이디",
  "join.email.duplicate": "중복확인",
  "join.password": "비밀번호",
  "join.password.message": "8~20자 영문, 숫자, 특수문자를 모두 포함",
  "join.password.placeholder": "비밀번호를 입력해주세요.",
  "join.password_confirm": "비밀번호 확인",
  "join.password_confirm.placeholder": "비밀번호를 다시 입력해주세요.",
  "join.agree_message": "모두 확인하였으며 동의합니다.",
  "join.agree_terms": "서비스 이용약관",
  "join.agree_privacy": "개인정보 수집 및 이용 동의",
  "join.agree_marketing": "마케팅 정보 수신동의",
  "join.agree_information_provision": "제 3자 정보 제공 동의",
  "join.required": "필수",
  "join.optional": "선택",
  "join.complete_message":
    "회원가입이 완료되었습니다. 발송된 이메일에서 24시간 이내에 인증을 완료해 주세요.",
  "join.complete_login_btn": "로그인하기",
  "join.email_placeholder": "이메일을 입력해주세요.",
  "join.password_mismatch": "비밀번호를 다시 확인해주세요.",
  "join.email_empty": "이메일 아이디를 입력해주세요.",
  "join.email_invalid": "올바른 이메일 형식을 입력해주세요.",
  "join.email_available": "사용 가능한 아이디입니다.",
  "join.email_duplicate": "이미 사용중인 아이디입니다.",
  "join.email_check_error": "아이디 확인 중 오류 발생",
  "join.submit_btn": "회원가입하기",
  "join.submit_error": "회원가입 실패. 다시 시도해 주세요.",
  "join.network_error": "회원가입 중 오류 발생",
  "join.phone_empty": "휴대폰 번호를 입력해주세요.",
  "join.code_send_fail": "인증번호 발송에 실패했습니다.",
  "join.code_first": "인증번호를 먼저 받아주세요.",
  "join.code_six": "인증번호 6자리를 입력해주세요.",
  "join.code_invalid": "인증번호가 일치하지 않거나 만료되었습니다.",
  "join.code_resend": "인증번호 재발송",
  "join.code_resend_cooldown": "재발송 ({sec})",
  "join.verifying": "인증 확인 중…",

  //view
  "view.By": "제작사",
  "view.episode": "회차",
  "view.episode_no": "에피소드",
  "view.season": "시즌",
  "view.limited_series": "리미티드 시리즈",

  //재생(플레이어) — apps/tv 의 /play 화면. web 은 video.js 기본 문자열을 썼다.
  "player.play": "재생",
  "player.pause": "일시정지",
  "player.rewind": "{sec}초 뒤로",
  "player.forward": "{sec}초 앞으로",
  "player.back": "나가기",
  "player.buffering": "불러오는 중…",
  "player.error": "영상을 재생할 수 없습니다.",
  "player.no_source": "재생할 수 있는 영상이 없습니다.",
  "player.load_failed": "영상 정보를 불러오지 못했습니다.",
  "player.episode_label": "시즌 {season} · {episode}회차",
  "player.drm_unsupported": "이 기기에서는 보호된 영상을 재생할 수 없습니다.",
  "player.drm_device_unsupported": "이 TV 또는 연결된 화면이 보호된 영상 재생 조건(Widevine 하드웨어 보안·HDCP)을 지원하지 않습니다.",
  "player.drm_failed": "재생 권한을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",

  //mypage
  "mypage.title": "마이페이지",
  "mypage.myinfo": "나의 정보",
  "mypage.mywatched": "나의 시청기록",
  "mypage.mywatched.empty": "시청기록이 없습니다.",
  "mypage.myfavorites": "찜한 콘텐츠",
  "mypage.myfavorites.empty": "찜한 콘텐츠가 없습니다.",
  "mypage.myaccount": "계정정보",
  "mypage.changepassword": "비밀번호 변경하기",
  "mypage.withdraw": "회원 탈퇴하기",
  "mypage.withdraw.confirm": "AIMMOVIE를 탈퇴할까요?",
  "mypage.withdraw.agree": "위 내용을 이해했습니다.",
  "mypage.withdraw.desc":
    "AIMMOVIE를 탈퇴한다면 이용자님의 AIMMOVIE 관련 데이터는 모두 영구적으로 삭제되며, AIMMOVIE 계정 데이터는 복구되지 않습니다.",
  "mypage.withdraw.submit": "탈퇴하기",
  "mypage.withdraw.fail":
    "탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  "mypage.withdraw.done_title": "회원 탈퇴가 완료되었습니다.",
  "mypage.withdraw.done_desc": "그동안 AIMMOVIE를 이용해 주셔서 감사합니다.",
  "mypage.myPopcorn": "내 팝콘",
  "mypage.popcornHistory": "나의 팝콘 내역",
  "mypage.charge": "충전하기",
  "mypage.subscriptionHistory": "내 구독내역",
  "mypage.purchaseOrRent": "개별구매",
  "mypage.browseCatalog": "콘텐츠 둘러보기",
  "mypage.logout_success": "로그아웃 되었습니다.",

  //팝콘 충전 안내 (TV)
  "popcorn.guide_title": "팝콘 충전 안내",
  "popcorn.guide_desc":
    "팝콘이란? AIMMOVIE 내에서 작품 감상을 위해 필요한 전용 결제수단입니다.",
  "popcorn.package_bonus": "+{percent}%",
  "popcorn.package_count": "{count}개",
  "popcorn.package_plus": "+{count}개",
  "popcorn.package_price": "{amount}원",
  "popcorn.first_benefit": "첫 팝콘충전 최초 혜택!",
  "popcorn.tv_unavailable":
    "TV에서는 아직 팝콘 충전을 하실 수 없습니다. aimmovie.com에 접속해 충전해주세요.",

  //비밀번호 변경 (TV)
  "pw.label": "비밀번호",
  "pw.rule": "*8~20자 영문, 숫자, 특수문자를 모두 포함",
  "pw.placeholder": "비밀번호를 입력해주세요.",
  "pw.retype_label": "비밀번호 재확인",
  "pw.retype_placeholder": "비밀번호를 다시 입력해주세요.",
  "pw.err_empty": "비밀번호를 입력해주세요.",
  "pw.err_rule":
    "비밀번호는 8~20자 영문, 숫자, 특수문자를 모두 포함해야 하며, 공백 없이 입력해야 합니다.",
  "pw.err_retype_empty": "비밀번호 확인을 입력해주세요.",
  "pw.err_mismatch": "비밀번호가 일치하지 않습니다.",
  "pw.done": "비밀번호가 변경되었습니다.",
  "pw.fail": "비밀번호 변경에 실패했습니다.",
  "pw.error": "비밀번호 변경 중 오류가 발생했습니다.",

  //휴대폰 인증
  "phone.verify_complete": "인증이 완료되었습니다.",
  "phone.save_failed": "저장에 실패했습니다. 다시 시도해주세요.",
  "phone.title": "휴대폰 인증",
  "phone.description": "서비스 이용을 위해 국가와 휴대폰 인증을 완료해주세요.",
  "phone.submit_button": "인증하고 시작하기",

  //시청기록
  "watch.delete_failed": "삭제에 실패했습니다. 다시 시도해주세요.",

  //메일 인증
  "mailauth.resend_success":
    "인증 메일을 다시 보냈습니다. 메일함을 확인해 주세요.",
  "mailauth.resend_failed":
    "재발송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  "mailauth.server_error":
    "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  "mailauth.invalid_access":
    "잘못된 접근입니다. 인증 링크를 다시 확인해 주세요.",
  "mailauth.verify_complete": "이메일 인증이 완료되었습니다.",
  "mailauth.verify_failed": "인증에 실패했거나 링크가 만료되었습니다.",
  "mailauth.failed_title": "이메일 인증에 실패했습니다.",
  "mailauth.link_validity": "인증 링크는 발급 후 24시간 동안 유효합니다.",
  "mailauth.resending": "재발송 중…",
  "mailauth.resend_button": "인증 메일 재발송",
  "mailauth.rejoin_button": "회원가입 다시하기",

  //고객지원 Contact 팝업
  "contact.desc":
    "원하시는 서비스와 관련된 해당 담당자에게 연락주시면 빠르게 처리해드리도록 하겠습니다.",
  "contact.col_field": "지원 분야",
  "contact.col_email": "연락처",
  "contact.tech": "기술 지원",
  "contact.creator": "크리에이터 등록",
  "contact.partnership": "서비스 협업요청",
  "contact.ad": "광고 문의",

  //정책 팝업 제목 (본문은 컴포넌트에서 useLang로 ko/en 분기)
  "policy.terms_title": "AIMMOVIE 이용약관",
  "policy.privacy_title": "AIMMOVIE 개인정보처리방침",

  //크리에이터 - 히어로 태그
  "creator.tag1": "# 최대 25% 수익 분배",
  "creator.tag2": "# 가입비 면제",
  "creator.tag3": "# BIFAN 공식 파트너",

  //크리에이터 - 히어로
  // 타이틀은 글자 애니메이션 + 인라인 마커: {hl}..{/hl}=강조, {brm}=모바일 전용 줄바꿈(공백+br_m).
  "creator.for_creators": "For Creators",
  "creator.title": "이제{brm}{hl}당신의{/hl}{brm}차례입니다.",
  "creator.desc1": "AIMMOVIE — 세계 최초의 AI 네이티브 미드폼 OTT 플랫폼.",
  "creator.desc2": "만들고, 올리고, 글로벌 관객을 만나고, 수익을 가져가세요.",
  "creator.apply_btn": "크리에이터 지원하기",

  //크리에이터 - FAQ
  "creator.faq_head": "FAQ",
  "creator.faq_q1": "비독점과 독점 입점 중 어느 쪽이 좋은가요?",
  "creator.faq_a1":
    "비독점은 타 플랫폼 동시 유통이 가능하고, 독점은 일정 기간 AIMMOVIE에서만 상영하는 대신 더 높은 수익 분배율과 프로모션 지원을 받으실 수 있습니다. 작품 성격과 전략에 따라 선택 가능하며, 입점 상담 단계에서 함께 결정합니다.",
  "creator.faq_q2": "해외 거주자도 가입 가능한가요?",
  "creator.faq_a2":
    "네, AIMMOVIE는 글로벌 플랫폼입니다. 해외 거주 크리에이터의 경우 국제 송금(SWIFT, PayPal, Wise 등) 및 거주지국 세무 처리를 지원합니다. 영문·중문 계약서와 영문 폼도 제공됩니다.",
  "creator.faq_q3": "정산은 어떻게, 얼마나 자주 이뤄지나요?",
  "creator.faq_a3":
    "분기별 정산(3·6·9·12월 말 기준)이 원칙입니다. 크리에이터 대시보드를 통해 실시간 수익 현황을 확인하실 수 있으며, 분기 종료 후 30일 내 정산금이 지급됩니다.",
  "creator.faq_q4": "작품 마스터 파일은 어떻게 보내나요?",
  "creator.faq_a4":
    "구글 드라이브 공유 폴더를 통해 aim@aimworks.co.kr로 전달해주시면 됩니다. ProRes 422 HQ 또는 MOV/MXF/MP4 고화질 마스터를 권장하며, 자세한 사양은 별도의 Master Delivery Specifications 문서에서 안내드립니다.",
  "creator.faq_q5": "기존 유튜브 영상도 입점 가능한가요?",
  "creator.faq_a5":
    "가능합니다. 비독점 입점은 유튜브 등 타 플랫폼 동시 공개를 허용합니다. 독점 입점을 원하시는 경우 일정 기간 동안 타 플랫폼에서 비공개 처리하시면 됩니다 (이 경우 더 높은 수익 분배율 적용).",
  "creator.faq_q6": "가입 후 언제까지 작품을 올려야 하나요?",
  "creator.faq_a6":
    "Founding Creator 사전 영입은 가입 후 2~4주 내 첫 작품 입점을 권장드립니다. 영화제 출품작이 영화제 기간 중인 경우 영화제 종료 후 입점도 가능합니다.",

  // 회사정보(About) - 히어로
  // 강조/줄바꿈은 인라인 마커: {hl}..{/hl}=색상 강조, {br}=줄바꿈, {brm}=모바일 전용 줄바꿈.
  "about.hero_title":
    "나와 호흡하는 {brm}{hl}새로운 이야기{/hl}를{br}지금, 만나세요.",
  "about.hero_desc1": "AI 크리에이터들이 빚어낸 새로운 세계, 바로 여기에.",
  "about.hero_desc2": "AIMMOVIE - 에임무비.",

  //회사정보(About) - 인트로 헤드라인
  "about.intro":
    "기존의 OTT들과는{br}전혀 다른 새로운 공간,{br}{hl}AIMMOVIE- 에임무비.{/hl}",

  //회사정보(About) - 특징 박스
  "about.box1_title": "나와 호흡하는 콘텐츠",
  "about.box1_body":
    "짧지도, 무겁지도 않은 새로운 시청 리듬,\n바쁜 당신만을 위한 미드폼 영상.\n출퇴근, 점심, 잠들기 전 -\n당신의 호흡에 맞춰 함께하는 영상.",
  "about.box2_title": "당신만의 다음 이야기",
  "about.box2_body":
    "지루하게 정해진 결말이 아닌,\n순간 순간 나의 선택이 다음 화를 정합니다",
  "about.box3_title": "본 적 없는 상상력",
  "about.box3_body":
    "AI가 인간의 상상력을 만나 만들어진\n새로운 비주얼·내러티브·세계관.\n타 OTT의 알고리즘이 추천하는 비슷한 영상이 아닌,\n이제껏 한 번도 본 적 없는 새로운 작품들을 만나보세요.",
  "about.box4_title": "세계의 새로운 목소리",
  "about.box4_body":
    "해외 각국의 AI 크리에이터들이 보여주는\n다양한 문화와 다채로운 시선.\nAIMMOVIE는 그들의 첫 글로벌 무대입니다.",

  //회사정보(About) - 스크롤 연출(scene)
  "about.scene1": "영상을{br}{hl}트는{/hl}{br}시대에서,",
  "about.scene2": "영상과{br}{hl}함께하는{/hl}{br}시대로",
  "about.cta":
    "지금, 에임무비에서{br}{hl}당신이 꿈꾸던 새로운 세계의{/hl}{br}{hl}첫 관객{/hl}이 되어주세요.",

  //TV 페어링 — TV 화면(코드 발급·표시). 2~3m 거리에서 읽는 문구라 짧게 끊는다.
  "tv.pairing_lead":
    "리모컨으로 계정을 입력할 필요가 없습니다. 휴대폰이나 PC에서 승인하면 이 TV에 바로 로그인됩니다.",
  "tv.pairing_issuing": "로그인 코드를 받는 중입니다…",
  "tv.pairing_step_visit": "휴대폰이나 PC에서 {hl}{url}{/hl} 에 접속하세요.",
  "tv.pairing_step_enter": "아래 코드를 입력하고 승인하세요.",
  "tv.pairing_code_note": "승인하면 이 TV가 자동으로 로그인됩니다.",
  "tv.pairing_waiting": "승인을 기다리고 있습니다",
  "tv.pairing_qr_title": "QR로 더 빠르게",
  "tv.pairing_qr_note": "휴대폰 카메라로 찍으면 코드 입력 없이 바로 열립니다.",
  "tv.pairing_expired": "코드가 만료되었습니다.",
  "tv.pairing_expired_note":
    "새 코드를 받아 휴대폰이나 PC에서 다시 승인해 주세요.",
  "tv.pairing_new_code": "새 코드 받기",
  "tv.pairing_err_parse":
    "서버 응답을 해석할 수 없습니다 (HTTP {status}). 서버 주소와 배포 상태를 확인해 주세요.",
  "tv.pairing_err_code":
    "로그인 코드를 받지 못했습니다. 잠시 후 다시 시도해 주세요.",
  "tv.pairing_err_network":
    "서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.",

  //TV 페어링 — 기기 이름. 승인 화면에서 "무엇을 로그인시키는지" 알아볼 수 있게 보낸다.
  "tv.device_tizen": "삼성 TV",
  "tv.device_webos": "LG TV",
  "tv.device_androidtv": "안드로이드 TV",
  "tv.device_generic": "TV",

  //TV 페어링 — 폰/PC 승인 화면(/tv)
  "tv.approve_input_title": "TV 화면의 코드를 입력해 주세요.",
  "tv.approve_input_desc":
    "TV 화면에 표시된 8자리 코드를 그대로 입력하면 됩니다.",
  "tv.approve_input_label": "TV 화면에 표시된 8자리 코드",
  "tv.approve_input_hint": "8자리를 모두 입력하면 다음 단계로 넘어갑니다.",
  "tv.approve_next": "다음",
  "tv.approve_confirm_title": "AIMMOVIE TV에 로그인하시겠습니까?",
  "tv.approve_warn":
    "본인이 TV 화면에서 직접 확인한 코드가 맞는지 다시 한 번 확인해 주세요. 다른 사람이 알려준 코드라면 승인하지 마세요.",
  "tv.approve_submit": "로그인 승인",
  "tv.approve_submitting": "승인 중…",
  "tv.approve_done_title": "로그인되었습니다.",
  "tv.approve_done_desc": "{device}에서 잠시 후 자동으로 화면이 전환됩니다.",
  "tv.approve_home": "홈으로 이동",
  "tv.approve_failed_title": "승인하지 못했습니다.",
  "tv.approve_err_invalid":
    "코드를 찾을 수 없습니다. TV 화면의 코드를 다시 확인해 주세요.",
  "tv.approve_err_expired":
    "코드가 만료되었습니다. TV에서 새 코드를 받아 주세요.",
  "tv.approve_err_already": "이미 승인된 코드입니다.",
  "tv.approve_err_rate": "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  "tv.approve_err_generic": "승인에 실패했습니다.",

  //대여/충전 팝업 (RentModal / ChargeModal)
  "common.price_won": "{won}원",
  "rent.title": "콘텐츠 대여하기",
  "rent.my_popcorn": "내 팝콘 : {count}개",
  "rent.season": " 시즌{season}",
  "rent.episode": " - 에피소드 {episode}화",
  "rent.confirm": "바로 보시겠습니까?",
  "rent.button": "팝콘 {cost}개로 바로보기",
  "rent.fail": "구매 처리에 실패했습니다. 다시 시도해주세요.",
  "charge.title": "팝콘 충전하기",
  "charge.insufficient": "팝콘이 부족해요",
  "charge.required": "필요 팝콘",
  "charge.my_popcorn": "내 팝콘",
  "charge.short": "부족 팝콘",
  "charge.packages": "팝콘 패키지",
  "charge.bonus": "+{count}개",
  "payment.web_only": "결제는 웹에서 이용해주세요.",
  "payment.login_required": "로그인이 필요합니다.",
  "payment.order_failed": "주문 생성에 실패했습니다.",
  "payment.verify_failed": "결제 검증에 실패했습니다. 고객센터로 문의해주세요.",
  "payment.pending": "입금 대기중입니다.",
  "payment.error": "결제 처리 중 오류가 발생했습니다.",
  "payment.cancelled": "결제가 취소되었습니다.",

  //팝콘 충전 페이지 (상단)
  "popcorn.page_title": "팝콘 충전 안내",
  "popcorn.desc1": "*팝콘이란? AIMMOVIE 내에서",
  "popcorn.desc2": " 작품 감상을 위해 필요한 전용 결제수단입니다.",
  "popcorn.charge_complete": "충전이 완료되었습니다.",
  "popcorn.premium_label": "첫 팝콘충전 최초 혜택!",
  "popcorn.cancel_notice": "결제 취소는 고객센터({email})로 문의해주세요.",
} as const;

/** 사전 키 타입. ko가 소스 오브 트루스 → en은 이 키 전체를 채워야 한다. */
export type MessageKey = keyof typeof ko;

export default ko;
