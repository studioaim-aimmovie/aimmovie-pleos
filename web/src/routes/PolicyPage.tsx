// 약관/개인정보.

import { useParams } from "@/compat/navigation";
import TermsOfService from "@/components/service";
import PrivacyPolicy from "@/components/privacy";

export default function PolicyPage() {
    const { type = "" } = useParams<{ type?: string }>();

    if (type === "service") return <TermsOfService />;
    if (type === "privacy") return <PrivacyPolicy />;
    return null;
}
