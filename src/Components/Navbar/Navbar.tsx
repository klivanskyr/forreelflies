import NavigationHeader from "./NavigationHeader";
import ProfileHeader from "./ProfileHeader";

export default function Navbar() {
    return (
        <div className="flex flex-col justify-center border-b-[1px] border-gray-200">
            <ProfileHeader />
            <NavigationHeader />
        </div>
    )
}