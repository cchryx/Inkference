import type { LinkedAccount } from "@/actions/auth/getLinkedAccounts";
import ChangePasswordForm from "./forms/ChangePasswordForm";
import ChangeSigninForm from "./forms/ChangeSigninForm";

type Props = {
    accounts: LinkedAccount[];
    hasPassword: boolean;
    linkError?: string;
    linked?: string;
};

const Authentication = ({ accounts, hasPassword, linkError, linked }: Props) => {
    return (
        <div className="space-y-5">
            <ChangePasswordForm hasPassword={hasPassword} />
            <ChangeSigninForm
                accounts={accounts}
                linkError={linkError}
                linked={linked}
            />
        </div>
    );
};

export default Authentication;
