import { useRouter } from "@/compat/navigation";
import { useEffect } from "react";
import { useT, useLang } from "@/i18n/LocaleProvider";

export default function TermsOfService() {
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
                    <p>{t("policy.terms_title")}</p>
                </div>
                <div className="scroll">
                    {lang === "en" ? (
                        <>
                            <p className="sub_tit">Chapter 1 General Provisions</p>
                            <ul>
                                <li>
                                    <p>Article 1 (Purpose)</p>
                                    <div>
                                        These Terms govern the rights, obligations, and
                                        responsibilities between Studio AIM Inc. (hereinafter the
                                        "Company") and users in connection with the use of the AI
                                        video OTT service "AIMMOVIE" (hereinafter the "Service")
                                        operated by the Company, as well as the conditions for the
                                        purchase, use, and refund of Popcorn credits.
                                    </div>
                                </li>
                                <li>
                                    <p>Article 2 (Definitions)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① "Service" means all services that provide video
                                                content produced by AI or created using AI tools,
                                                through aimmovie.com and related web/app/smart TV,
                                                etc. operated by the Company.
                                            </li>
                                            <li>
                                                ② "Member" means a person who has agreed to these
                                                Terms and entered into a service use agreement.
                                            </li>
                                            <li>
                                                ③ "Creator" means a person who registers and
                                                provides content to the Service and who has entered
                                                into a separate creator agreement (such as a work
                                                consignment agreement). Matters concerning Creators
                                                are governed by such separate agreement in priority
                                                over these Terms.
                                            </li>
                                            <li>
                                                ④ "Content" means all works such as videos, images,
                                                and text provided within the Service.
                                            </li>
                                            <li>
                                                ⑤ "AI-generated Content" means content produced in
                                                whole or in part using generative AI.
                                            </li>
                                            <li>
                                                ⑥ "Popcorn" means the service-exclusive paid or free
                                                credit issued by the Company for Members to use for
                                                purchasing content, supporting creators (donations),
                                                participatory voting, etc. within the Service.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 3 (Posting and Amendment of Terms)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The Company posts the contents of these Terms on
                                                the initial service screen or a linked screen so
                                                that Members can easily view them.
                                            </li>
                                            <li>
                                                ② The Company may amend these Terms within the scope
                                                that does not violate applicable laws, and upon
                                                amendment, announces the effective date and reasons
                                                at least 7 days before the effective date (30 days
                                                in advance for changes unfavorable to Members).
                                            </li>
                                            <li>
                                                ③ If a Member continues to use the Service after the
                                                effective date of the amended Terms, the Member is
                                                deemed to have agreed to the amended Terms. A Member
                                                who does not agree to the amended Terms may
                                                terminate the use agreement (withdraw membership).
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 4 (Rules Other Than the Terms)</p>
                                    <div>
                                        Matters not stipulated in these Terms are governed by
                                        applicable laws such as the Act on Consumer Protection in
                                        Electronic Commerce, the Content Industry Promotion Act, the
                                        Act on Promotion of Information and Communications Network
                                        Utilization and Information Protection, the Personal
                                        Information Protection Act, and the Electronic Financial
                                        Transactions Act, as well as detailed usage guidelines
                                        separately established by the Company.
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">
                                Chapter 2 Conclusion of Use Agreement and Member Management
                            </p>
                            <ul>
                                <li>
                                    <p>Article 5 (Conclusion of the Use Agreement)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The use agreement is concluded when a user agrees
                                                to these Terms, applies for membership in accordance
                                                with the procedures established by the Company
                                                (including simplified sign-up such as SNS social
                                                login), and the Company accepts it.
                                            </li>
                                            <li>
                                                ② The Company may withhold or refuse acceptance of
                                                an application for membership that falls under any
                                                of the following.
                                                <ul>
                                                    <li>
                                                        1. Where another person's identity has been
                                                        stolen
                                                    </li>
                                                    <li>
                                                        2. Where false information has been entered
                                                    </li>
                                                    <li>
                                                        3. Where a child under the age of 14 applies
                                                        for membership without the consent of a
                                                        legal representative
                                                    </li>
                                                    <li>
                                                        4. Where the application otherwise fails to
                                                        meet the requirements established by the
                                                        Company
                                                    </li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 6 (Protection of Minors)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① Children under the age of 14 may not sign up for
                                                the Service without the consent of a legal
                                                representative.
                                            </li>
                                            <li>
                                                ② Where a Member aged 14 or older but under 19 pays
                                                for Popcorn, the Company may establish a procedure
                                                to verify the consent of a legal representative.
                                            </li>
                                            <li>
                                                ③ Content harmful to youth is provided only to
                                                Members who have completed an adult verification
                                                procedure.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 7 (Change and Management of Member Information)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① Members may view and modify their information
                                                through the personal information management screen.
                                            </li>
                                            <li>
                                                ② Members must manage account information such as ID
                                                and password with the care of a good manager and
                                                must not allow third parties to use it.
                                            </li>
                                            <li>
                                                ③ If there is any change to the registered
                                                information, the Member must immediately notify the
                                                Company of such change.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>
                                        Article 8 (Membership Withdrawal and Loss of Qualification)
                                    </p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① Members may request termination of the use
                                                agreement (withdrawal) at any time through the
                                                procedure within the Service, and the Company
                                                processes it immediately in accordance with
                                                applicable laws.
                                            </li>
                                            <li>
                                                ② If a Member violates Article 21 (Member's
                                                Obligations and Prohibited Acts), the Company may
                                                terminate the use agreement or restrict service use
                                                after prior notice. However, where urgent action is
                                                necessary, notice may be given afterward.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">Chapter 3 Provision of the Service</p>
                            <ul>
                                <li>
                                    <p>Article 9 (Contents of the Service)</p>
                                    <div>
                                        The services provided by the Company are as follows.
                                        <ul>
                                            <li>
                                                1. Streaming of AI video content (rental·ownership)
                                            </li>
                                            <li>
                                                2. Content purchases and creator support (donations)
                                                via Popcorn
                                            </li>
                                            <li>
                                                3. User participation features (Remix &amp; Play
                                                voting, Prompted Universe participation, and other
                                                participatory services determined by the Company)
                                            </li>
                                            <li>
                                                4. Other services additionally developed or provided
                                                by the Company through partnerships
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 10 (Service Hours and Suspension)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The Service is, in principle, provided 24 hours a
                                                day, year-round. However, the Company may
                                                temporarily suspend the provision of the Service
                                                where it deems necessary, such as for equipment
                                                maintenance.
                                            </li>
                                            <li>
                                                ② Where the Service is interrupted due to reasons
                                                attributable to the Company and a Member suffers
                                                damage, the Company compensates in accordance with
                                                applicable laws and Article 19.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 11 (Labeling of AI-generated Content)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① In accordance with the Framework Act on Artificial
                                                Intelligence, the Company indicates, on the content
                                                information screen, etc., that AI-generated content
                                                within the Service was generated by AI or produced
                                                using AI tools.
                                            </li>
                                            <li>
                                                ② The Company may indicate the degree of AI use of
                                                content (fully AI-generated / produced using AI /
                                                human creation + AI assistance, etc.) by
                                                distinguishing among them.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>
                                        Article 12 (Content Rating Classification and Age
                                        Restrictions)
                                    </p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① In accordance with applicable laws, the Company
                                                indicates age criteria for content (All ages, 12,
                                                15, 19, etc.), and age-restricted content is
                                                provided only to Members who have completed an age
                                                verification procedure.
                                            </li>
                                            <li>
                                                ② The Company complies with rating classification
                                                obligations under applicable laws such as the
                                                Promotion of the Motion Pictures and Video Products
                                                Act.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 13 (Management of Illegal and Harmful Content)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The Company operates automatic detection and human
                                                review procedures for uploaded content, and
                                                completes an initial review of reported content
                                                without delay after receipt (in principle, within 24
                                                hours).
                                            </li>
                                            <li>
                                                ② Where clearly illegal content such as child or
                                                youth sexual exploitation material is identified,
                                                the Company immediately deletes it, reports it to
                                                the relevant investigative agencies, and restricts
                                                the poster's use.
                                            </li>
                                            <li>
                                                ③ The Company prohibits the posting of content that
                                                synthesizes another person's face or voice without
                                                consent (deepfakes), and upon confirmation,
                                                immediately deletes it and suspends the account.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">Chapter 4 Popcorn Credit</p>
                            <ul>
                                <li>
                                    <p>Article 14 (Nature of Popcorn)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① Popcorn is a service-exclusive credit that can be
                                                used, as determined by the Company, for purchasing
                                                content, supporting creators, participatory voting,
                                                etc. within the Service.
                                            </li>
                                            <li>
                                                ② Popcorn is not cash or a cash equivalent, does not
                                                bear interest, and cannot be transferred between
                                                Members or exchanged for cash.
                                            </li>
                                            <li>
                                                ③ The base value of Popcorn is 1 Popcorn = KRW 100,
                                                and specific usage fees for each content item
                                                (rental/ownership price, etc.) are displayed
                                                separately on the payment screen within the Service.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 15 (Purchase of Popcorn)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① Popcorn may be purchased by credit card, debit
                                                card, simple payment, or other payment methods
                                                determined by the Company.
                                            </li>
                                            <li>
                                                ② Popcorn is credited to the Member's account
                                                immediately after payment is completed, and purchase
                                                and usage history can be checked on My Page.
                                            </li>
                                            <li>
                                                ③ For overseas users, payment in foreign currency
                                                may be supported, in which case the exchange rate at
                                                the time of payment applies.
                                            </li>
                                            <li>
                                                ④ The Company does not store financial information
                                                such as credit cards on its own servers and
                                                processes it through a payment gateway (PG company).
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 16 (Validity Period of Popcorn)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The validity period of Popcorn purchased for a fee
                                                is 5 years from the date of purchase.
                                            </li>
                                            <li>
                                                ② The validity period of Popcorn granted free of
                                                charge through events or promotions is 90 days from
                                                the date granted, and it may be used only for
                                                content purchases, not for support (donations).
                                            </li>
                                            <li>
                                                ③ The Company notifies Members in advance via app
                                                push or email 30 days before the Popcorn validity
                                                period expires.
                                            </li>
                                            <li>
                                                ④ Popcorn past its validity period expires; where
                                                applicable laws provide otherwise, such laws
                                                prevail.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 17 (Use of Popcorn)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① Popcorn may be used for purposes determined by the
                                                Company, such as content purchases
                                                (rental·ownership), creator support (donations), and
                                                participatory voting.
                                            </li>
                                            <li>
                                                ② Popcorn granted free of charge (promotional
                                                Popcorn) is deducted and used before paid Popcorn.
                                            </li>
                                            <li>
                                                ③ Due to the nature of digital goods, Popcorn and
                                                content usage rights purchased with Popcorn cannot
                                                be exchanged for other goods.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 18 (Withdrawal of Subscription and Refund)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① A Member may withdraw the subscription and receive
                                                a full refund within 7 days from the date of
                                                purchase, limited to unused paid Popcorn. Where
                                                Popcorn has been partially used, a refund may be
                                                received only for the unused balance.
                                            </li>
                                            <li>
                                                ② Popcorn granted free of charge (promotional
                                                Popcorn) is excluded from refunds.
                                            </li>
                                            <li>
                                                ③ Content usage rights purchased with Popcorn may be
                                                canceled within 7 days from the date of purchase,
                                                before content playback begins, and the used Popcorn
                                                is returned to the account. However, once content
                                                playback has begun, the provision of digital content
                                                is deemed to have started, and withdrawal of
                                                subscription may be restricted.
                                            </li>
                                            <li>
                                                ④ Notwithstanding the proviso of Paragraph 3, where
                                                the content differs from its description or
                                                advertisement, or does not play normally due to
                                                reasons attributable to the Company, the return of
                                                Popcorn or a refund is possible.
                                            </li>
                                            <li>
                                                ⑤ Refunds are processed in accordance with
                                                applicable laws such as the Act on Consumer
                                                Protection in Electronic Commerce, in principle
                                                refunded to the original payment method, and
                                                processed within 3 to 5 business days from the date
                                                the request is received.
                                            </li>
                                            <li>
                                                ⑥ Refund requests can be made through customer
                                                support (aim@aimworks.co.kr) or the refund request
                                                function on My Page.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 19 (Handling of Popcorn upon Service Termination)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① Where the Service is permanently terminated due to
                                                reasons attributable to the Company, the Company
                                                notifies the scheduled termination date at least 60
                                                days in advance via email, in-service announcements,
                                                etc.
                                            </li>
                                            <li>
                                                ② The Company guarantees a period of at least 90
                                                days from the date of the service termination
                                                announcement during which Popcorn can be used, and
                                                fully refunds any unused Popcorn balance within that
                                                period.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">
                                Chapter 5 Obligations of Members and the Company
                            </p>
                            <ul>
                                <li>
                                    <p>Article 20 (Obligations of the Company)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The Company does not engage in acts prohibited by
                                                applicable laws and these Terms, and endeavors to
                                                provide the Service continuously and stably.
                                            </li>
                                            <li>
                                                ② To protect Members' personal information, the
                                                Company establishes, discloses, and complies with
                                                the Privacy Policy (Part 2).
                                            </li>
                                            <li>
                                                ③ Where a Member's opinion or complaint regarding
                                                service use is deemed justified, the Company
                                                processes it without delay.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 21 (Member's Obligations and Prohibited Acts)</p>
                                    <div>
                                        Members must not engage in any of the following acts.
                                        <ul>
                                            <li>1. Fraudulently using another person's account</li>
                                            <li>
                                                2. Acquiring Popcorn or usage rights by a method not
                                                determined by the Company, or fraudulently using
                                                them
                                            </li>
                                            <li>
                                                3. Posting content that synthesizes another person's
                                                face or voice without consent (deepfakes)
                                            </li>
                                            <li>
                                                4. Posting child or youth sexual exploitation
                                                material or other illegal content
                                            </li>
                                            <li>
                                                5. Infringing on the intellectual property rights of
                                                others, such as copyrights
                                            </li>
                                            <li>
                                                6. Reproducing, distributing, or commercially using
                                                information obtained through the Service without the
                                                Company's prior consent
                                            </li>
                                            <li>
                                                7. Other acts that violate applicable laws or these
                                                Terms
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 22 (Management of Postings)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The rights and responsibilities for postings
                                                (comments, reviews, etc.) that a Member posts within
                                                the Service belong to the Member who posted them.
                                            </li>
                                            <li>
                                                ② Where the Company determines that a posting
                                                violates Article 21 or applicable laws, it may
                                                delete the posting or take temporary measures
                                                without prior notice.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">
                                Chapter 6 Termination, Damages, and Dispute Resolution
                            </p>
                            <ul>
                                <li>
                                    <p>Article 23 (Use Restriction and Termination)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① Where a Member violates these Terms, the Company
                                                may take measures such as a warning, temporary
                                                suspension of use, or permanent suspension of use
                                                (forced withdrawal).
                                            </li>
                                            <li>
                                                ② In the case of serious violations (posting illegal
                                                content, fraudulent payment use, etc.), the Company
                                                may immediately restrict use without prior notice.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 24 (Damages and Disclaimer)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The Company is not liable for damages arising from
                                                causes without the Company's intent or negligence,
                                                such as force majeure or reasons attributable to the
                                                Member.
                                            </li>
                                            <li>
                                                ② Where a Member causes damage to the Company or a
                                                third party by violating these Terms, the Member
                                                bears responsibility for it.
                                            </li>
                                            <li>
                                                ③ The Company has no obligation to intervene in
                                                disputes arising through the Service between
                                                Members, or between a Member and a creator or third
                                                party, and is not liable for any resulting damage.
                                                However, cases involving the Company's intent or
                                                gross negligence are exceptions.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 25 (Dispute Resolution Procedure)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① The Company and Members endeavor to amicably
                                                resolve disputes arising in connection with service
                                                use.
                                            </li>
                                            <li>
                                                ② In the event of a dispute, resolution may be
                                                attempted through the following procedure.
                                                <ul>
                                                    <li>
                                                        Step 1: Customer support 1:1 inquiry
                                                        (aim@aimworks.co.kr) — target processing
                                                        within 3 business days of receipt
                                                    </li>
                                                    <li>
                                                        Step 2: Internal grievance handling
                                                        procedure — target processing within 10 days
                                                        of receipt
                                                    </li>
                                                    <li>
                                                        Step 3: Application for mediation to the
                                                        Korea Consumer Agency or the Electronic
                                                        Commerce Dispute Mediation Committee
                                                    </li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>Article 26 (Jurisdiction and Governing Law)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① Litigation regarding disputes between the Company
                                                and Members is, in principle, filed with the
                                                competent court under the Civil Procedure Act;
                                                however, by agreement between the Company and the
                                                Member, the court having jurisdiction over the
                                                location of the Company's head office may be
                                                designated as the competent court.
                                            </li>
                                            <li>
                                                ② The laws of the Republic of Korea apply to
                                                litigation filed between the Company and Members.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">Addendum</p>
                            <ul>
                                <li>
                                    <p>Article 1 (Effective Date)</p>
                                    <div>These Terms take effect on August 8, 2026.</div>
                                </li>
                            </ul>
                            <p className="sub_tit">Company Information</p>
                            <ul>
                                <li>
                                    <div>Company Name: STUDIO AIM INC. (주식회사 스튜디오에임)</div>
                                </li>
                                <li>
                                    <div>Representative: Lee Mu-shin</div>
                                </li>
                                <li>
                                    <div>
                                        Head Office: 202-1402, 18 Bucheon-ro 198beon-gil, Wonmi-gu,
                                        Bucheon-si, Gyeonggi-do (Chunui-dong, Chunui Techno Park 2)
                                    </div>
                                </li>
                                <li>
                                    <div>Corporate Registration Number: 110111-8669454</div>
                                </li>
                                <li>
                                    <div>Business Registration Number: 602-86-03127</div>
                                </li>
                                <li>
                                    <div>
                                        Mail-Order Sales Registration Number: 2026-Bucheon
                                        Wonmi-1442
                                    </div>
                                </li>
                                <li>
                                    <div>Phone: +82-70-7636-1117</div>
                                </li>
                                <li>
                                    <div>
                                        Email (inquiries·customer support): aim@aimworks.co.kr
                                    </div>
                                </li>
                            </ul>
                        </>
                    ) : (
                        <>
                            <p className="sub_tit">제1장 총칙</p>
                            <ul>
                                <li>
                                    <p>제1조&#40;목적&#41;</p>
                                    <div>
                                        본 약관은 주식회사 스튜디오에임(이하 "회사")이 운영하는 AI
                                        영상 OTT 서비스 "AIMMOVIE"(이하 "서비스")의 이용과 관련하여
                                        회사와 이용자 간의 권리, 의무 및 책임사항, 팝콘(Popcorn)
                                        크레딧의 구매·사용·환불 조건을 규정함을 목적으로 합니다.
                                    </div>
                                </li>
                                <li>
                                    <p>제2조&#40;용어의 정의&#41;</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① "서비스"란 회사가 운영하는 aimmovie.com 및 관련
                                                웹/앱/스마트TV 등을 통해 AI로 제작되었거나 AI 도구를
                                                활용해 제작된 영상 콘텐츠를 제공하는 일체의 서비스를
                                                말합니다.
                                            </li>
                                            <li>
                                                ② "회원"이란 본 약관에 동의하고 서비스 이용계약을
                                                체결한 자를 말합니다.
                                            </li>
                                            <li>
                                                ③ "크리에이터"란 서비스에 콘텐츠를 등록·제공하는
                                                자로서, 별도의 크리에이터 계약(저작물 위탁계약 등)을
                                                체결한 회원을 말합니다. 크리에이터에 관한 사항은
                                                해당 별도 계약이 본 약관에 우선하여 적용됩니다.
                                            </li>
                                            <li>
                                                ④ "콘텐츠"란 서비스 내에서 제공되는 영상, 이미지,
                                                텍스트 등 일체의 저작물을 말합니다.
                                            </li>
                                            <li>
                                                ⑤ "AI 생성 콘텐츠"란 생성형 AI를 이용하여 전부 또는
                                                일부가 제작된 콘텐츠를 말합니다.
                                            </li>
                                            <li>
                                                ⑥ "팝콘(Popcorn)"이란 회원이 서비스 내 콘텐츠 구매,
                                                크리에이터 응원(도네이션), 참여형 투표 등에 사용할
                                                수 있도록 회사가 발행하는 서비스 전용 유상·무상
                                                크레딧을 말합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제3조 &#40;약관의 게시 및 개정&#41;</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록
                                                서비스 초기화면 또는 연결화면에 게시합니다.
                                            </li>
                                            <li>
                                                ② 회사는 관계 법령을 위반하지 않는 범위에서 본
                                                약관을 개정할 수 있으며, 개정 시 적용일자 및
                                                개정사유를 명시하여 적용일 최소 7일 전(회원에게
                                                불리한 변경은 30일 전)부터 공지합니다.
                                            </li>
                                            <li>
                                                ③ 회원이 개정약관의 적용일 이후에도 서비스를 계속
                                                이용하는 경우 개정약관에 동의한 것으로 봅니다.
                                                개정약관에 동의하지 않는 회원은 이용계약을
                                                해지(회원탈퇴)할 수 있습니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제4조 &#40;약관 외 준칙&#41;</p>
                                    <div>
                                        본 약관에서 정하지 않은 사항은 전자상거래 등에서의
                                        소비자보호에 관한 법률, 콘텐츠산업진흥법, 정보통신망
                                        이용촉진 및 정보보호 등에 관한 법률, 개인정보 보호법,
                                        전자금융거래법 등 관계 법령 및 회사가 별도로 정한 세부
                                        이용지침에 따릅니다.
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">제2장 이용계약 체결 및 회원관리</p>
                            <ul>
                                <li>
                                    <p>제5조&#40;이용계약의 체결&#41;</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 이용계약은 이용자가 본 약관에 동의하고 회사가 정한
                                                절차(SNS 소셜 로그인 등 간편가입 포함)에 따라 가입을
                                                신청하고, 회사가 이를 승낙함으로써 체결됩니다.
                                            </li>
                                            <li>
                                                ② 회사는 다음 각 호에 해당하는 가입신청에 대해서는
                                                승낙을 유보하거나 거절할 수 있습니다.
                                                <ul>
                                                    <li>1. 타인의 명의를 도용한 경우</li>
                                                    <li>2. 허위 정보를 기재한 경우</li>
                                                    <li>
                                                        3. 만 14세 미만 아동이 법정대리인의 동의
                                                        없이 가입을 신청한 경우
                                                    </li>
                                                    <li>
                                                        4. 그 밖에 회사가 정한 이용신청 요건을
                                                        충족하지 못한 경우
                                                    </li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제6조(미성년자 보호)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 만 14세 미만 아동은 법정대리인의 동의 없이
                                                서비스에 가입할 수 없습니다.
                                            </li>
                                            <li>
                                                ② 만 14세 이상 19세 미만 회원이 팝콘을 유상으로
                                                결제하는 경우, 회사는 법정대리인의 동의 여부를
                                                확인하는 절차를 둘 수 있습니다.
                                            </li>
                                            <li>
                                                ③ 청소년에게 유해한 콘텐츠는 성인 인증 절차를 거친
                                                회원에게만 제공됩니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제7조(회원정보의 변경 및 관리)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회원은 개인정보 관리화면을 통해 자신의 정보를
                                                열람하고 수정할 수 있습니다.
                                            </li>
                                            <li>
                                                ② 회원은 아이디, 비밀번호 등 계정정보를 선량한
                                                관리자의 주의로 관리하여야 하며, 이를 제3자에게
                                                이용하게 해서는 안 됩니다.
                                            </li>
                                            <li>
                                                ③ 회원은 등록사항의 변경이 있는 경우 즉시 회사에 그
                                                변경사항을 알려야 합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제8조(회원 탈퇴 및 자격 상실)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회원은 언제든지 서비스 내 절차를 통해 이용계약
                                                해지(탈퇴)를 요청할 수 있으며, 회사는 관계 법령이
                                                정한 바에 따라 이를 즉시 처리합니다.
                                            </li>
                                            <li>
                                                ② 회사는 회원이 제21조(회원의 의무 및 금지행위)를
                                                위반한 경우 사전 통지 후 이용계약을 해지하거나
                                                서비스 이용을 제한할 수 있습니다. 다만, 긴급히
                                                조치할 필요가 있는 경우에는 사후 통지할 수 있습니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">제3장 서비스의 제공</p>
                            <ul>
                                <li>
                                    <p>제9조(서비스의 내용)</p>
                                    <div>
                                        회사가 제공하는 서비스는 다음 각 호와 같습니다.
                                        <ul>
                                            <li>1. AI 영상 콘텐츠의 스트리밍 제공(대여·소장)</li>
                                            <li>
                                                2. 팝콘을 통한 콘텐츠 구매, 크리에이터
                                                응원(도네이션)
                                            </li>
                                            <li>
                                                3. 이용자 참여형 기능(Remix &amp; Play 투표,
                                                Prompted Universe 참여 등 회사가 정하는 참여형
                                                서비스)
                                            </li>
                                            <li>
                                                4. 그 밖에 회사가 추가로 개발하거나 제휴를 통해
                                                제공하는 서비스
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제10조(서비스 이용시간 및 중지)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 서비스는 연중무휴, 1일 24시간 제공을 원칙으로
                                                합니다. 다만, 설비 점검 등 회사가 필요하다고
                                                인정하는 경우 서비스 제공을 일시 중지할 수 있습니다.
                                            </li>
                                            <li>
                                                ② 회사의 귀책사유로 서비스가 중단되어 회원에게
                                                손해가 발생한 경우, 회사는 관계 법령 및 제19조에
                                                따라 보상합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제11조(AI 생성 콘텐츠 표시)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사는 「인공지능 기본법」에 따라 서비스 내 AI
                                                생성 콘텐츠에 대하여 AI가 생성하였거나 AI 도구를
                                                활용하여 제작되었음을 콘텐츠 정보 화면 등에
                                                표시합니다.
                                            </li>
                                            <li>
                                                ② 회사는 콘텐츠의 AI 활용 정도(전체 AI 생성 / AI
                                                활용 제작 / 인간 창작+AI 보조 등)를 구분하여 표시할
                                                수 있습니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제12조(콘텐츠 등급분류 및 연령제한)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사는 관계 법령에 따라 콘텐츠에 이용연령
                                                기준(전체이용가, 12세, 15세, 19세 등)을 표시하고,
                                                연령제한 콘텐츠는 연령 확인 절차를 거친 회원에게만
                                                제공합니다.
                                            </li>
                                            <li>
                                                ② 회사는 「영화 및 비디오물의 진흥에 관한 법률」 등
                                                관계 법령에 따른 등급분류 의무를 준수합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제13조(불법·유해 콘텐츠 관리)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사는 업로드되는 콘텐츠에 대해 자동 감지 및
                                                인력에 의한 검수 절차를 운영하며, 신고가 접수된
                                                콘텐츠는 접수 후 지체 없이(원칙적으로 24시간 이내)
                                                1차 검토를 완료합니다.
                                            </li>
                                            <li>
                                                ② 아동·청소년 성착취물 등 명백한 불법 콘텐츠가
                                                확인되는 경우 즉시 삭제하고 관계 수사기관에
                                                신고하며, 해당 게시자의 이용을 제한합니다.
                                            </li>
                                            <li>
                                                ③ 회사는 타인의 얼굴·음성을 동의 없이 합성한
                                                콘텐츠(딥페이크)의 게재를 금지하며, 확인 시 즉시
                                                삭제 및 계정 정지 조치를 합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">제4장 팝콘(Popcorn) 크레딧</p>
                            <ul>
                                <li>
                                    <p>제14조(팝콘의 성격)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 팝콘은 회사가 정하는 바에 따라 서비스 내 콘텐츠
                                                구매, 크리에이터 응원, 참여형 투표 등에 사용할 수
                                                있는 서비스 전용 크레딧입니다.
                                            </li>
                                            <li>
                                                ② 팝콘은 현금 또는 현금성 자산이 아니며, 이자가
                                                발생하지 않고, 회원 간 양도하거나 현금으로 환전할 수
                                                없습니다.
                                            </li>
                                            <li>
                                                ③ 팝콘의 기준 가치는 1팝콘 = 100원이며, 콘텐츠별
                                                구체적인 이용요금(대여가/소장가 등)은 서비스 내
                                                결제화면에 별도로 표시됩니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제15조(팝콘의 구매)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 팝콘은 신용카드, 체크카드, 간편결제, 그 밖에
                                                회사가 정하는 결제수단으로 구매할 수 있습니다.
                                            </li>
                                            <li>
                                                ② 팝콘은 결제 완료 후 즉시 회원 계정에 지급되며,
                                                구매·사용 내역은 마이페이지에서 확인할 수 있습니다.
                                            </li>
                                            <li>
                                                ③ 해외 이용자의 경우 외화 결제를 지원할 수 있으며,
                                                이 경우 결제 시점의 환율이 적용됩니다.
                                            </li>
                                            <li>
                                                ④ 회사는 신용카드 등 금융정보를 자체 서버에 저장하지
                                                않으며, 결제대행사(PG사)를 통해 처리합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제16조(팝콘의 유효기간)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 유상으로 구매한 팝콘의 유효기간은 구매일로부터
                                                5년입니다.
                                            </li>
                                            <li>
                                                ② 이벤트·프로모션 등을 통해 무상으로 지급된 팝콘의
                                                유효기간은 지급일로부터 90일이며, 콘텐츠 구매에만
                                                사용할 수 있고 응원(도네이션)에는 사용할 수
                                                없습니다.
                                            </li>
                                            <li>
                                                ③ 회사는 팝콘 유효기간 만료 30일 전, 회원에게 앱
                                                푸시 또는 이메일로 사전 안내합니다.
                                            </li>
                                            <li>
                                                ④ 유효기간이 지난 팝콘은 소멸되며, 관계 법령이 달리
                                                정하는 경우에는 그에 따릅니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제17조(팝콘의 사용)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 팝콘은 콘텐츠 구매(대여·소장), 크리에이터
                                                응원(도네이션), 참여형 투표 등 회사가 정하는 용도로
                                                사용할 수 있습니다.
                                            </li>
                                            <li>
                                                ② 무상으로 지급된 팝콘(프로모션 팝콘)은 유상
                                                팝콘보다 먼저 차감되어 사용됩니다.
                                            </li>
                                            <li>
                                                ③ 팝콘 및 팝콘으로 구매한 콘텐츠 이용권은 디지털
                                                상품의 특성상 다른 상품으로 교환할 수 없습니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제18조(청약철회 및 환불)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회원은 사용하지 않은 유상 팝콘에 한하여
                                                구매일로부터 7일 이내에 청약을 철회하고 전액
                                                환불받을 수 있습니다. 팝콘을 일부 사용한 경우에는
                                                미사용 잔액에 한하여 환불받을 수 있습니다.
                                            </li>
                                            <li>
                                                ② 무상으로 지급된 팝콘(프로모션 팝콘)은 환불
                                                대상에서 제외됩니다.
                                            </li>
                                            <li>
                                                ③ 팝콘으로 구매한 콘텐츠 이용권은 콘텐츠 재생을
                                                시작하기 전까지, 구매일로부터 7일 이내에 구매를
                                                취소할 수 있으며, 사용한 팝콘은 계정으로 반환됩니다.
                                                다만, 콘텐츠 재생이 시작된 경우에는 디지털콘텐츠
                                                제공이 개시된 것으로 보아 청약철회가 제한될 수
                                                있습니다.
                                            </li>
                                            <li>
                                                ④ 제3항 단서에도 불구하고, 콘텐츠의 내용이
                                                표시·광고와 다르거나 회사의 귀책사유로 정상적으로
                                                재생되지 않는 경우에는 팝콘 반환 또는 환불이
                                                가능합니다.
                                            </li>
                                            <li>
                                                ⑤ 환불은 전자상거래 등에서의 소비자보호에 관한 법률
                                                등 관계 법령에 따라 처리하며, 원칙적으로 최초
                                                결제수단으로 환불하고, 신청 접수일로부터 영업일 기준
                                                3~5일 이내에 처리합니다.
                                            </li>
                                            <li>
                                                ⑥ 환불 신청은 고객센터(aim@aimworks.co.kr) 또는
                                                마이페이지 내 환불 신청 기능을 통해 할 수 있습니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제19조(서비스 종료 시 팝콘 처리)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사의 귀책사유로 서비스가 영구적으로 종료되는
                                                경우, 회사는 종료 예정일을 최소 60일 전에 이메일,
                                                서비스 내 공지사항 등을 통해 고지합니다.
                                            </li>
                                            <li>
                                                ② 회사는 서비스 종료 공지일로부터 최소 90일간 팝콘을
                                                사용할 수 있는 기간을 보장하며, 해당 기간 내 미사용
                                                팝콘 잔액은 전액 환불합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">제5장 회원 및 회사의 의무</p>
                            <ul>
                                <li>
                                    <p>제20조(회사의 의무)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사는 관계 법령과 본 약관이 금지하는 행위를 하지
                                                않으며, 계속적·안정적으로 서비스를 제공하기 위해
                                                노력합니다.
                                            </li>
                                            <li>
                                                ② 회사는 회원의 개인정보를 보호하기 위해
                                                개인정보처리방침(제2부)을 수립·공개하고 이를
                                                준수합니다.
                                            </li>
                                            <li>
                                                ③ 회사는 서비스 이용과 관련한 회원의 의견이나 불만이
                                                정당하다고 인정되는 경우 지체 없이 처리합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제21조(회원의 의무 및 금지행위)</p>
                                    <div>
                                        회원은 다음 각 호의 행위를 하여서는 안 됩니다.
                                        <ul>
                                            <li>1. 타인의 계정을 부정하게 사용하는 행위</li>
                                            <li>
                                                2. 회사가 정하지 않은 방법으로 팝콘 또는 이용권을
                                                취득하거나 이를 부정 이용하는 행위
                                            </li>
                                            <li>
                                                3. 타인의 얼굴·음성을 동의 없이 합성한
                                                콘텐츠(딥페이크)를 게시하는 행위
                                            </li>
                                            <li>
                                                4. 아동·청소년 성착취물, 그 밖의 불법 콘텐츠를
                                                게시하는 행위
                                            </li>
                                            <li>5. 저작권 등 타인의 지식재산권을 침해하는 행위</li>
                                            <li>
                                                6. 서비스를 이용하여 얻은 정보를 회사의 사전 승낙
                                                없이 복제·배포·상업적으로 이용하는 행위
                                            </li>
                                            <li>
                                                7. 그 밖에 관계 법령 또는 본 약관에 위배되는 행위
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제22조(게시물의 관리)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회원이 서비스 내에 게시한 게시물(댓글, 리뷰 등)에
                                                대한 권리와 책임은 게시한 회원에게 있습니다.
                                            </li>
                                            <li>
                                                ② 회사는 게시물이 제21조를 위반하거나 관계 법령에
                                                위반된다고 판단되는 경우 사전 통지 없이 게시물을
                                                삭제하거나 임시 조치할 수 있습니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">제6장 계약해지, 손해배상 및 분쟁해결</p>
                            <ul>
                                <li>
                                    <p>제23조(이용제한 및 계약해지)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사는 회원이 본 약관을 위반한 경우, 경고, 일시적
                                                이용정지, 영구 이용정지(강제 탈퇴) 등의 조치를 취할
                                                수 있습니다.
                                            </li>
                                            <li>
                                                ② 중대한 위반(불법 콘텐츠 게시, 결제 부정이용 등)의
                                                경우 회사는 사전 통지 없이 즉시 이용을 제한할 수
                                                있습니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제24조(손해배상 및 면책)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사는 천재지변, 회원의 귀책사유 등 회사의 고의
                                                또는 과실이 없는 사유로 발생한 손해에 대해서는
                                                책임을 지지 않습니다.
                                            </li>
                                            <li>
                                                ② 회원이 본 약관을 위반하여 회사 또는 제3자에게
                                                손해를 발생시킨 경우, 해당 회원은 이에 대한 책임을
                                                부담합니다.
                                            </li>
                                            <li>
                                                ③ 회사는 회원 간, 또는 회원과 크리에이터·제3자 간에
                                                서비스를 매개로 발생한 분쟁에 대해 개입할 의무가
                                                없으며, 이로 인한 손해에 대해 책임을 지지 않습니다.
                                                다만 회사의 고의 또는 중과실이 있는 경우는 예외로
                                                합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제25조(분쟁해결 절차)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사와 회원은 서비스 이용과 관련하여 발생한 분쟁을
                                                원만하게 해결하기 위해 노력합니다.
                                            </li>
                                            <li>
                                                ② 분쟁 발생 시 다음 절차를 통해 해결을 시도할 수
                                                있습니다.
                                                <ul>
                                                    <li>
                                                        1단계: 고객센터 1:1 문의(aim@aimworks.co.kr)
                                                        — 접수 후 영업일 기준 3일 이내 처리 목표
                                                    </li>
                                                    <li>
                                                        2단계: 내부 고충처리 절차 — 접수 후 10일
                                                        이내 처리 목표
                                                    </li>
                                                    <li>
                                                        3단계: 한국소비자원 또는
                                                        전자거래분쟁조정위원회 조정 신청
                                                    </li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <p>제26조(재판관할 및 준거법)</p>
                                    <div>
                                        <ul>
                                            <li>
                                                ① 회사와 회원 간 분쟁에 관한 소송은 민사소송법상
                                                관할법원에 제기함을 원칙으로 하되, 회사와 회원 간
                                                합의로 회사의 본점 소재지를 관할하는 법원을
                                                관할법원으로 정할 수 있습니다.
                                            </li>
                                            <li>
                                                ② 회사와 회원 간 제기된 소송에는 대한민국 법을
                                                적용합니다.
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                            <p className="sub_tit">부칙</p>
                            <ul>
                                <li>
                                    <p>제1조(시행일)</p>
                                    <div>본 약관은 2026년 8월 8일부터 시행합니다.</div>
                                </li>
                            </ul>
                            <p className="sub_tit">회사 정보</p>
                            <ul>
                                <li>
                                    <div>상호: 주식회사 스튜디오에임 (STUDIO AIM INC.)</div>
                                </li>
                                <li>
                                    <div>대표자: 이무신</div>
                                </li>
                                <li>
                                    <div>
                                        본점 소재지: 경기도 부천시 원미구 부천로198번길 18, 202동
                                        1402호(춘의동, 춘의테크노파크2차)
                                    </div>
                                </li>
                                <li>
                                    <div>법인등록번호: 110111-8669454</div>
                                </li>
                                <li>
                                    <div>사업자등록번호: 602-86-03127</div>
                                </li>
                                <li>
                                    <div>통신판매업 신고번호: 제2026-부천원미-1442호</div>
                                </li>
                                <li>
                                    <div>전화: +82-70-7636-1117</div>
                                </li>
                                <li>
                                    <div>이메일(문의·고객센터 통합): aim@aimworks.co.kr</div>
                                </li>
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
