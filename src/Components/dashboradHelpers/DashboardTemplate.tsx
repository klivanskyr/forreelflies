'use client';

import { useUser } from "@/contexts/UserContext";
import DashboardSidebar from "@/components/dashboradHelpers/DashboardSidebar";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
    const { user } = useUser();

    if (!user) {
        return <></>;
    }
    
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