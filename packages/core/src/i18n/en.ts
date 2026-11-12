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
  "common.set_new_password": "Set New Password",
  "common.close": "Close",
  "common.loading": "Loading…",
  "common.retry": "Try again",
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

  //회원가입
  "join.agree_terms": "Terms of Service",

  //view
  "view.By": "By",
  "view.episode": "Episodes",
  "view.episode_no": "Episode",
  "view.season": "Season",
  "view.limited_series": "Limited Series",

  //player — /play screen
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

  //mypage
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

  //팝콘 충전 안내
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

  //비밀번호 변경
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

  //시청기록
  "watch.delete_failed": "Failed to delete. Please try again.",

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

  //기기 페어링 — 코드 발급·표시 화면
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

  //기기 페어링 — 기기 이름
  "tv.device_generic": "TV",

  //대여 팝업 (RentModal)
  "rent.title": "Rent Content",
  "rent.my_popcorn": "My Popcorn: {count} EA",
  "rent.season": " Season {season}",
  "rent.episode": " - Episode {episode}",
  "rent.confirm": "Watch now?",
  "rent.button": "Watch now for {cost} popcorn",
  "rent.fail": "Purchase failed. Please try again.",
};

export default en;
