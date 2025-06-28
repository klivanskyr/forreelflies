'use client';

import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { DbUser } from "@/lib/firebase-admin";
import { Vendor } from "@/app/types/types";
import { uploadFileAndGetUrl } from "@/lib/firebase";
import Image from 'next/image';
import { useSession } from "next-auth/react";

export default function Page() {
    const { data: session } = useSession();
    const { user } = useUser();
    const [vendor, setVendor] = useState<Vendor | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Store Profile');
    
    // Store Profile states
    const [bannerImageUrl, setBannerImageUrl] = useState("");
    const [profileImageUrl, setProfileImageUrl] = useState("");
    const [bio, setBio] = useState("");
    const [socialLinks, setSocialLinks] = useState<Array<{type: string, url: string}>>([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingProfile, setUploadingProfile] = useState(false);
    
    // Theme settings states
    const [settings, setSettings] = useState({
        theme: {
            primaryColor: '#16a34a',
            secondaryColor: '#059669',
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            accentColor: '#3b82f6',
        },
        layout: {
            headerStyle: 'modern',
            footerStyle: 'simple',
            productGrid: '3-column',
            showSidebar: true,
            stickyHeader: true,
        },
        branding: {
            storeLogo: '',
            storeBanner: '',
            favicon: '',
            brandingText: 'Premium Fly Fishing Equipment',
            showBrandingText: true,
        },
        homepage: {
            heroSection: true,
            featuredProducts: true,
            testimonials: true,
            newsletter: true,
            socialMedia: true,
        }
    });

    useEffect(() => {
        const getVendor = async (user: DbUser) => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor?userId=${user.uid}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
        
                if (!response.ok) {
                    return undefined;
                } else {
                    const data = await response.json();
                    return data.vendor as Vendor;
                }
            } catch (error) {
                console.error('Error fetching vendor:', error);
                return undefined;
            }
        }

        if (user) {
            getVendor(user).then((data) => {
                if (data) {
                    setVendor(data);
                    // Initialize store profile states - use type assertion for optional properties
                    setBannerImageUrl((data as any).bannerImageUrl || "");
                    setProfileImageUrl((data as any).profileImageUrl || "");
                    setBio((data as any).bio || "");
                    setSocialLinks((data as any).socialLinks || []);
                }
                setLoading(false);
            });
        }
    }, [user]);

    const tabs = ['Store Profile', 'Theme', 'Layout', 'Branding', 'Homepage'];

    const handleSettingChange = (category: string, key: string, value: any) => {
        setSettings(prev => {
            const categoryData = prev[category as keyof typeof prev] as any;
            return {
                ...prev,
                [category]: {
                    ...categoryData,
                    [key]: value
                }
            };
        });
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !vendor) return;
        setUploadingBanner(true);
        const file = e.target.files[0];
        const url = await uploadFileAndGetUrl(file, `vendors/${vendor.id}/banner_${Date.now()}`);
        setBannerImageUrl(url);
        setUploadingBanner(false);
    };

    const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !vendor) return;
        setUploadingProfile(true);
        const file = e.target.files[0];
        const url = await uploadFileAndGetUrl(file, `vendors/${vendor.id}/profile_${Date.now()}`);
        setProfileImageUrl(url);
        setUploadingProfile(false);
    };

    const handleSaveProfile = async () => {
        if (!vendor) return;
        setSaving(true);
        setMessage("");
        const res = await fetch(`/api/v1/vendor`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                vendorId: vendor.id,
                bannerImageUrl,
                profileImageUrl,
                bio,
                socialLinks,
            }),
        });
        if (res.ok) {
            setMessage("Profile updated successfully!");
        } else {
            setMessage("Failed to update profile");
        }
        setSaving(false);
    };

    const colorPresets = [
        { name: 'Forest Green', primary: '#16a34a', secondary: '#059669' },
        { name: 'Ocean Blue', primary: '#0ea5e9', secondary: '#0284c7' },
        { name: 'Sunset Orange', primary: '#ea580c', secondary: '#dc2626' },
        { name: 'Royal Purple', primary: '#9333ea', secondary: '#7c3aed' },
        { name: 'Charcoal Gray', primary: '#374151', secondary: '#4b5563' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greenPrimary"></div>
                    <p className="text-gray-600">Loading vendor information...</p>
                </div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor not found</h1>
                    <p className="text-gray-600">Unable to load vendor information. Please try again later.</p>
                </div>
            </div>
        )
    }

    const renderTabContent = () => {
        // Add a wrapper for unavailable features
        const UnavailableFeatureWrapper = ({ children }: { children: React.ReactNode }) => (
            <div className="relative">
                <div className="opacity-50 pointer-events-none">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium">
                        Coming Soon
                    </span>
                </div>
            </div>
        );

        switch (activeTab) {
            case 'Store Profile':
                return (
                    <UnavailableFeatureWrapper>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                                {bannerImageUrl && (
                                    <div className="mb-4 relative w-full h-48">
                                        <Image 
                                            src={bannerImageUrl} 
                                            alt="Banner" 
                                            fill
                                            className="object-cover rounded-lg border"
                                            sizes="(max-width: 1200px) 100vw, 1200px"
                                        />
                                    </div>
                                )}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="mt-2 text-sm text-gray-600">Upload your store banner image</p>
                                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" id="banner-upload" />
                                    <label htmlFor="banner-upload" className="mt-2 inline-block bg-greenPrimary text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors cursor-pointer">
                                        Choose File
                                    </label>
                                    {uploadingBanner && <p className="mt-2 text-sm text-gray-500">Uploading...</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                                {profileImageUrl && (
                                    <div className="mb-4 relative w-32 h-32">
                                        <Image 
                                            src={profileImageUrl} 
                                            alt="Profile" 
                                            fill
                                            className="rounded-full object-cover border-4 border-white shadow-lg"
                                            sizes="128px"
                                        />
                                    </div>
                                )}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="mt-2 text-sm text-gray-600">Upload your store profile image</p>
                                    <input type="file" accept="image/*" onChange={handleProfileUpload} className="hidden" id="profile-upload" />
                                    <label htmlFor="profile-upload" className="mt-2 inline-block bg-greenPrimary text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors cursor-pointer">
                                        Choose File
                                    </label>
                                    {uploadingProfile && <p className="mt-2 text-sm text-gray-500">Uploading...</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Store Bio</label>
                                <textarea 
                                    value={bio} 
                                    onChange={(e) => setBio(e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                    rows={4}
                                    placeholder="Tell customers about your store..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Social Links</label>
                                <div className="space-y-3">
                                    {socialLinks.map((link, i) => (
                                        <div key={i} className="flex gap-3">
                                            <select
                                                value={link.type}
                                                onChange={(e) => {
                                                    const newLinks = [...socialLinks];
                                                    newLinks[i].type = e.target.value;
                                                    setSocialLinks(newLinks);
                                                }}
                                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent w-1/3"
                                            >
                                                <option value="">Select Platform</option>
                                                <option value="Instagram">Instagram</option>
                                                <option value="Facebook">Facebook</option>
                                                <option value="Twitter">Twitter</option>
                                                <option value="YouTube">YouTube</option>
                                                <option value="TikTok">TikTok</option>
                                                <option value="Website">Website</option>
                                            </select>
                                            <input
                                                value={link.url}
                                                onChange={(e) => {
                                                    const newLinks = [...socialLinks];
                                                    newLinks[i].url = e.target.value;
                                                    setSocialLinks(newLinks);
                                                }}
                                                placeholder="Enter URL"
                                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent flex-1"
                                            />
                                            <button 
                                                onClick={() => setSocialLinks(socialLinks.filter((_, j) => j !== i))} 
                                                className="text-red-500 hover:text-red-700 px-3 py-2"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => setSocialLinks([...socialLinks, { type: "", url: "" }])} 
                                        className="text-greenPrimary hover:text-green-600 font-medium"
                                    >
                                        + Add Social Link
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t">
                                <div>
                                    {message && (
                                        <div className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                                            {message}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={handleSaveProfile} 
                                    disabled={saving}
                                    className="bg-greenPrimary text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Profile"}
                                </button>
                            </div>
                        </div>
                    </UnavailableFeatureWrapper>
                );

            case 'Theme':
                return (
                    <UnavailableFeatureWrapper>
                        <div className="space-y-6">
                            {/* Color Presets */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Color Presets</h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {colorPresets.map((preset, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                handleSettingChange('theme', 'primaryColor', preset.primary);
                                                handleSettingChange('theme', 'secondaryColor', preset.secondary);
                                            }}
                                            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex space-x-2 mb-2">
                                                <div 
                                                    className="w-6 h-6 rounded"
                                                    style={{ backgroundColor: preset.primary }}
                                                ></div>
                                                <div 
                                                    className="w-6 h-6 rounded"
                                                    style={{ backgroundColor: preset.secondary }}
                                                ></div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">{preset.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Colors */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Colors</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={settings.theme.primaryColor}
                                                onChange={(e) => handleSettingChange('theme', 'primaryColor', e.target.value)}
                                                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={settings.theme.primaryColor}
                                                onChange={(e) => handleSettingChange('theme', 'primaryColor', e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={settings.theme.secondaryColor}
                                                onChange={(e) => handleSettingChange('theme', 'secondaryColor', e.target.value)}
                                                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={settings.theme.secondaryColor}
                                                onChange={(e) => handleSettingChange('theme', 'secondaryColor', e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={settings.theme.backgroundColor}
                                                onChange={(e) => handleSettingChange('theme', 'backgroundColor', e.target.value)}
                                                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={settings.theme.backgroundColor}
                                                onChange={(e) => handleSettingChange('theme', 'backgroundColor', e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={settings.theme.accentColor}
                                                onChange={(e) => handleSettingChange('theme', 'accentColor', e.target.value)}
                                                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={settings.theme.accentColor}
                                                onChange={(e) => handleSettingChange('theme', 'accentColor', e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
                                <div className="border rounded-lg p-6" style={{ backgroundColor: settings.theme.backgroundColor }}>
                                    <div 
                                        className="text-white p-4 rounded-lg mb-4"
                                        style={{ backgroundColor: settings.theme.primaryColor }}
                                    >
                                        <h4 className="font-bold">Header Preview</h4>
                                        <p>This is how your header will look</p>
                                    </div>
                                    <div className="space-y-2">
                                        <button 
                                            className="px-4 py-2 rounded text-white"
                                            style={{ backgroundColor: settings.theme.secondaryColor }}
                                        >
                                            Secondary Button
                                        </button>
                                        <button 
                                            className="px-4 py-2 rounded text-white ml-2"
                                            style={{ backgroundColor: settings.theme.accentColor }}
                                        >
                                            Accent Button
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </UnavailableFeatureWrapper>
                );

            case 'Layout':
                return (
                    <UnavailableFeatureWrapper>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Header Style</label>
                                    <select 
                                        value={settings.layout.headerStyle}
                                        onChange={(e) => handleSettingChange('layout', 'headerStyle', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                    >
                                        <option value="modern">Modern</option>
                                        <option value="classic">Classic</option>
                                        <option value="minimal">Minimal</option>
                                        <option value="bold">Bold</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Footer Style</label>
                                    <select 
                                        value={settings.layout.footerStyle}
                                        onChange={(e) => handleSettingChange('layout', 'footerStyle', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                    >
                                        <option value="simple">Simple</option>
                                        <option value="detailed">Detailed</option>
                                        <option value="minimal">Minimal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Grid</label>
                                    <select 
                                        value={settings.layout.productGrid}
                                        onChange={(e) => handleSettingChange('layout', 'productGrid', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                    >
                                        <option value="2-column">2 Columns</option>
                                        <option value="3-column">3 Columns</option>
                                        <option value="4-column">4 Columns</option>
                                        <option value="list">List View</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-gray-900">Show Sidebar</h3>
                                        <p className="text-sm text-gray-500">Display sidebar with categories and filters</p>
                                    </div>
                                    <button
                                        onClick={() => handleSettingChange('layout', 'showSidebar', !settings.layout.showSidebar)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-greenPrimary focus:ring-offset-2 ${
                                            settings.layout.showSidebar ? 'bg-greenPrimary' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                settings.layout.showSidebar ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-gray-900">Sticky Header</h3>
                                        <p className="text-sm text-gray-500">Keep header visible when scrolling</p>
                                    </div>
                                    <button
                                        onClick={() => handleSettingChange('layout', 'stickyHeader', !settings.layout.stickyHeader)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-greenPrimary focus:ring-offset-2 ${
                                            settings.layout.stickyHeader ? 'bg-greenPrimary' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                settings.layout.stickyHeader ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </UnavailableFeatureWrapper>
                );

            case 'Branding':
                return (
                    <UnavailableFeatureWrapper>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="mt-2 text-sm text-gray-600">Upload your store logo</p>
                                    <button className="mt-2 bg-greenPrimary text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                                        Choose File
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Store Banner</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="mt-2 text-sm text-gray-600">Upload banner image for homepage</p>
                                    <button className="mt-2 bg-greenPrimary text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                                        Choose File
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Branding Text</label>
                                <input
                                    type="text"
                                    value={settings.branding.brandingText}
                                    onChange={(e) => handleSettingChange('branding', 'brandingText', e.target.value)}
                                    placeholder="Enter your store tagline"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h3 className="font-medium text-gray-900">Show Branding Text</h3>
                                    <p className="text-sm text-gray-500">Display tagline below logo</p>
                                </div>
                                <button
                                    onClick={() => handleSettingChange('branding', 'showBrandingText', !settings.branding.showBrandingText)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-greenPrimary focus:ring-offset-2 ${
                                        settings.branding.showBrandingText ? 'bg-greenPrimary' : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            settings.branding.showBrandingText ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </UnavailableFeatureWrapper>
                );

            case 'Homepage':
                return (
                    <UnavailableFeatureWrapper>
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900">Homepage Sections</h3>
                            <div className="space-y-4">
                                {Object.entries(settings.homepage).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h3 className="font-medium text-gray-900 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {key === 'heroSection' && 'Large banner section at the top'}
                                                {key === 'featuredProducts' && 'Showcase your best products'}
                                                {key === 'testimonials' && 'Customer reviews and testimonials'}
                                                {key === 'newsletter' && 'Email subscription form'}
                                                {key === 'socialMedia' && 'Social media links and feeds'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleSettingChange('homepage', key, !value)}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-greenPrimary focus:ring-offset-2 ${
                                                value ? 'bg-greenPrimary' : 'bg-gray-200'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    value ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </UnavailableFeatureWrapper>
                );

            default:
                return <div>Tab not found</div>;
        }
    };

    return (
        <StoreManagerTemplate>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Storefront Customization</h1>
                    <div className="flex space-x-2">
                        <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                            Preview Store
                        </button>
                        <button className="bg-greenPrimary text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab
                                        ? 'border-greenPrimary text-greenPrimary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg shadow p-6">
                    {renderTabContent()}
                </div>
            </div>
        </StoreManagerTemplate>
    )
} 