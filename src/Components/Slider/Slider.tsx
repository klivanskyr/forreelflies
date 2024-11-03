'use client'; 

import { useState } from "react";
import { motion } from "framer-motion";

export default function Slider({ children }: { children: React.ReactNode[] }) {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    
    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % children.length);
    };
    
    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + children.length) % children.length);
    };

    return (
        <div style={{ position: 'relative', width: '300px', height: '200px', overflow: 'hidden' }}>
          <motion.div
            key={currentIndex}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #ccc',
              borderRadius: '8px',
              fontSize: '24px',
            }}
          >
            {children[currentIndex]}
          </motion.div>
          <button onClick={handlePrev} style={{ position: 'absolute', left: '10px', top: '50%' }}>Prev</button>
          <button onClick={handleNext} style={{ position: 'absolute', right: '10px', top: '50%' }}>Next</button>
        </div>
      );
}