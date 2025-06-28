'use client';

import { useState, useEffect } from "react";
import Modal from "../modal/Modal";
import Button from "../buttons/Button";
import Input from "../inputs/Input";
import { useUser } from "@/contexts/UserContext";
import { FaHome, FaBuilding, FaTrash, FaPen, FaStar } from 'react-icons/fa';

type Address = {
    id: string;
    label: string;
    isDefault: boolean;
    name: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
}

type AddressFormData = Omit<Address, 'id' | 'isDefault'>;

export default function AddressPage() {
    const { user } = useUser();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState<AddressFormData>({
        label: '',
        name: '',
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // In a real app, fetch addresses from API
        // For now, create a mock address if user has address data
        if (user?.streetAddress) {
            setAddresses([{
                id: '1',
                label: 'Home',
                isDefault: true,
                name: user.username || '',
                streetAddress: user.streetAddress,
                city: user.city || '',
                state: user.state || '',
                zipCode: user.zipCode || '',
                country: user.country || 'US',
                phone: user.phoneNumber || ''
            }]);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // In a real app, make API call to save address
            const newAddress: Address = {
                id: editingAddress?.id || Date.now().toString(),
                isDefault: addresses.length === 0 ? true : false,
                ...formData
            };

            if (editingAddress) {
                setAddresses(prev => prev.map(addr => 
                    addr.id === editingAddress.id ? newAddress : addr
                ));
            } else {
                setAddresses(prev => [...prev, newAddress]);
            }

            // Update user profile with default address
            if (newAddress.isDefault || addresses.length === 0) {
                await fetch('/api/v1/user', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: user?.uid,
                        streetAddress: newAddress.streetAddress,
                        city: newAddress.city,
                        state: newAddress.state,
                        zipCode: newAddress.zipCode,
                        country: newAddress.country,
                        phoneNumber: newAddress.phone
                    })
                });
            }

            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            setError('Failed to save address. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setFormData({
            label: address.label,
            name: address.name,
            streetAddress: address.streetAddress,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            phone: address.phone || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (addressId: string) => {
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
        // If deleting default address, make the first remaining address default
        const deletedAddress = addresses.find(addr => addr.id === addressId);
        if (deletedAddress?.isDefault && addresses.length > 1) {
            const newDefault = addresses.find(addr => addr.id !== addressId);
            if (newDefault) {
                await handleSetDefault(newDefault.id);
            }
        }
    };

    const handleSetDefault = async (addressId: string) => {
        const newDefault = addresses.find(addr => addr.id === addressId);
        if (!newDefault) return;

        setAddresses(prev => prev.map(addr => ({
            ...addr,
            isDefault: addr.id === addressId
        })));

        // Update user profile with new default address
        await fetch('/api/v1/user', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: user?.uid,
                streetAddress: newDefault.streetAddress,
                city: newDefault.city,
                state: newDefault.state,
                zipCode: newDefault.zipCode,
                country: newDefault.country,
                phoneNumber: newDefault.phone
            })
        });
    };

    const resetForm = () => {
        setFormData({
            label: '',
            name: '',
            streetAddress: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US',
            phone: ''
        });
        setEditingAddress(null);
        setError(null);
    };

    const handleAddNew = () => {
        resetForm();
        setIsModalOpen(true);
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Address Book</h1>
                    <p className="text-gray-600 mt-1">Manage your shipping addresses</p>
                </div>
                <Button
                    text="Add New Address"
                    onClick={handleAddNew}
                    className="bg-green-600 hover:bg-green-700"
                />
            </div>

            {addresses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                    <FaHome className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
                    <p className="text-gray-600 mb-4">Add your first shipping address to speed up checkout</p>
                    <Button
                        text="Add Your First Address"
                        onClick={handleAddNew}
                        className="bg-green-600 hover:bg-green-700"
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className={`relative p-6 rounded-lg border ${
                                address.isDefault ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                            } hover:shadow-md transition-shadow`}
                        >
                            {address.isDefault && (
                                <div className="absolute top-4 right-4 text-green-600 flex items-center gap-1">
                                    <FaStar className="w-4 h-4" />
                                    <span className="text-sm font-medium">Default</span>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-3 mb-4">
                                {address.label === 'Home' ? (
                                    <FaHome className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <FaBuilding className="w-5 h-5 text-gray-600" />
                                )}
                                <h3 className="font-medium text-gray-900">{address.label}</h3>
                            </div>
                            
                            <div className="space-y-2 text-gray-600">
                                <p>{address.name}</p>
                                <p>{address.streetAddress}</p>
                                <p>{`${address.city}, ${address.state} ${address.zipCode}`}</p>
                                <p>{address.country}</p>
                                {address.phone && <p>{address.phone}</p>}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(address)}
                                        className="text-gray-600 hover:text-gray-900 p-2"
                                    >
                                        <FaPen className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(address.id)}
                                        className="text-red-600 hover:text-red-700 p-2"
                                    >
                                        <FaTrash className="w-4 h-4" />
                                    </button>
                                </div>
                                {!address.isDefault && (
                                    <button
                                        onClick={() => handleSetDefault(address.id)}
                                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                                    >
                                        Set as Default
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                open={isModalOpen}
                setOpen={setIsModalOpen}
                className="w-full max-w-2xl bg-white rounded-xl shadow-2xl"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </h2>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Input
                                    label="Address Label"
                                    value={formData.label}
                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                    placeholder="Home, Office, etc."
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    label="Full Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    label="Street Address"
                                    value={formData.streetAddress}
                                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                                    placeholder="123 Main St"
                                    required
                                />
                            </div>
                            <div>
                                <Input
                                    label="City"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Input
                                    label="State"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Input
                                    label="ZIP Code"
                                    value={formData.zipCode}
                                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Country
                                </label>
                                <select
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                >
                                    <option value="US">United States</option>
                                    <option value="CA">Canada</option>
                                    <option value="GB">United Kingdom</option>
                                    <option value="AU">Australia</option>
                                    <option value="DE">Germany</option>
                                    <option value="FR">France</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <Input
                                    label="Phone Number (Optional)"
                                    value={formData.phone || ''}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                text="Cancel"
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                            />
                            <Button
                                text={loading ? 'Saving...' : 'Save Address'}
                                type="submit"
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700"
                            />
                        </div>
                </form>
                </div>
            </Modal>
        </div>
    );
}