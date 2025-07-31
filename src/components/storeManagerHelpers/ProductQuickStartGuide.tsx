"use client";

import React, { useState, useEffect } from "react";
import { FaArrowRight, FaCheckCircle } from "react-icons/fa";

const steps = [
	{
		selector: "[data-tour='products']",
		title: "Add Your First Product",
		description:
			"Click here to add a new product to your store. You can upload images, set pricing, and manage inventory.",
	},
	{
		selector: "[data-tour='orders']",
		title: "View Orders",
		description: "Track and manage all your customer orders from this section.",
	},
	{
		selector: "[data-tour='reviews']",
		title: "Check Reviews",
		description: "See what customers are saying about your products and respond to reviews.",
	},
	{
		selector: "[data-tour='payments']",
		title: "Manage Payments",
		description: "View your earnings and manage your Stripe payment setup here.",
	},
];

export default function ProductQuickStartGuide({ onClose }: { onClose: () => void }) {
	const [step, setStep] = useState(0);
	const [rect, setRect] = useState<DOMRect | null>(null);

	useEffect(() => {
		const el = document.querySelector(steps[step].selector);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
			setRect(el.getBoundingClientRect());
			el.classList.add("z-[1001]", "ring-4", "ring-green-400", "relative");
		}
		document.body.classList.add("tour-active");
		return () => {
			if (el) el.classList.remove("z-[1001]", "ring-4", "ring-green-400", "relative");
			document.body.classList.remove("tour-active");
		};
	}, [step]);

	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, []);

	if (!rect) return null;

	return (
		<>
			{/* Overlay */}
			<div
				className="fixed inset-0 bg-black bg-opacity-60 z-[1000] pointer-events-auto"
				style={{ pointerEvents: "auto" }}
			/>
			{/* Tooltip */}
			<div
				className="fixed z-[1002] bg-white rounded-lg shadow-xl p-6 max-w-xs border border-green-400"
				style={{
					top: rect.bottom + 16,
					left: Math.max(rect.left, 16),
				}}
			>
				<h2 className="text-lg font-bold mb-2 flex items-center gap-2">
					{step === steps.length - 1 ? <FaCheckCircle className="text-green-500" /> : null}
					{steps[step].title}
				</h2>
				<p className="text-gray-700 mb-4">{steps[step].description}</p>
				<div className="flex gap-2">
					{step > 0 && (
						<button
							className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
							onClick={() => setStep(step - 1)}
						>
							Back
						</button>
					)}
					{step < steps.length - 1 ? (
						<button
							className="px-4 py-1 rounded bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
							onClick={() => setStep(step + 1)}
						>
							Next <FaArrowRight />
						</button>
					) : (
						<button
							className="px-4 py-1 rounded bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
							onClick={onClose}
						>
							Finish <FaCheckCircle />
						</button>
					)}
				</div>
			</div>
			{/* Style for obscuring everything except highlighted */}
			<style jsx global>{`
				body.tour-active *:not(.z-\\[1001\\]) {
					pointer-events: none !important;
					filter: blur(2px) grayscale(0.5) opacity(0.5);
				}
				body.tour-active .z-\\[1001\\] {
					pointer-events: auto !important;
					filter: none !important;
				}
			`}</style>
		</>
	);
}
