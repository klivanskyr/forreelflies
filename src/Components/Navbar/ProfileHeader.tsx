import { TextLink } from "../Links";

export default function ProfileHeader() {
    return (
        <div className="flex flex-row justify-between bg-gray-100 px-32 py-2">
            <div className="flex flex-row gap-2">
                <h1>instagram</h1>
                <h1>facebook</h1>
            </div>
            <div>
                <TextLink text="Become A Vender" href="/vender-signup" />
            </div>
        </div>
    )
}