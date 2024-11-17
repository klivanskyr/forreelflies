import StoreManagerSidebar from "./StoreManagerSidebar";

export default function StoreManagerTemplate({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col w-full h-full border">
            <div className="w-full border">TOPBAR</div>
            <div className="flex flex-row w-full border">
                <StoreManagerSidebar className="border" />
                <div className="flex flex-col w-full border">{children}</div>
            </div>
        </div>
    )
}