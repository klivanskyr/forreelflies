import React, { useState } from "react";
import { createPortal } from "react-dom";

const steps = [
  {
    selector: '[data-tour="products"]',
    title: "Add Products",
    content: "Start by adding your first product. Click here to add and manage your products.",
  },
  {
    selector: '[data-tour="orders"]',
    title: "View Orders",
    content: "Track and manage your orders here.",
  },
  {
    selector: '[data-tour="reviews"]',
    title: "Reviews",
    content: "See what customers are saying about your products.",
  },
  {
    selector: '[data-tour="payments"]',
    title: "Payments",
    content: "Manage your payouts and payment settings here.",
  },
];

function getElementRect(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  };
}

const Overlay = ({ rect }: { rect: any }) => {
  if (!rect) return null;
  return (
    <>
      {/* Top */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: rect.top, background: "rgba(0,0,0,0.6)", zIndex: 1000 }} />
      {/* Bottom */}
      <div style={{ position: "absolute", top: rect.top + rect.height, left: 0, width: "100%", height: `calc(100% - ${rect.top + rect.height}px)`, background: "rgba(0,0,0,0.6)", zIndex: 1000 }} />
      {/* Left */}
      <div style={{ position: "absolute", top: rect.top, left: 0, width: rect.left, height: rect.height, background: "rgba(0,0,0,0.6)", zIndex: 1000 }} />
      {/* Right */}
      <div style={{ position: "absolute", top: rect.top, left: rect.left + rect.width, width: `calc(100% - ${rect.left + rect.width}px)`, height: rect.height, background: "rgba(0,0,0,0.6)", zIndex: 1000 }} />
    </>
  );
};

const Tooltip = ({ rect, title, content, onNext, onPrev, onClose, stepIndex, totalSteps }: any) => {
  if (!rect) return null;
  const style: React.CSSProperties = {
    position: "absolute",
    top: rect.top + rect.height + 12,
    left: rect.left,
    zIndex: 1100,
    background: "white",
    borderRadius: 8,
    boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
    padding: 24,
    minWidth: 280,
    maxWidth: 340,
  };
  return (
    <div style={style}>
      <div className="font-bold text-lg mb-2">{title}</div>
      <div className="mb-4 text-gray-700">{content}</div>
      <div className="flex justify-between items-center mt-4">
        <button onClick={onPrev} disabled={stepIndex === 0} className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-medium disabled:opacity-50">Back</button>
        <span className="text-xs text-gray-400">Step {stepIndex + 1} of {totalSteps}</span>
        {stepIndex < totalSteps - 1 ? (
          <button onClick={onNext} className="px-3 py-1 rounded bg-green-600 text-white font-medium">Next</button>
        ) : (
          <button onClick={onClose} className="px-3 py-1 rounded bg-green-600 text-white font-medium">Finish</button>
        )}
      </div>
    </div>
  );
};

export default function ProductQuickStartGuide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<any>(null);

  React.useEffect(() => {
    const updateRect = () => {
      const r = getElementRect(steps[step].selector);
      setRect(r);
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [step]);

  // Prevent background scroll
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!rect) return null;

  return createPortal(
    <>
      <Overlay rect={rect} />
      <Tooltip
        rect={rect}
        title={steps[step].title}
        content={steps[step].content}
        onNext={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
        onPrev={() => setStep((s) => Math.max(s - 1, 0))}
        onClose={onClose}
        stepIndex={step}
        totalSteps={steps.length}
      />
      {/* Close button in top right */}
      <button
        onClick={onClose}
        style={{ position: "fixed", top: 24, right: 24, zIndex: 1200 }}
        className="text-white bg-black bg-opacity-60 rounded-full w-10 h-10 flex items-center justify-center text-2xl hover:bg-opacity-80"
        aria-label="Close tour"
      >
        ×
      </button>
    </>,
    document.body
  );
}
