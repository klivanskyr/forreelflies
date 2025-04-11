'use client'; 
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type ClassNamesProps = {
  wrapper?: string;
  parent?: string;
  hover?: string;
};

export default function HoverPopup({
  classNames = { wrapper: "", hover: "", parent: "" },
  hoverElement,
  children,
}: {
  classNames?: ClassNamesProps;
  hoverElement: JSX.Element;
  children: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const handleMouseOver = () => setIsHovered(true);
  const handleMouseOut = () => setIsHovered(false);

  return (
    <div className={`relative ${classNames.wrapper || ""}`}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className={`absolute top-full -left-[90%] z-50 ${classNames.hover || ""}`}
          >
            {hoverElement}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}