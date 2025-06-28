import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FaHome, FaBuilding, FaStar } from 'react-icons/fa'

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

interface ShippingAddressModalProps {
    isOpen: boolean
    onClose: () => void
    onAddressAdded: () => void
}

export default function ShippingAddressModal({ isOpen, onClose, onAddressAdded }: ShippingAddressModalProps) {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [addresses, setAddresses] = useState<Address[]>([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [formData, setFormData] = useState({
        label: '',
        name: '',
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
    })

    useEffect(() => {
        // In a real app, fetch addresses from API
        // For now, create a mock address if user has address data
        if (session?.user?.streetAddress) {
            setAddresses([{
                id: '1',
                label: 'Home',
                isDefault: true,
                name: session.user.username || '',
                streetAddress: session.user.streetAddress,
                city: session.user.city || '',
                state: session.user.state || '',
                zipCode: session.user.zipCode || '',
                country: session.user.country || 'US',
                phone: session.user.phoneNumber || ''
            }]);
        }
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session?.user) return

        setLoading(true)
        setError(null)

        try {
            const newAddress: Address = {
                id: Date.now().toString(),
                isDefault: addresses.length === 0,
                ...formData
            };

            const response = await fetch('/api/v1/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    uid: session.user.uid,
                    streetAddress: formData.streetAddress,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country
                })
            })

            if (!response.ok) {
                throw new Error('Failed to update address')
            }

            setAddresses(prev => [...prev, newAddress])
            onAddressAdded()
            setShowAddForm(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save address')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectAddress = async (address: Address) => {
        if (!session?.user) return;
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    uid: session.user.uid,
                    streetAddress: address.streetAddress,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zipCode,
                    country: address.country,
                    phoneNumber: address.phone
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update address');
            }

            onAddressAdded();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to select address');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Select Shipping Address</h2>
                        <p className="text-sm text-gray-600 mt-1">Choose from your saved addresses or add a new one</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Saved Addresses */}
                    {addresses.length > 0 && !showAddForm && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {addresses.map((address) => (
                                <div
                                    key={address.id}
                                    className={`relative p-6 rounded-lg border ${
                                        address.isDefault ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                                    } hover:shadow-md transition-shadow cursor-pointer`}
                                    onClick={() => handleSelectAddress(address)}
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
                                    
                                    <div className="space-y-1 text-gray-600 text-sm">
                                        <p>{address.name}</p>
                                        <p>{address.streetAddress}</p>
                                        <p>{`${address.city}, ${address.state} ${address.zipCode}`}</p>
                                        <p>{address.country}</p>
                                        {address.phone && <p>{address.phone}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Address Button or Form */}
                    {!showAddForm ? (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full py-4 px-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors"
                        >
                            <div className="flex items-center justify-center gap-2 text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>Add New Address</span>
                            </div>
                        </button>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Label and Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                                        Address Label *
                                    </label>
                                    <input
                                        type="text"
                                        id="label"
                                        name="label"
                                        required
                                        value={formData.label}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Home, Office, etc."
                                    />
                                </div>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            {/* Street Address */}
                            <div>
                                <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-1">
                                    Street Address *
                                </label>
                                <input
                                    type="text"
                                    id="streetAddress"
                                    name="streetAddress"
                                    required
                                    value={formData.streetAddress}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="123 Main Street"
                                />
                            </div>

                            {/* City and State */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        required
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="New York"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        id="state"
                                        name="state"
                                        required
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="NY"
                                    />
                                </div>
                            </div>

                            {/* ZIP Code and Country */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                                        ZIP Code *
                                    </label>
                                    <input
                                        type="text"
                                        id="zipCode"
                                        name="zipCode"
                                        required
                                        value={formData.zipCode}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="10001"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                                        Country *
                                    </label>
                                    <select
                                        id="country"
                                        name="country"
                                        required
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="US">United States</option>
                                        <option value="CA">Canada</option>
                                        <option value="GB">United Kingdom</option>
                                        <option value="AU">Australia</option>
                                        <option value="DE">Germany</option>
                                        <option value="FR">France</option>
                                        <option value="IT">Italy</option>
                                        <option value="ES">Spain</option>
                                        <option value="JP">Japan</option>
                                        <option value="MX">Mexico</option>
                                    </select>
                                </div>
                            </div>

                            {/* Shipping Info */}
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <div className="text-sm font-medium text-blue-800">
                                            Shipping Calculation
                                        </div>
                                        <div className="text-xs text-blue-700 mt-1">
                                            We'll use this address to calculate accurate shipping rates from each vendor using Shippo.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save Address
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
} 