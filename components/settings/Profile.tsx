import ChangeBioForm from "./forms/ChangeBioForm";
import ChangeBirthdate from "./forms/ChangeBirthdate";
import ChangeLocationForm from "./forms/ChangeLocationForm";
import ChangeNameForm from "./forms/ChangeNameForm";
import ChangeUsernameForm from "./forms/ChangeUsernameForm";

const Profile = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChangeNameForm />
            <ChangeUsernameForm />
            <ChangeBioForm />
            <ChangeBirthdate />
            <ChangeLocationForm />
        </div>
    );
};

export default Profile;
