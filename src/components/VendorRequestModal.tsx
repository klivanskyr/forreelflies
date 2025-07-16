'use client';

import { useState } from 'react';
import { toast } from "sonner";

interface VendorRequest {
  uid: string;
  name: string;
  storeName: string;
  storeSlug: string;
  storeEmail: string;
  storePhone: string;
  storeDescription: string;
  storeStreetAddress: string;
  storeCity: string;
  storeZip: string;
  storeCountry: string;
  storeState: string;
  isApproved: boolean;
  denied: boolean;
  vendorSignUpStatus?: string;
  createdAt: Date | any;
  approvedAt?: Date | any;
}

interface VendorRequestModalProps {
  request: VendorRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (date: Date | any) => {
  // Handle Firestore timestamp objects
  if (date && typeof date === 'object' && date.seconds) {
    date = new Date(date.seconds * 1000);
  }
  
  // Handle string dates
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  // Validate the date
  if (!date || isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function VendorRequestModal({ request, isOpen, onClose }: VendorRequestModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !request) return null;

  const handleApprove = async () => {
    if (request.isApproved) {
      toast.error("This vendor request has already been approved");
      return;
    }

    if (request.denied) {
      toast.error("Cannot approve a denied vendor request");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/approve-vendor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ uid: request.uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to approve vendor:", errorData);
        
        if (response.status === 404) {
          toast.error("Vendor request not found");
        } else if (response.status >= 500) {
          toast.error("Server error. Please try again in a few minutes.");
        } else {
          toast.error(`Failed to approve vendor: ${errorData.error || "Unknown error"}`);
        }
        return;
      }

      toast.success(`Vendor "${request.storeName}" approved successfully!`);
      onClose(); // Close modal after successful approval
      
      // Refresh the page or trigger a refresh callback if available
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (networkError) {
      console.error("Network error approving vendor:", networkError);
      
      if (networkError instanceof TypeError && networkError.message.includes("fetch")) {
        toast.error("Connection error. Please check your internet connection and try again.");
      } else {
        toast.error("Failed to approve vendor. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (request.denied) {
      toast.error("This vendor request has already been denied");
      return;
    }

    if (request.isApproved) {
      toast.error("Cannot deny an approved vendor request");
      return;
    }

    const confirmDeny = window.confirm(`Are you sure you want to deny the vendor application for "${request.storeName}"? This action cannot be undone.`);
    if (!confirmDeny) return;

    setIsProcessing(true);

    try {
      // Note: You'll need to implement the deny endpoint in your API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/deny-vendor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ uid: request.uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to deny vendor:", errorData);
        
        if (response.status === 404) {
          toast.error("Vendor request not found");
        } else if (response.status >= 500) {
          toast.error("Server error. Please try again in a few minutes.");
        } else {
          toast.error(`Failed to deny vendor: ${errorData.error || "Unknown error"}`);
        }
        return;
      }

      toast.success(`Vendor application for "${request.storeName}" has been denied.`);
      onClose(); // Close modal after successful denial
      
      // Refresh the page or trigger a refresh callback if available
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (networkError) {
      console.error("Network error denying vendor:", networkError);
      
      if (networkError instanceof TypeError && networkError.message.includes("fetch")) {
        toast.error("Connection error. Please check your internet connection and try again.");
      } else {
        toast.error("Failed to deny vendor. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

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
              disabled={isProcessing}
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
                  <label className="block text-sm font-medium text-gray-600">Store URL</label>
                  <p className="text-blue-600">https://forreelflies.com/vendor/{request.storeSlug}</p>
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

          {/* Footer with Action Buttons */}
          <div className="mt-6 flex justify-between items-center">
            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm">Processing...</span>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 ml-auto">
              {!request.isApproved && !request.denied && (
                <>
                  <button 
                    onClick={handleDeny}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Processing..." : "Deny"}
                  </button>
                  <button 
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Processing..." : "Approve"}
                  </button>
                </>
              )}
              <button 
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 