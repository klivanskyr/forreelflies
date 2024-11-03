import NavigationHeader from "./NavigationHeader";
import ProfileHeader from "./ProfileHeader";

export default function Navbar() {
    return (
        <div className="flex flex-col justify-center">
            <ProfileHeader />
            <NavigationHeader />
        </div>
    )
}