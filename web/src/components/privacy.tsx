import React, { useState } from "react";
import { useRouter } from "@/compat/navigation";
import { useEffect } from "react";
import { useT, useLang } from "@/i18n/LocaleProvider";

export default function PrivacyPolicy() {
    const router = useRouter();
    const t = useT();
    const { lang } = useLang();
    const closeClick = () => {
        router.back();
    };
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);
    return (
        <div className="popup_type3 active">
            <div className="bg" onClick={closeClick}></div>

            <div className="popup">
                <div className="close_btn" onClick={closeClick}>
                    <span></span>
                    <span></span>
                </div>
                <div className="tit">
                    <p>{t("policy.privacy_title")}</p>
                </div>
                <div className="scroll">
                    {lang === "en" ? (
                        <>
                            <ul>
                                <li>
                                    <div>
                                        Studio AIM Inc. (hereinafter the "Company") complies with
                                        the Personal Information Protection Act and other applicable
                                        laws, and establishes and discloses the following Privacy
                                        Policy to safely protect the personal information of
                                        AIMMOVIE service users.
                                    </div>
                                </li>
                            </ul>
                            <ul>
                                <li>
                                    <p>
                                        Article 1 (Personal Information Items Collected and
                                        Collection Methods)
                                    </p>
                                    <div>
                                        The Company collects only the minimum personal information
                                        necessary to provide the service.
                                        <ul>
                                            <li>
                                                1. At sign-up (SNS social login: Google, Apple,
                                                Kakao, etc.) — email (or social account identifier),
                                                nickname / provided directly by the data subject
                                                (via social login integration)
                                            </li>
                                            <li>
                                                2. When paying for Popcorn — payment method
                                                information (tokenized by the payment gateway;
                                                sensitive financial information such as card numbers
                                                is not stored on the Company's servers) / collected
                                                via the payment gateway (PG company)
                                            </li>
                                            <li>
                                                3. Automatically generated during service use —
                                                viewing history, Popcorn usage history, access logs,
                                                device information, cookies / collected
                                                automatically during service use
                                            </li>
                                            <li>
                                                4. During customer inquiries (CS) — name, email,
                                                inquiry details / provided directly by the data
                                                subject
                                            </li>
                                            <li>
                                                5. (Optional) When you consent to receive marketing
                                                information — marketing consent status / provided
                                                directly by the data subject (separate consent)
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 2 (Purposes of Processing Personal Information)</p>
                                    <div>
                                        The Company processes the collected personal information for
                                        the following purposes.
                                        <ul>
                                            <li>
                                                1. Confirming intent to sign up, member
                                                identification and authentication, maintaining and
                                                managing membership
                                            </li>
                                            <li>
                                                2. Payment processing such as Popcorn purchases and
                                                refunds
                                            </li>
                                            <li>
                                                3. Content recommendation, service improvement, and
                                                usage statistics analysis
                                            </li>
                                            <li>
                                                4. Responding to customer inquiries and handling
                                                complaints
                                            </li>
                                            <li>
                                                5. (With consent) Providing marketing information
                                                such as promotions and events
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>
                                        Article 3 (Retention and Use Period of Personal Information)
                                    </p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① In principle, the Company destroys personal
                                                information without delay once the purpose of
                                                processing has been achieved.
                                            </li>
                                            <li>
                                                ② However, where retention is required under
                                                applicable laws, the Company retains the information
                                                for the period prescribed by such laws.
                                                <ul>
                                                    <li>
                                                        - Records on contracts or withdrawal of
                                                        subscription: 5 years (Act on Consumer
                                                        Protection in Electronic Commerce)
                                                    </li>
                                                    <li>
                                                        - Records on payment and supply of goods: 5
                                                        years (Act on Consumer Protection in
                                                        Electronic Commerce)
                                                    </li>
                                                    <li>
                                                        - Records on consumer complaints or dispute
                                                        resolution: 3 years (Act on Consumer
                                                        Protection in Electronic Commerce)
                                                    </li>
                                                    <li>
                                                        - Records on electronic financial
                                                        transactions: 5 years (Electronic Financial
                                                        Transactions Act)
                                                    </li>
                                                    <li>
                                                        - Records on access (login records, etc.): 3
                                                        months (Protection of Communications Secrets
                                                        Act)
                                                    </li>
                                                </ul>
                                            </li>
                                            <li>
                                                ③ Upon membership withdrawal, personal information
                                                is destroyed without delay; however, information
                                                subject to the statutory retention periods above is
                                                stored separately and destroyed once the period
                                                elapses.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>
                                        Article 4 (Provision of Personal Information to Third
                                        Parties)
                                    </p>
                                    <div>
                                        In principle, the Company does not use users' personal
                                        information beyond the scope notified in Article 1 or
                                        provide it to third parties. The following cases are
                                        exceptions.
                                        <ul>
                                            <li>1. Where the user has given prior consent</li>
                                            <li>
                                                2. Where required under the provisions of laws, or
                                                where an investigative agency requests it for
                                                investigative purposes in accordance with the
                                                procedures and methods prescribed by law
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>
                                        Article 5 (Outsourcing of Personal Information Processing)
                                    </p>
                                    <div>
                                        To provide the service, the Company outsources personal
                                        information processing tasks as follows.
                                        <ul>
                                            <li>1. Payment processing (domestic): Inicis</li>
                                            <li>
                                                2. Video content delivery (CDN·streaming):
                                                Cloudflare Stream
                                            </li>
                                            <li>
                                                3. Operation of app/DB servers where personal
                                                information such as member information and payment
                                                records is stored: the Company's own servers at a
                                                domestic IDC center
                                            </li>
                                        </ul>
                                        When entering into an outsourcing agreement, the Company
                                        specifies in the contract, in accordance with Article 26 of
                                        the Personal Information Protection Act, the prohibition of
                                        processing personal information beyond the purpose of the
                                        outsourced work, technical and managerial protection
                                        measures, etc., and supervises whether the trustee processes
                                        personal information safely.
                                    </div>
                                </li>
                                <li>
                                    <p>Article 6 (Overseas Transfer of Personal Information)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The Company may transfer personal information
                                                overseas for server operation and overseas payment
                                                processing. The time of transfer, destination
                                                country, recipient, and items transferred are
                                                notified in advance and consent is obtained in
                                                accordance with applicable laws.
                                            </li>
                                            <li>
                                                ② When transferring the information of users located
                                                outside Korea, such as in the European Union (EU),
                                                the Company takes protective measures required by
                                                the laws of the relevant country or region (such as
                                                concluding Standard Contractual Clauses (SCC)),
                                                including GDPR.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>
                                        Article 7 (Procedures and Methods for Destroying Personal
                                        Information)
                                    </p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The Company destroys the relevant personal
                                                information without delay once the retention period
                                                has elapsed or the purpose of processing has been
                                                achieved.
                                            </li>
                                            <li>
                                                ② Information in the form of electronic files is
                                                deleted using a technical method that renders it
                                                unrecoverable, and paper documents are shredded or
                                                incinerated.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>
                                        Article 8 (Rights of Data Subjects and How to Exercise Them)
                                    </p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① Users may at any time request access to,
                                                correction, deletion, suspension of processing, or
                                                transfer of their personal information.
                                            </li>
                                            <li>
                                                ② The rights under Paragraph 1 may be exercised
                                                through the personal information management screen
                                                within the service or through customer support
                                                (aim@aimworks.co.kr) in writing, by email, etc., and
                                                the Company will take action without delay (in
                                                principle, within 30 days of receipt).
                                            </li>
                                            <li>
                                                ③ For the personal information of children under the
                                                age of 14, the rights may be exercised by a legal
                                                representative.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>
                                        Article 9 (Installation, Operation, and Refusal of Automatic
                                        Personal Information Collection Devices)
                                    </p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The Company uses cookies to provide customized
                                                services to users.
                                            </li>
                                            <li>
                                                ② Cookies essential to providing the service, such
                                                as maintaining login sessions, may be used without
                                                separate consent, but cookies for marketing and
                                                analytics purposes are used with the user's consent.
                                            </li>
                                            <li>
                                                ③ Users may refuse the storage of cookies through
                                                their web browser settings, in which case some
                                                restrictions on service use may occur.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>
                                        Article 10 (Measures to Ensure the Safety of Personal
                                        Information)
                                    </p>
                                    <div>
                                        The Company takes the following measures to protect personal
                                        information.
                                        <ul>
                                            <li>
                                                1. Sensitive payment-related financial information
                                                is not stored on the Company's own servers but is
                                                entrusted to the payment gateway for processing
                                            </li>
                                            <li>
                                                2. Management of access rights to personal
                                                information and access control
                                            </li>
                                            <li>
                                                3. Minimization of personnel handling personal
                                                information and regular training
                                            </li>
                                            <li>
                                                4. Encryption of payment data in transit (TLS 1.2 or
                                                higher)
                                            </li>
                                            <li>
                                                5. Pseudonymization when used for analytics purposes
                                                (hashing of member identifiers, etc.)
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 11 (Personal Information Protection Officer)</p>
                                    <div>
                                        The Company designates a Personal Information Protection
                                        Officer as follows to oversee tasks related to personal
                                        information processing and to handle user complaints and
                                        remedy damages.
                                        <ul>
                                            <li>- Name: Lee Mu-shin</li>
                                            <li>- Position: Chief Executive Officer (CEO)</li>
                                            <li>- Contact: alex@aimworks.co.kr</li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 12 (Remedies for Infringement of Rights)</p>
                                    <div>
                                        If you need to report or consult about a personal
                                        information infringement, you may contact the following
                                        organizations.
                                        <ul>
                                            <li>
                                                - Personal Information Dispute Mediation Committee
                                                (privacy.go.kr / 1833-6972, no area code)
                                            </li>
                                            <li>
                                                - Personal Information Infringement Report Center
                                                (privacy.go.kr / 118, no area code)
                                            </li>
                                            <li>
                                                - Supreme Prosecutors' Office Cyber Investigation
                                                Division (spo.go.kr / 1301, no area code)
                                            </li>
                                            <li>
                                                - National Police Agency Cyber Investigation Bureau
                                                (ecrm.cyber.go.kr / 182, no area code)
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 13 (Duty to Notify)</p>
                                    <div>
                                        When there is any addition, deletion, or amendment to this
                                        Privacy Policy, the Company will notify it through
                                        announcements within the service at least 7 days before it
                                        takes effect (30 days in advance for significant changes).
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">Addendum</p>
                            <ul>
                                <li>
                                    <div>This Policy takes effect on August 8, 2026.</div>
                                </li>
                            </ul>
                        </>
                    ) : (
                        <>
                            <ul>
                                <li>
                                    <div>
                                        주식회사 스튜디오에임(이하 "회사")은 「개인정보 보호법」 등
                                        관계 법령을 준수하며, AIMMOVIE 서비스 이용자의 개인정보를
                                        안전하게 보호하기 위해 다음과 같이 개인정보처리방침을
                                        수립·공개합니다.
                                    </div>
                                </li>
                            </ul>
                            <ul>
                                <li>
                                    <p>제1조(수집하는 개인정보 항목 및 수집방법)</p>
                                    <div>
                                        회사는 서비스 제공을 위해 필요한 최소한의 개인정보만을
                                        수집합니다.
                                        <ul>
                                            <li>
                                                1. 회원가입 시(SNS 소셜 로그인: Google, Apple, Kakao
                                                등) — 이메일(또는 소셜 계정 식별정보), 닉네임 /
                                                정보주체가 직접 제공(소셜 로그인 연동)
                                            </li>
                                            <li>
                                                2. 팝콘 결제 시 — 결제수단 정보(결제대행사 토큰화
                                                처리, 카드번호 등 민감 금융정보는 회사 서버에
                                                저장하지 않음) / 결제대행사(PG사)를 통해 수집
                                            </li>
                                            <li>
                                                3. 서비스 이용 과정에서 자동 생성 — 시청 이력, 팝콘
                                                사용 내역, 접속 로그, 기기정보, 쿠키 / 서비스 이용
                                                과정에서 자동 수집
                                            </li>
                                            <li>
                                                4. 고객문의(CS) 시 — 이름, 이메일, 문의내용 /
                                                정보주체가 직접 제공
                                            </li>
                                            <li>
                                                5. (선택) 마케팅 정보 수신에 동의한 경우 — 마케팅
                                                수신 동의 여부 / 정보주체가 직접 제공(별도 동의)
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제2조(개인정보의 처리목적)</p>
                                    <div>
                                        회사는 수집한 개인정보를 다음 목적을 위해 처리합니다.
                                        <ul>
                                            <li>
                                                1. 회원가입 의사 확인, 회원 식별·인증, 회원자격
                                                유지·관리
                                            </li>
                                            <li>2. 팝콘 구매·환불 등 결제 처리</li>
                                            <li>3. 콘텐츠 추천, 서비스 개선, 이용통계 분석</li>
                                            <li>4. 고객문의 응대, 민원처리</li>
                                            <li>
                                                5. (동의 시) 프로모션·이벤트 등 마케팅 정보 안내
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제3조(개인정보의 보유 및 이용기간)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사는 원칙적으로 개인정보 처리목적이 달성되면
                                                해당 정보를 지체 없이 파기합니다.
                                            </li>
                                            <li>
                                                ② 다만, 관계 법령에 따라 보존이 필요한 경우 해당
                                                법령이 정한 기간 동안 보관합니다.
                                                <ul>
                                                    <li>
                                                        - 계약 또는 청약철회 등에 관한 기록:
                                                        5년(전자상거래법)
                                                    </li>
                                                    <li>
                                                        - 대금결제 및 재화 등의 공급에 관한 기록:
                                                        5년(전자상거래법)
                                                    </li>
                                                    <li>
                                                        - 소비자의 불만 또는 분쟁처리에 관한 기록:
                                                        3년(전자상거래법)
                                                    </li>
                                                    <li>
                                                        - 전자금융 거래에 관한 기록:
                                                        5년(전자금융거래법)
                                                    </li>
                                                    <li>
                                                        - 접속에 관한 기록(로그인 기록 등):
                                                        3개월(통신비밀보호법)
                                                    </li>
                                                </ul>
                                            </li>
                                            <li>
                                                ③ 회원 탈퇴 시 개인정보는 지체 없이 파기하되, 위
                                                법정 보관기간이 있는 정보는 별도 분리 보관 후 기간
                                                경과 시 파기합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제4조(개인정보의 제3자 제공)</p>
                                    <div>
                                        회사는 원칙적으로 이용자의 개인정보를 제1조에서 고지한
                                        범위를 초과하여 이용하거나 제3자에게 제공하지 않습니다. 다만
                                        다음의 경우는 예외로 합니다.
                                        <ul>
                                            <li>1. 이용자가 사전에 동의한 경우</li>
                                            <li>
                                                2. 법령의 규정에 의거하거나, 수사기관이 수사
                                                목적으로 법령에 정해진 절차와 방법에 따라 요구하는
                                                경우
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제5조(개인정보 처리의 위탁)</p>
                                    <div>
                                        회사는 서비스 제공을 위해 아래와 같이 개인정보 처리업무를
                                        외부에 위탁하고 있습니다.
                                        <ul>
                                            <li>1. 결제 처리(국내): 이니시스</li>
                                            <li>
                                                2. 영상 콘텐츠 전송(CDN·스트리밍): Cloudflare Stream
                                            </li>
                                            <li>
                                                3. 회원정보·결제내역 등 개인정보가 저장되는 앱/DB
                                                서버 운영: 자체서버 국내 IDC 센터
                                            </li>
                                        </ul>
                                        회사는 위탁계약 체결 시 개인정보 보호법 제26조에 따라
                                        위탁업무 수행 목적 외 개인정보 처리 금지, 기술적·관리적
                                        보호조치 등을 계약서에 명시하고, 수탁자가 개인정보를
                                        안전하게 처리하는지 감독합니다.
                                    </div>
                                </li>
                                <li>
                                    <p>제6조(개인정보의 국외 이전)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사는 서버 운영 및 해외 결제 처리를 위해
                                                개인정보를 국외로 이전할 수 있습니다. 이전 시점,
                                                이전 국가, 이전받는 자, 이전 항목 등은 관계 법령에
                                                따라 사전에 고지하고 동의를 받습니다.
                                            </li>
                                            <li>
                                                ② 유럽연합(EU) 등 국외 이용자의 정보를 이전하는
                                                경우, GDPR 등 해당 국가·지역의 법령에 따른
                                                보호조치(표준계약조항(SCC) 체결 등)를 취합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제7조(개인정보의 파기절차 및 방법)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사는 개인정보 보유기간이 경과하거나 처리목적이
                                                달성된 경우 해당 개인정보를 지체 없이 파기합니다.
                                            </li>
                                            <li>
                                                ② 전자적 파일 형태의 정보는 복구할 수 없는 기술적
                                                방법으로 삭제하며, 종이 문서는 분쇄하거나
                                                소각합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제8조(정보주체의 권리와 행사방법)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 이용자는 언제든지 자신의 개인정보에 대해 열람,
                                                정정, 삭제, 처리정지, 이동을 요구할 수 있습니다.
                                            </li>
                                            <li>
                                                ② 제1항의 권리 행사는 서비스 내 개인정보 관리화면
                                                또는 고객센터(aim@aimworks.co.kr)를 통해 서면,
                                                이메일 등의 방법으로 하실 수 있으며, 회사는 이에
                                                대해 지체 없이(원칙적으로 접수일로부터 30일 이내)
                                                조치합니다.
                                            </li>
                                            <li>
                                                ③ 만 14세 미만 아동의 개인정보에 관한 권리는
                                                법정대리인이 행사할 수 있습니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제9조(개인정보의 자동 수집 장치 설치·운영 및 거부)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사는 이용자에게 맞춤형 서비스를 제공하기 위해
                                                쿠키(cookie)를 사용합니다.
                                            </li>
                                            <li>
                                                ② 로그인 세션 유지 등 서비스 제공에 필수적인 쿠키는
                                                별도 동의 없이 사용될 수 있으나, 마케팅·분석 목적의
                                                쿠키는 이용자의 동의를 받아 사용합니다.
                                            </li>
                                            <li>
                                                ③ 이용자는 웹브라우저 설정을 통해 쿠키 저장을 거부할
                                                수 있으며, 이 경우 서비스 이용에 일부 제한이 발생할
                                                수 있습니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제10조(개인정보의 안전성 확보조치)</p>
                                    <div>
                                        회사는 개인정보 보호를 위해 다음과 같은 조치를 취하고
                                        있습니다.
                                        <ul>
                                            <li>
                                                1. 결제 관련 민감 금융정보는 자체 서버에 저장하지
                                                않고 결제대행사에 위탁 처리
                                            </li>
                                            <li>2. 개인정보에 대한 접근권한 관리 및 접근통제</li>
                                            <li>3. 개인정보 취급자 최소화 및 정기 교육</li>
                                            <li>4. 결제 데이터 전송구간 암호화(TLS 1.2 이상)</li>
                                            <li>
                                                5. 분석 목적 활용 시 가명처리(회원 식별정보 해시화
                                                등)
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제11조(개인정보 보호책임자)</p>
                                    <div>
                                        회사는 개인정보 처리에 관한 업무를 총괄하고 이용자의
                                        불만처리 및 피해구제를 위해 아래와 같이 개인정보
                                        보호책임자를 지정하고 있습니다.
                                        <ul>
                                            <li>- 성명: 이무신</li>
                                            <li>- 직책: 대표이사(CEO)</li>
                                            <li>- 연락처: alex@aimworks.co.kr</li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제12조(권익침해 구제방법)</p>
                                    <div>
                                        개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에
                                        문의하실 수 있습니다.
                                        <ul>
                                            <li>
                                                - 개인정보분쟁조정위원회(privacy.go.kr / 국번없이
                                                1833-6972)
                                            </li>
                                            <li>
                                                - 개인정보침해신고센터(privacy.go.kr / 국번없이 118)
                                            </li>
                                            <li>
                                                - 대검찰청 사이버수사과(spo.go.kr / 국번없이 1301)
                                            </li>
                                            <li>
                                                - 경찰청 사이버수사국(ecrm.cyber.go.kr / 국번없이
                                                182)
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제13조(고지의 의무)</p>
                                    <div>
                                        현 개인정보처리방침의 내용 추가, 삭제 및 수정이 있을 시에는
                                        시행 최소 7일 전(중요한 변경의 경우 30일 전)부터 서비스 내
                                        공지사항을 통해 고지합니다.
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">부칙</p>
                            <ul>
                                <li>
                                    <div>본 방침은 2026년 8월 8일부터 시행합니다.</div>
                                </li>
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
