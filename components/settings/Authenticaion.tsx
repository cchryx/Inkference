import ChangePasswordForm from "./forms/ChangePasswordForm";
import ChangeSigninForm from "./forms/ChangeSigninForm";

type Props = {
    accounts: any[];
    hasPassword: boolean;
};

const Authentication = ({ accounts, hasPassword }: Props) => {
    return (
        <div className="space-y-5">
            <ChangePasswordForm hasPassword={hasPassword} />
            <ChangeSigninForm accounts={accounts} />
        </div>
    );
};

export default Authentication;
