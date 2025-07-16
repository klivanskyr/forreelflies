'use client';

import Button from "@/components/buttons/Button"
import Input from "@/components/inputs/Input"
import Textarea from "@/components/Textarea"
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaPaperPlane } from "react-icons/fa"
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { toast } from 'sonner';

function Card({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) {
    return (
        <div className="bg-white p-8 shadow-xl rounded-xl border border-gray-100 w-full h-48 flex flex-col items-center justify-center text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-green-100 p-4 rounded-full mb-4">
                {icon}
            </div>
            <div className="flex flex-col items-center">
                <h2 className="text-lg font-semibold text-gray-600 mb-2">{title}</h2>
                <h2 className="text-xl font-bold text-gray-900">{content}</h2>
            </div>
        </div>
    )   
}

export default function Page() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            const errorMessage = 'Please fill in all required fields.';
            toast.error(errorMessage);
            setError(errorMessage);
            return;
        }

        setIsSubmitting(true);
        setError('');
        
        try {
            // Store in Firestore
            const docRef = await addDoc(collection(db, 'contactMessages'), {
                ...formData,
                timestamp: serverTimestamp(),
                status: 'new'
            });

            // Send email notification
            await emailjs.send(
                "service_67miukk",
                "template_2je91rh",
                {
                    from_name: formData.name,
                    from_email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    to_email: "forreelflies@gmail.com"
                },
                "gWJ3uFncMXWrKUMgw"
            );
            
            toast.success('Message sent successfully! We\'ll get back to you soon.');
            setSubmitSuccess(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
            
            // Reset success message after 5 seconds
            setTimeout(() => {
                setSubmitSuccess(false);
            }, 5000);
            
        } catch (error) {
            console.error('Error submitting message:', error);
            const errorMessage = 'Failed to send message. Please try again.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white text-gray-900 py-20 border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">CONTACT US</h1>
                    <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                        We'd love to hear from you! Get in touch with our team for any questions or support.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-16">
                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    <Card 
                        icon={<FaMapMarkerAlt className="w-8 h-8 text-green-600" />}
                        title="Based out of:" 
                        content="Monmouth County, New Jersey" 
                    />
                    <Card 
                        icon={<FaPhone className="w-8 h-8 text-green-600" />}
                        title="Phone:" 
                        content="+1 (732) 515-0892" 
                    />
                    <Card 
                        icon={<FaEnvelope className="w-8 h-8 text-green-600" />}
                        title="Email:" 
                        content="forreelflies@gmail.com" 
                    />
                </div>

                {/* Contact Form Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-green-600 text-white p-8 text-center">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <FaPaperPlane className="w-8 h-8" />
                            <h2 className="text-3xl md:text-4xl font-bold">SEND US A MESSAGE</h2>
                        </div>
                        <p className="text-lg opacity-90">
                            Have a question or need assistance? Fill out the form below and we'll get back to you as soon as possible.
                        </p>
                    </div>
                    
                    <div className="p-8 md:p-12">
                        {submitSuccess ? (
                            <div className="text-center py-8">
                                <div className="text-green-600 text-5xl mb-4">✓</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                                <p className="text-gray-600">Thank you for reaching out. We'll get back to you soon.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                                        <Input 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg transition-all duration-200" 
                                            type="text" 
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                        <Input 
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg transition-all duration-200" 
                                            type="email" 
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                                    <Input 
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg transition-all duration-200" 
                                        type="text" 
                                        placeholder="What's this about?"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                                    <Textarea 
                                        value={formData.message}
                                        onChange={(e) => handleInputChange({ target: { name: 'message', value: e.target.value } } as any)}
                                        className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg transition-all duration-200 min-h-32"
                                        placeholder="Tell us more about your inquiry..."
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-600 text-sm">{error}</div>
                                )}
                                
                                <div className="text-center pt-4">
                                    <Button 
                                        type="submit" 
                                        text={isSubmitting ? "Sending..." : "SUBMIT MESSAGE"}
                                        loading={isSubmitting}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                                    />
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}