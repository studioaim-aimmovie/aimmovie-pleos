import { useRouter } from "@/compat/navigation";
import { useEffect } from "react";
import { useT } from "@/i18n/LocaleProvider";

export default function Contact() {
    const router = useRouter();
    const t = useT();
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

            <div className="popup pt170">
                <div className="close_btn" onClick={closeClick}>
                    <span></span>
                    <span></span>
                </div>
                <div className="tit">
                    <p>Contact</p>
                    <p className="desc">{t("contact.desc")}</p>
                </div>
                <div className="scroll auto">
                    <table className="table_type2">
                        <thead>
                            <tr>
                                <th>{t("contact.col_field")}</th>
                                <th>{t("contact.col_email")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{t("contact.tech")}</td>
                                <td>
                                    <a href="mailto:yglee@aimworks.co.kr">yglee@aimworks.co.kr</a>
                                </td>
                            </tr>
                            <tr>
                                <td>{t("contact.creator")}</td>
                                <td>
                                    <a href="mailto:chaeeun@aimworks.co.kr">
                                        chaeeun@aimworks.co.kr
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td>{t("contact.partnership")}</td>
                                <td>
                                    <a href="mailto:aim@aimworks.co.kr">aim@aimworks.co.kr</a>
                                </td>
                            </tr>
                            <tr>
                                <td>{t("contact.ad")}</td>
                                <td>
                                    <a href="mailto:alex@aimworks.co.kr">alex@aimworks.co.kr</a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
