import React from "react";

export default function Gallery({ children }: { children: React.ReactNode }) {
    const childrenArray = React.Children.toArray(children);

    if (childrenArray.length % 2 === 0) {
        return (
            <div className="flex flex-wrap gap-4 h-[500px] w-full overflow-hidden">
                {childrenArray.map((child, index) => (
                    <div key={index} className="flex-1">
                        {child}
                    </div>
                ))}
            </div>
        );
    } else {
        return (
            <div className="flex flex-row gap-4 h-[450px] 2xl:h-[500px] w-full relative">
                <div className="w-full relative">
                    {childrenArray[0]}
                </div>

                <div className="grid grid-cols-2 gap-4 w-full h-full relative">
                    {childrenArray.slice(1).map((child, index) => (
                        <div key={index} className="h-full w-full relative">
                            {child}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
