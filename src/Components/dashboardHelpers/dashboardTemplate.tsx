import { User } from "firebase/auth";
import DashboardSidebar from "./DashboardSidebar";

export default function DashboardTemplate({ children, user }: { children: React.ReactNode, user: User }) {
    return (
        <div className="flex flex-col w-full">
            <div className="flex flex-row w-full">
                
                <div className="flex flex-col border w-[20%] items-center gap-4">
                    <div className="flex flex-col items-center">
                        <h1 className="text-xl">LOGO</h1>
                        <h1 className="text-lg">{user.email}</h1>
                    </div>
                    <DashboardSidebar />
                </div>

                <div className="flex flex-col w-full">
                    {children}
                </div>

            </div>
        </div>
    )
}