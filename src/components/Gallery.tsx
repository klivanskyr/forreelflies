import React from "react";

export default function Gallery({ children }: { children: React.ReactNode }) {
    const childrenArray = React.Children.toArray(children);

    // Special case for 5 images
    if (childrenArray.length === 5) {
        return (
            <div className="flex flex-row gap-2 md:gap-4 h-full w-full relative">
                {/* Large image on the left */}
                <div className="w-1/2 relative">
                    {childrenArray[0]}
                </div>

                {/* 2x2 grid on the right */}
                <div className="w-1/2 grid grid-cols-2 gap-2 md:gap-4">
                    {childrenArray.slice(1).map((child, index) => (
                        <div key={index} className="relative aspect-square">
                            {child}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // For even number of images
    if (childrenArray.length % 2 === 0) {
        return (
            <div className="flex flex-wrap gap-2 md:gap-4 h-full w-full overflow-hidden">
                {childrenArray.map((child, index) => (
                    <div key={index} className="flex-1">
                        {child}
                    </div>
                ))}
            </div>
        );
    }

    // For other odd numbers of images
    return (
        <div className="flex flex-row gap-2 md:gap-4 h-full w-full relative">
            <div className="w-full relative">
                {childrenArray[0]}
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-4 w-full h-full relative">
                {childrenArray.slice(1).map((child, index) => (
                    <div key={index} className="h-full w-full relative">
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
}
