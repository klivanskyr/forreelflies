'use client';

import { useState } from 'react';

interface VendorRequest {
  uid: string;
  name: string;
  storeEmail: string;
  storeName: string;
  storeDescription: string;
  storePhone: string;
  storeStreetAddress: string;
  storeCity: string;
  storeState: string;
  storeZip: string;
  storeCountry: string;
  createdAt: string;
  isApproved?: boolean;
  approvedAt?: string;
  denied?: boolean;
  vendorSignUpStatus?: string;
}

interface VendorRequestModalProps {
  request: VendorRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid Date';
  }
}

export default function VendorRequestModal({ request, isOpen, onClose }: VendorRequestModalProps) {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Vendor Request Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-900">{request.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">User ID</label>
                  <p className="text-gray-900 font-mono text-sm">{request.uid}</p>
                </div>
              </div>
            </div>

            {/* Store Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Store Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Store Name</label>
                  <p className="text-gray-900">{request.storeName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Store Email</label>
                  <p className="text-gray-900">{request.storeEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Store Phone</label>
                  <p className="text-gray-900">{request.storePhone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Store Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">{request.storeDescription}</p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Address Information</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Street Address</label>
                  <p className="text-gray-900">{request.storeStreetAddress}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">City</label>
                    <p className="text-gray-900">{request.storeCity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">State</label>
                    <p className="text-gray-900">{request.storeState}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">ZIP Code</label>
                    <p className="text-gray-900">{request.storeZip}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Country</label>
                    <p className="text-gray-900">{request.storeCountry}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Status Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Current Status</label>
                  <p className="text-gray-900">
                    <span className={`px-2 py-1 rounded text-sm ${
                      request.isApproved ? 'bg-green-100 text-green-800' :
                      request.denied ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.isApproved ? 'Approved' : 
                       request.denied ? 'Denied' : 
                       'Pending'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Vendor Signup Status</label>
                  <p className="text-gray-900">{request.vendorSignUpStatus || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Submitted At</label>
                  <p className="text-gray-900">{formatDate(request.createdAt)}</p>
                </div>
                {request.approvedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Approved At</label>
                    <p className="text-gray-900">{formatDate(request.approvedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 