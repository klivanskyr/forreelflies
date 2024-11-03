import React from "react";

export default function Gallery({ children }: { children: React.ReactNode }) {
    const childrenArray = React.Children.toArray(children);

    if (childrenArray.length % 2 === 0) {
        return (
            <div className="flex flex-wrap gap-4">
                {childrenArray.map((child, index) => (
                    <div key={index} className="flex-1">
                        {child}
                    </div>
                ))}
            </div>
        );
    } else {
        return (
            <div className="flex flex-row gap-4">
                {/* First item spanning vertically */}
                <div className="w-full">
                    {childrenArray[0]}
                </div>

                {/* Remaining items in a 2x2 grid on the right */}
                <div className="grid grid-cols-2 gap-4 w-full h-full">
                    {childrenArray.slice(1).map((child, index) => (
                        <div key={index} className="h-full w-full">
                            {child}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
