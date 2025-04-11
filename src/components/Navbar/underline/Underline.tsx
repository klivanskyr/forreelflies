import './underline.css';

export default function Underline({ children }: { children: React.ReactNode }) {
    return (
        <div className='relative'>
            <div className="underline-hover">
                {children}
            </div>
        </div>
    )
}