'use client';

import { useState, useEffect } from 'react';
import DashboardTemplate from "@/components/DashboradHelpers/DashboardTemplate";
import { useUser } from "@/contexts/UserContext";
import { uploadFileAndGetUrl } from "@/lib/firebase";
import Image from 'next/image';

type UserProfile = {
    username: string;
    email: string;
    phoneNumber: string;
    photoURL: string;
};

export default function Page() {
    const { user } = useUser();
    const [profile, setProfile] = useState<UserProfile>({
        username: '',
        email: '',
        phoneNumber: '',
        photoURL: '',
    });
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setProfile({
                username: user.username || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                photoURL: user.photoURL || '',
            });
            setLoading(false);
        }
    }, [user]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        setUploadingPhoto(true);
        try {
            const file = e.target.files[0];
            const url = await uploadFileAndGetUrl(file, `users/${user.uid}/profile_${Date.now()}`);
            setProfile(prev => ({ ...prev, photoURL: url }));
            setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to upload photo.' });
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const response = await fetch('/api/v1/user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    ...profile
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.error || 'Failed to update profile.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while updating profile.' });
        }
    };

    if (loading) {
        return (
            <DashboardTemplate>
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-lg">Loading...</div>
                </div>
            </DashboardTemplate>
        );
    }

    return (
        <DashboardTemplate>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>
                
                {message.text && (
                    <div className={`mb-4 p-4 rounded-lg ${
                        message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Photo Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Profile Photo</h2>
                        <div className="flex items-center gap-6">
                            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                                {profile.photoURL ? (
                                    <Image
                                        src={profile.photoURL}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                        <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    id="photo-upload"
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className="inline-block bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer"
                                >
                                    {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                                </label>
                                <p className="mt-1 text-xs text-gray-500">
                                    JPG, PNG or GIF (max. 2MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Account Information Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={profile.username}
                                    onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={profile.email}
                                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={profile.phoneNumber}
                                    onChange={(e) => setProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </DashboardTemplate>
    );
}