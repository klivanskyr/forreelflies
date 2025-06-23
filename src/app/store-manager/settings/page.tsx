'use client';

import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import { useState } from "react";

export default function Page() {
    const [activeTab, setActiveTab] = useState('General');
    const [settings, setSettings] = useState({
        storeName: 'My Fly Shop',
        storeDescription: 'Premium fly fishing equipment and accessories',
        email: 'store@example.com',
        phone: '(555) 123-4567',
        address: '123 Main St, Fishtown, MT 59718',
        notifications: {
            orderUpdates: true,
            customerMessages: true,
            lowStock: true,
            promotions: false,
        },
        shipping: {
            freeShippingThreshold: 50,
            standardRate: 5.99,
            expressRate: 12.99,
        }
    });

    const tabs = ['General', 'Notifications', 'Shipping', 'Payment', 'Security'];

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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'General':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                            <input
                                type="text"
                                value={settings.storeName}
                                onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Store Description</label>
                            <textarea
                                value={settings.storeDescription}
                                onChange={(e) => setSettings(prev => ({ ...prev, storeDescription: e.target.value }))}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={settings.phone}
                                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <input
                                type="text"
                                value={settings.address}
                                onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                            />
                        </div>
                    </div>
                );
            case 'Notifications':
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            {Object.entries(settings.notifications).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-gray-900 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleSettingChange('notifications', key, !value)}
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
                );
            case 'Shipping':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold ($)</label>
                            <input
                                type="number"
                                value={settings.shipping.freeShippingThreshold}
                                onChange={(e) => handleSettingChange('shipping', 'freeShippingThreshold', Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Standard Shipping Rate ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settings.shipping.standardRate}
                                    onChange={(e) => handleSettingChange('shipping', 'standardRate', Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Express Shipping Rate ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settings.shipping.expressRate}
                                    onChange={(e) => handleSettingChange('shipping', 'expressRate', Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'Payment':
                return (
                    <div className="space-y-6">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <p className="text-sm text-green-800">Stripe Connect is active and configured</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-medium text-gray-900">Payment Methods</h3>
                                <p className="text-sm text-gray-500 mb-3">Configure accepted payment methods</p>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input type="checkbox" defaultChecked className="mr-2" />
                                        Credit Cards (Visa, MasterCard, Amex)
                                    </label>
                                    <label className="flex items-center">
                                        <input type="checkbox" defaultChecked className="mr-2" />
                                        PayPal
                                    </label>
                                    <label className="flex items-center">
                                        <input type="checkbox" className="mr-2" />
                                        Apple Pay
                                    </label>
                                    <label className="flex items-center">
                                        <input type="checkbox" className="mr-2" />
                                        Google Pay
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'Security':
                return (
                    <div className="space-y-6">
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">Password</h3>
                            <p className="text-sm text-gray-500 mb-4">Update your account password</p>
                            <button className="bg-greenPrimary text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                                Change Password
                            </button>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-500 mb-4">Add an extra layer of security to your account</p>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                Enable 2FA
                            </button>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">API Keys</h3>
                            <p className="text-sm text-gray-500 mb-4">Manage your API keys for third-party integrations</p>
                            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                                Manage API Keys
                            </button>
                        </div>
                    </div>
                );
            default:
                return <div>Tab not found</div>;
        }
    };

    return (
        <StoreManagerTemplate>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>

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
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex justify-end space-x-3">
                            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button className="px-4 py-2 bg-greenPrimary text-white rounded-lg hover:bg-green-600 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </StoreManagerTemplate>
    )
}