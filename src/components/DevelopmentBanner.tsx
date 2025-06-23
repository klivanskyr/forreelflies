'use client';

import { useState } from 'react';
import { FaExclamationTriangle, FaComment, FaTimes } from 'react-icons/fa';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Button from './buttons/Button';
import Input from './inputs/Input';
import Textarea from './Textarea';
import Modal from './modal/Modal';

export default function DevelopmentBanner() {
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackData, setFeedbackData] = useState({
        name: '',
        email: '',
        feedback: '',
        category: 'general'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFeedbackData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!feedbackData.feedback.trim()) {
            alert('Please provide your feedback before submitting.');
            return;
        }

        setIsSubmitting(true);
        
        try {
            await addDoc(collection(db, 'developmentFeedback'), {
                ...feedbackData,
                timestamp: serverTimestamp(),
                status: 'new'
            });
            
            setSubmitSuccess(true);
            setFeedbackData({ name: '', email: '', feedback: '', category: 'general' });
            
            setTimeout(() => {
                setShowFeedbackModal(false);
                setSubmitSuccess(false);
            }, 2000);
            
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Development Banner */}
            <div className="w-full bg-blue-50 border-b border-blue-100 text-blue-800 px-4 py-3">
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-sm md:text-base">
                            We're actively developing ForReelFlies and would love your input to make it better.
                        </span>
                    </div>
                    <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium"
                    >
                        <FaComment className="w-4 h-4" />
                        <span className="hidden sm:inline">Share Feedback</span>
                        <span className="sm:hidden">Feedback</span>
                    </button>
                </div>
            </div>

            {/* Feedback Modal */}
            <Modal open={showFeedbackModal} setOpen={setShowFeedbackModal}>
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Share Your Feedback</h2>
                        <button
                            onClick={() => setShowFeedbackModal(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>

                    {submitSuccess ? (
                        <div className="text-center py-8">
                            <div className="text-green-600 text-5xl mb-4">✓</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank you!</h3>
                            <p className="text-gray-600">Your feedback helps us improve ForReelFlies for everyone.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitFeedback} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name (Optional)
                                </label>
                                <Input
                                    type="text"
                                    name="name"
                                    value={feedbackData.name}
                                    onChange={handleInputChange}
                                    placeholder="Your name"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email (Optional)
                                </label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={feedbackData.email}
                                    onChange={handleInputChange}
                                    placeholder="your.email@example.com"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    What would you like to share?
                                </label>
                                <select
                                    name="category"
                                    value={feedbackData.category}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="general">General Feedback</option>
                                    <option value="bug">Something's Not Working</option>
                                    <option value="feature">Feature Suggestion</option>
                                    <option value="ui">Design Feedback</option>
                                    <option value="performance">Performance Issue</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Thoughts *
                                </label>
                                <Textarea
                                    value={feedbackData.feedback}
                                    onChange={(e) => handleInputChange({ target: { name: 'feedback', value: e.target.value } } as any)}
                                    placeholder="We'd love to hear your thoughts, suggestions, or any issues you've encountered..."
                                    className="w-full min-h-24"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    text="Cancel"
                                    onClick={() => setShowFeedbackModal(false)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700"
                                />
                                <Button
                                    type="submit"
                                    text={isSubmitting ? "Sending..." : "Send Feedback"}
                                    loading={isSubmitting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                />
                            </div>
                        </form>
                    )}
                </div>
            </Modal>
        </>
    );
} 