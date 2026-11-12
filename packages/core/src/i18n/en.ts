// 정적 UI 문자열 영어 사전.
// Record<MessageKey, string>로 타입을 걸어 ko의 모든 키를 반드시 채우도록 강제한다(누락 시 컴파일 에러).
import type { MessageKey } from "./ko";

const en: Record<MessageKey, string> = {
  // 공통 버튼/라벨
  "common.confirm": "Confirm",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.login": "Login",
  "common.logout": "Log out",
  "common.myPage": "My Page",
  "common.play_btn": "PLAY",
  "common.info_btn": "Info",
  "common.login_message": "Please log in to access this feature.",
  "common.search": "Search",
  "common.delete_message":
    "Are you sure you want to delete this content from your viewing history?",
  // 앱 종료 확인 — apps/tv 의 홈에서 리모컨 Back.
  "common.exit": "Exit",
  "common.exit_message": "Do you want to exit the app?",
  "common.set_new_password": "Set New Password",
  "common.change_password_btn": "Change Password",
  "common.find_email": "Find Email ID",
  "common.find_email_btn": "Find ID",
  "common.find_email_complete": "Email ID Find Complete",
  "common.find_email_result": "Your email ID is as follows:",
  "common.network_error": "Please check your network connection.",
  "common.close": "Close",
  "common.loading": "Loading…",
  "common.retry": "Try again",
  "common.view": "View",
  "common.popcorn_count": "{count} EA",
  "common.popcorn_free": "Free",
  "common.purchased": "Purchased",
  "common.remaining": "{time} left",

  // 검색 결과
  "search.results": "search results",
  "search.no_result": "No results match your search.",
  "search.tip1": "Try a different keyword.",
  "search.tip2": "Search by movie or series title.",
  "search.tip3":
    "Search by genre — action, thriller, comedy, romance, or drama.",

  // 푸터
  "footer.nav": "Browse",
  "footer.policy": "Policies",
  "footer.support": "Support",
  "footer.terms": "Terms of Service",
  "footer.privacy": "Privacy Policy",
  "footer.creator": "Creator Support",
  "footer.company": "Company",
  "footer.language": "Language",
  // 사업자정보 (푸터 하단 — Footer.tsx). 사용자 제공 공식 영문값.
  "footer.biz.company": "Company : Studio AIM Inc.",
  "footer.biz.ceo": "CEO : MooShin Rhee",
  "footer.biz.address":
    "Address : 202-dong, 1402-ho, 18 Bucheon-ro 198beon-gil, Wonmi-gu, Bucheon-si, Gyeonggi-do, Republic of Korea (Chunui-dong, Chunui Techno Park 2)",
  "footer.biz.bizno": "Business Registration No. : 602-86-03127",
  "footer.biz.mailorder":
    "Mail-Order Sales Registration No. : No. 2026-Bucheon Wonmi-1442",
  "footer.biz.tel": "Tel : +82-70-7636-1117",
  "footer.biz.email":
    "Email (Inquiries / Customer Center) : aim@aimworks.co.kr",
  "footer.copyright": "Copyright@2026 AIMMOVIE. All rights reserved.",

  // 웰컴(랜딩) — 히어로 (영문 카피 확정 전까지 ko와 동일 미러)
  "welcome.hero_unit": "분.",
  "welcome.hero_title": "딱 좋은 이야기의 길이",
  "welcome.hero_sub1": "짧은 영상은 아쉽고, 긴 정주행은 부담스러운 순간.",
  "welcome.hero_sub2": "30분이면 새로운 이야기에 빠져들고, 한 편을 온전히 즐길 수 있어요.",
  "welcome.hero_sub3": "지금 모든 작품을 무료로 시청할 수 있어요.",
  "welcome.hero_cta": "지금 무료로 시작하기  →",
  "welcome.hero_cta_tag": "숏폼보다 깊게, 시리즈보다 가볍게",
  // 웰컴 — 키워드 섹션 (영문)
  "welcome.kw_label": "FIND YOUR STORY",
  "welcome.kw_title1": "Pick the story",
  "welcome.kw_title2": "You're in the mood for.",
  "welcome.kw_sub": "From genre to mood, a story for how you feel today.",
  // 웰컴 — WHY 30 MINUTES (섹션3, 영문)
  "welcome.why_label": "WHY 30 MINUTES",
  "welcome.why_title1": "Long enough to get hooked.",
  "welcome.why_title2": "Short enough to start now.",
  "welcome.why_sub1": "During lunch, on the go, or before bed.",
  "welcome.why_sub2": "A complete story for the in-between moments of your day.",
  // 웰컴 — 작품(섹션4, 영문)
  "welcome.work_title1": "WHICH WORLD",
  "welcome.work_title2": "WILL YOU ENTER TONIGHT?",
  "welcome.work_sub1": "From idol survival games and forbidden romance to strange fantasies and unpredictable thrillers.",
  "welcome.work_sub2": "A new world in 30 minutes. Every story, free right now.",
  "welcome.work_play": "Watch Now",
  "welcome.signup_continue_cta": "Sign up & keep watching",
  "welcome.signup_continue_title": "Can't wait for\nthe next episode!",
  "welcome.signup_continue_msg":
    "Sign up to AIM MOVIE now\nand keep watching the next episode!",
  // 웰컴 — MADE DIFFERENT(섹션5, 영문)
  "welcome.feat_label": "MADE DIFFERENT",
  "welcome.feat_title1": "Stories that feel familiar.",
  "welcome.feat_title2": "Worlds you've never seen.",
  "welcome.feat.safe_title": "CONTENT",
  "welcome.feat.safe_title2": "YOU CAN TRUST",
  "welcome.feat.safe_body1": "Reviewed for safety and copyright standards.",
  "welcome.feat.safe_body2": "Stories you can watch with confidence.",
  "welcome.feat.safe_body3": "",
  "welcome.feat.genre_title": "STORIES",
  "welcome.feat.genre_title2": "FOR EVERY MOOD",
  "welcome.feat.genre_body1": "Sci-fi, thrillers, fantasy, romance and more.",
  "welcome.feat.genre_body2": "A story for every mood.",
  "welcome.feat.genre_body3": "",
  "welcome.feat.make_title": "STORIES",
  "welcome.feat.make_title2": "YOU CAN SHAPE",
  "welcome.feat.make_body1": "Choose what happens next.",
  "welcome.feat.make_body2": "A story that moves with your choices.",
  "welcome.feat.make_body3": "",
  // 웰컴 — 최종 CTA(섹션6, 영문)
  "welcome.final_title1": "YOUR NEXT OBSESSION",
  "welcome.final_title2": "STARTS HERE.",
  "welcome.final_sub1": "A new world in around 30 minutes.",
  "welcome.final_sub2": "Start with the one that catches your eye. Every story, free right now.",
  "welcome.final_cta": "Explore AIMMOVIE →",

  // 로그인
  "login.title": "Log in",
  "login.google": "Continue with Google",
  "login.apple": "Continue with Apple",
  "login.or": "or",
  "login.email_join": "Join with Email",
  "login.email_login": "Log in with Email",
  "login.save_id": "Save ID",
  "login.find_password": "Find Password",
  "login.email_placeholder": "Enter your email.",
  "login.password": "Password",
  "login.password_placeholder": "Enter your password.",
  "login.withdrawn":
    "This account has been withdrawn. Contact customer support to restore it.",
  "login.withdrawn_requested":
    "This account has a withdrawal request. Contact customer support to restore it.",
  "login.invalid_credentials": "The ID or password is incorrect.",
  "login.email_unverified":
    "Please verify your email first. Complete verification from the email sent at sign-up.",
  "login.resend_done":
    "If your sign-up is pending, we've sent a verification email. Please check your inbox.",
  "login.resend_rate_limited": "Too many requests. Please try again later.",
  "login.server_error":
    "Failed to connect to the server. Please contact the administrator.",
  "login.invalid_info": "Login information is invalid.",
  "login.social_failed": "Social login failed. Please try again in a moment.",

  //아이디 찾기
  "findid.name_placeholder": "Enter your name without spaces.",
  "findid.phone_placeholder": "Enter numbers only without '-'.",
  "findid.fail": "Failed to find your ID.",
  "findid.error": "An error occurred while finding your ID.",

  //비밀번호 찾기
  "findpass.desc1": "Enter the email ID you registered at sign-up.",
  "findpass.desc2": "We'll send a temporary login code to your email.",
  "findpass.send_code": "Send Code",
  "findpass.code_placeholder": "Enter the code.",
  "findpass.reset_btn": "Reset Password",
  "findpass.email_empty": "Please enter your email.",
  "findpass.code_sent": "A temporary login code has been sent to your email.",
  "findpass.send_fail": "Failed to send the code.",
  "findpass.send_error": "An error occurred while sending the code.",
  "findpass.code_empty": "Please enter the verification code.",
  "findpass.code_invalid": "The verification code is incorrect.",
  "findpass.verify_error": "An error occurred during verification.",

  //회원가입
  "join.title": "Sign Up",
  "join.flag": "Country Selection",
  "join.flag.south_korea": "South Korea",
  "join.phone": "Mobile Number",
  "join.phone.placeholder": "Enter numbers only without ‘-’",
  "join.authcode": "Authentication Code",
  "join.authcode.placeholder": "Enter 6-digit authentication code",
  "join.authcode.btn": "Get Code",
  "join.next.btn": "Next Step",
  "join.name": "Name",
  "join.name.placeholder": "Please enter your name.",
  "join.email": "Email ID",
  "join.email.duplicate": "Check",
  "join.password": "Password",
  "join.password.message":
    "Must include 8~20 characters with letters, numbers, and special characters",
  "join.password.placeholder": "Please enter your password.",
  "join.password_confirm": "Confirm Password",
  "join.password_confirm.placeholder": "Please confirm your password.",
  "join.agree_message": "I have read and agree to all terms.",
  "join.agree_terms": "Terms of Service",
  "join.agree_privacy": "Privacy Policy",
  "join.agree_marketing": "Marketing Information Consent",
  "join.agree_information_provision":
    "Third-Party Information Provision Consent",
  "join.required": "Required",
  "join.optional": "Optional",
  "join.complete_message":
    "Sign-up complete. Complete verification from the email we sent within 24 hours.",
  "join.complete_login_btn": "Log in",
  "join.email_placeholder": "Enter your email.",
  "join.password_mismatch": "Please check your password again.",
  "join.email_empty": "Please enter your email ID.",
  "join.email_invalid": "Please enter a valid email address.",
  "join.email_available": "This ID is available.",
  "join.email_duplicate": "This ID is already in use.",
  "join.email_check_error": "An error occurred while checking the ID.",
  "join.submit_btn": "Sign Up",
  "join.submit_error": "Sign-up failed. Please try again.",
  "join.network_error": "An error occurred during sign-up.",
  "join.phone_empty": "Please enter your mobile number.",
  "join.code_send_fail": "Failed to send the verification code.",
  "join.code_first": "Please request the verification code first.",
  "join.code_six": "Please enter the 6-digit verification code.",
  "join.code_invalid": "The verification code is incorrect or has expired.",
  "join.code_resend": "Resend Code",
  "join.code_resend_cooldown": "Resend ({sec})",
  "join.verifying": "Verifying…",

  //view
  "view.By": "By",
  "view.episode": "Episodes",
  "view.episode_no": "Episode",
  "view.season": "Season",
  "view.limited_series": "Limited Series",

  //player — /play screen on apps/tv
  "player.play": "Play",
  "player.pause": "Pause",
  "player.rewind": "Back {sec}s",
  "player.forward": "Forward {sec}s",
  "player.back": "Exit",
  "player.buffering": "Loading…",
  "player.error": "This video cannot be played.",
  "player.no_source": "No playable video found.",
  "player.load_failed": "Couldn't load the video information.",
  "player.episode_label": "Season {season} · Episode {episode}",
  "player.drm_unsupported": "Protected videos can't be played on this device.",
  "player.drm_device_unsupported": "This TV or the connected display doesn't meet the requirements for protected playback (Widevine hardware security, HDCP).",
  "player.drm_failed": "Couldn't verify playback rights. Please try again shortly.",

  //mypage
  "mypage.title": "My Page",
  "mypage.myinfo": "My Information",
  "mypage.mywatched": "My Viewing History",
  "mypage.mywatched.empty": "No viewing history available.",
  "mypage.myfavorites": "My Favorite Content",
  "mypage.myfavorites.empty": "No favorite content available.",
  "mypage.myaccount": "Account Information",
  "mypage.changepassword": "Change Password",
  "mypage.withdraw": "Withdraw Membership",
  "mypage.withdraw.confirm": "Are you sure you want to withdraw from AIMMOVIE?",
  "mypage.withdraw.agree": "I understand the above.",
  "mypage.withdraw.desc":
    "If you withdraw from AIMMOVIE, all of your AIMMOVIE-related data will be permanently deleted and cannot be recovered.",
  "mypage.withdraw.submit": "Withdraw",
  "mypage.withdraw.fail":
    "Failed to process withdrawal. Please try again later.",
  "mypage.withdraw.done_title": "Your membership withdrawal is complete.",
  "mypage.withdraw.done_desc": "Thank you for using AIMMOVIE.",
  "mypage.myPopcorn": "My Popcorn",
  "mypage.popcornHistory": "My Popcorn History",
  "mypage.charge": "Charge",
  "mypage.subscriptionHistory": "My Subscriptions",
  "mypage.purchaseOrRent": "Individual Purchase",
  "mypage.browseCatalog": "Browse Content",
  "mypage.logout_success": "You have been logged out.",

  //팝콘 충전 안내 (TV)
  "popcorn.guide_title": "About Popcorn Top-up",
  "popcorn.guide_desc":
    "What is Popcorn? It is the credit used exclusively within AIMMOVIE to watch titles.",
  "popcorn.package_bonus": "+{percent}%",
  "popcorn.package_count": "{count}",
  "popcorn.package_plus": "+{count}",
  "popcorn.package_price": "KRW {amount}",
  "popcorn.first_benefit": "First top-up bonus!",
  "popcorn.tv_unavailable":
    "Popcorn top-up is not available on TV yet. Please visit aimmovie.com to top up.",

  //비밀번호 변경 (TV)
  "pw.label": "Password",
  "pw.rule": "*8-20 characters including letters, numbers and symbols",
  "pw.placeholder": "Enter your password.",
  "pw.retype_label": "Confirm password",
  "pw.retype_placeholder": "Enter your password again.",
  "pw.err_empty": "Please enter a password.",
  "pw.err_rule":
    "The password must be 8-20 characters, include letters, numbers and symbols, and contain no spaces.",
  "pw.err_retype_empty": "Please confirm your password.",
  "pw.err_mismatch": "The passwords do not match.",
  "pw.done": "Your password has been changed.",
  "pw.fail": "Failed to change the password.",
  "pw.error": "An error occurred while changing the password.",

  //휴대폰 인증
  "phone.verify_complete": "Verification complete.",
  "phone.save_failed": "Failed to save. Please try again.",
  "phone.title": "Phone Verification",
  "phone.description":
    "Please complete country and phone verification to use the service.",
  "phone.submit_button": "Verify and Start",

  //시청기록
  "watch.delete_failed": "Failed to delete. Please try again.",

  //메일 인증
  "mailauth.resend_success":
    "Verification email resent. Please check your inbox.",
  "mailauth.resend_failed": "Failed to resend. Please try again later.",
  "mailauth.server_error": "A server error occurred. Please try again later.",
  "mailauth.invalid_access":
    "Invalid access. Please check the verification link again.",
  "mailauth.verify_complete": "Email verification complete.",
  "mailauth.verify_failed": "Verification failed or the link has expired.",
  "mailauth.failed_title": "Email verification failed.",
  "mailauth.link_validity":
    "The verification link is valid for 24 hours after issuance.",
  "mailauth.resending": "Resending…",
  "mailauth.resend_button": "Resend Verification Email",
  "mailauth.rejoin_button": "Sign Up Again",

  //고객지원 Contact 팝업
  "contact.desc":
    "Reach out to the contact for the service you need and we'll handle it promptly.",
  "contact.col_field": "Support Area",
  "contact.col_email": "Contact",
  "contact.tech": "Technical Support",
  "contact.creator": "Creator Registration",
  "contact.partnership": "Partnership Inquiry",
  "contact.ad": "Advertising Inquiry",

  //정책 팝업 제목 (본문은 컴포넌트에서 useLang로 ko/en 분기)
  "policy.terms_title": "AIMMOVIE Terms of Service",
  "policy.privacy_title": "AIMMOVIE Privacy Policy",

  //크리에이터 - 히어로 태그
  "creator.tag1": "# 25% Revenue Share",
  "creator.tag2": "# No Listing Fees",
  "creator.tag3": "# BIFAN Official Partner",

  //크리에이터 - 히어로
  "creator.for_creators": "For Creators",
  "creator.title": "Now,{brm}{hl}it's YOUR turn.{/hl}",
  "creator.desc1":
    "AIMMOVIE — the world's first AI-native, mid-form OTT platform.",
  "creator.desc2": "Create. Upload. Reach a global audience. Get paid.",
  "creator.apply_btn": "Apply as a Creator",

  //크리에이터 - FAQ
  "creator.faq_head": "FAQ",
  "creator.faq_q1": "Non-exclusive or exclusive — which is better for me?",
  "creator.faq_a1":
    "Non-exclusive lets you release on other platforms at the same time. Exclusive means AIMMOVIE only, for a set period — in return, you get a higher revenue share and extra promotion. We'll help you decide what fits your work during the onboarding consultation.",
  "creator.faq_q2": "Can creators living abroad sign up?",
  "creator.faq_a2":
    "Yes — AIMMOVIE is global. If you're based abroad, we support international transfers (SWIFT, PayPal, Wise, etc.) and tax handling for your country. Contracts and forms are available in English and Chinese, too.",
  "creator.faq_q3": "How — and how often — do payouts work?",
  "creator.faq_a3":
    "Payouts happen quarterly (end of March, June, September, December). Track your earnings anytime on the Creator Dashboard — payment lands within 30 days after each quarter closes.",
  "creator.faq_q4": "How do I submit my master file?",
  "creator.faq_a4":
    "Just share a Google Drive folder with aim@aimworks.co.kr. We recommend ProRes 422 HQ or high-quality MOV/MXF/MP4 masters — full specs are in our Master Delivery Specifications doc.",
  "creator.faq_q5": "Can I upload content already posted on YouTube?",
  "creator.faq_a5":
    "Yes. Non-exclusive listing lets you keep it up on YouTube and other platforms at the same time. For exclusive listing, just set it to private elsewhere for a set period — and you'll get a higher revenue share in return.",
  "creator.faq_q6": "After signing up, by when do I need to upload my work?",
  "creator.faq_a6":
    "As a Founding Creator, we recommend uploading your first work within 2–4 weeks of signing up. If it's still showing at a festival, you're welcome to list it once the festival wraps.",

  // 회사정보(About) - 히어로
  // 강조/줄바꿈은 인라인 마커: {hl}..{/hl}=색상 강조, {br}=줄바꿈, {brm}=모바일 전용 줄바꿈.
  "about.hero_title":
    "{hl}A new story{/hl} that{br}breathes with you-{br}Meet it now.",
  "about.hero_desc1":
    "A new world, crafted by AI creators.{br}Unlike any OTT you've known..",
  "about.hero_desc2": "AIMMOVIE.",

  //회사정보(About) - 인트로 헤드라인
  "about.intro": "Unlike any OTT {br}you've known, {br}{hl}AIMMOVIE.{/hl}",

  //회사정보(About) - 특징 박스
  "about.box1_title": "Content That Breathes With You",
  "about.box1_body":
    "Not short, not heavy — a new rhythm for busy lives.\nCommute, lunch, bedtime — content that keeps your pace.",
  "about.box2_title": "Your Story, Your Choice",
  "about.box2_body": "No fixed endings.\nYour choices shape the next episode.",
  "about.box3_title": "Imagination Never Seen Before",
  "about.box3_body":
    "AI meets human imagination.\nNew visuals, new stories, new worlds —\nnot more of the same, but something entirely new.",
  "about.box4_title": "New Voices, Global Stage",
  "about.box4_body":
    "AI creators worldwide, diverse cultures, fresh perspectives.\nAIMMOVIE is their first global stage.",

  //회사정보(About) - 스크롤 연출(scene)
  "about.scene1": "From{br}{hl}pressing{/hl}{br}play,",
  "about.scene2": "To{br}{hl}watching{/hl}{br}together.",
  "about.cta":
    "Right here, right now — {br}{hl}be the first to witness the world{/hl}{br}you've dreamed of.",

  //TV 페어링 — TV 화면(코드 발급·표시)
  "tv.pairing_lead":
    "No need to type your account with the remote. Approve on your phone or PC and this TV signs in right away.",
  "tv.pairing_issuing": "Getting your sign-in code…",
  "tv.pairing_step_visit": "On your phone or PC, go to {hl}{url}{/hl}.",
  "tv.pairing_step_enter": "Enter the code below and approve.",
  "tv.pairing_code_note": "Once approved, this TV signs in automatically.",
  "tv.pairing_waiting": "Waiting for approval",
  "tv.pairing_qr_title": "Faster with QR",
  "tv.pairing_qr_note":
    "Scan it with your phone camera to skip entering the code.",
  "tv.pairing_expired": "This code has expired.",
  "tv.pairing_expired_note":
    "Get a new code, then approve again on your phone or PC.",
  "tv.pairing_new_code": "Get a new code",
  "tv.pairing_err_parse":
    "The server response could not be read (HTTP {status}). Check the server address and deployment.",
  "tv.pairing_err_code":
    "Could not get a sign-in code. Please try again in a moment.",
  "tv.pairing_err_network":
    "Cannot reach the server. Please check your network connection.",

  //TV 페어링 — 기기 이름
  "tv.device_tizen": "Samsung TV",
  "tv.device_webos": "LG TV",
  "tv.device_androidtv": "Android TV",
  "tv.device_generic": "TV",

  //TV 페어링 — 폰/PC 승인 화면(/tv)
  "tv.approve_input_title": "Enter the code shown on your TV.",
  "tv.approve_input_desc":
    "Type the 8-character code exactly as it appears on the TV screen.",
  "tv.approve_input_label": "The 8-character code shown on your TV",
  "tv.approve_input_hint": "Enter all 8 characters to continue.",
  "tv.approve_next": "Next",
  "tv.approve_confirm_title": "Sign in to AIMMOVIE on TV?",
  "tv.approve_warn":
    "Make sure this is the code you read on your own TV screen. Do not approve a code someone else gave you.",
  "tv.approve_submit": "Approve sign-in",
  "tv.approve_submitting": "Approving…",
  "tv.approve_done_title": "You are signed in.",
  "tv.approve_done_desc": "{device} will switch screens in a moment.",
  "tv.approve_home": "Go to home",
  "tv.approve_failed_title": "Could not approve.",
  "tv.approve_err_invalid":
    "That code was not found. Check the code on your TV screen.",
  "tv.approve_err_expired": "This code has expired. Get a new code on your TV.",
  "tv.approve_err_already": "This code was already approved.",
  "tv.approve_err_rate": "Too many attempts. Please try again in a moment.",
  "tv.approve_err_generic": "Approval failed.",
  //대여/충전 팝업 (RentModal / ChargeModal)
  "common.price_won": "₩{won}",
  "rent.title": "Rent Content",
  "rent.my_popcorn": "My Popcorn: {count} EA",
  "rent.season": " Season {season}",
  "rent.episode": " - Episode {episode}",
  "rent.confirm": "Watch now?",
  "rent.button": "Watch now for {cost} popcorn",
  "rent.fail": "Purchase failed. Please try again.",
  "charge.title": "Charge Popcorn",
  "charge.insufficient": "You need more popcorn",
  "charge.required": "Required",
  "charge.my_popcorn": "My Popcorn",
  "charge.short": "Shortfall",
  "charge.packages": "Popcorn Packages",
  "charge.bonus": "+{count} EA",
  "payment.web_only": "Payment is available on the web.",
  "payment.login_required": "Login required.",
  "payment.order_failed": "Failed to create the order.",
  "payment.verify_failed":
    "Payment verification failed. Please contact support.",
  "payment.pending": "Payment is pending.",
  "payment.error": "An error occurred during payment.",
  "payment.cancelled": "Payment was cancelled.",

  //팝콘 충전 페이지 (상단)
  "popcorn.page_title": "Popcorn Charge Guide",
  "popcorn.desc1": "*What is popcorn? The dedicated payment method",
  "popcorn.desc2": " for watching content within AIMMOVIE.",
  "popcorn.charge_complete": "Your popcorn has been charged.",
  "popcorn.premium_label": "First charge special!",
  "popcorn.cancel_notice":
    "For payment cancellation, please contact customer support ({email}).",
};

export default en;
