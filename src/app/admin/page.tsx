'use client';
import { useState, useEffect } from "react";
import { uploadFileAndGetUrl } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import VendorRequestModal from "@/components/VendorRequestModal";
import Image from 'next/image';
import { FaSearch, FaEdit, FaTimes, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { Order, FirestoreTimestamp, PayoutStatus } from "@/app/types/types";
import toast from "react-hot-toast";

const SECTIONS = [
  { value: "vendor-requests", label: "Vendor Requests" },
  { value: "review-testing", label: "Review Testing" },
  { value: "orders", label: "Orders" },
];

const VENDOR_TABS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
];

// Sample review data for testing
const SAMPLE_REVIEWS = [
  {
    rating: 5,
    title: "Excellent quality flies!",
    comment: "These flies are absolutely fantastic. The craftsmanship is top-notch and they've been incredibly effective on the water. Highly recommend!",
    userName: "John Fisher",
    userEmail: "john.fisher@example.com"
  },
  {
    rating: 4,
    title: "Great flies, fast shipping",
    comment: "Really happy with these flies. They arrived quickly and are exactly as described. Good quality materials and construction.",
    userName: "Sarah Angler",
    userEmail: "sarah.angler@example.com"
  },
  {
    rating: 5,
    title: "Perfect for trout fishing",
    comment: "Used these on my last trip and caught several nice trout. The flies are well-tied and durable. Will definitely order more.",
    userName: "Mike Rivers",
    userEmail: "mike.rivers@example.com"
  },
  {
    rating: 3,
    title: "Good flies but pricey",
    comment: "The quality is good and they work well, but I think they're a bit overpriced compared to similar flies elsewhere.",
    userName: "Tom Stream",
    userEmail: "tom.stream@example.com"
  },
  {
    rating: 4,
    title: "Beautiful craftsmanship",
    comment: "These flies are works of art! Very detailed and well-made. They've been effective on the water too.",
    userName: "Lisa Wade",
    userEmail: "lisa.wade@example.com"
  }
];

// Sample vendor review data for testing
const SAMPLE_VENDOR_REVIEWS = [
  {
    rating: 5,
    title: "Outstanding vendor experience!",
    comment: "This vendor consistently delivers high-quality flies with excellent customer service. Fast shipping and great communication throughout the process.",
    userName: "Alex Thompson",
    userEmail: "alex.thompson@example.com"
  },
  {
    rating: 4,
    title: "Reliable and professional",
    comment: "Great selection of flies and very professional service. Orders are processed quickly and packaged well. Will definitely order again.",
    userName: "Maria Rodriguez",
    userEmail: "maria.rodriguez@example.com"
  },
  {
    rating: 5,
    title: "Top-notch fly tying skills",
    comment: "The attention to detail in their flies is incredible. You can tell they really know what they're doing. These flies have been very effective.",
    userName: "David Chen",
    userEmail: "david.chen@example.com"
  },
  {
    rating: 4,
    title: "Good variety and quality",
    comment: "Nice selection of different fly patterns. Quality is consistently good and prices are fair. Customer service is responsive.",
    userName: "Jennifer Park",
    userEmail: "jennifer.park@example.com"
  },
  {
    rating: 3,
    title: "Decent vendor, slow shipping",
    comment: "The flies are good quality but shipping took longer than expected. Communication could be better but the products are solid.",
    userName: "Robert Johnson",
    userEmail: "robert.johnson@example.com"
  }
];

// Helper function to convert FirestoreTimestamp to Date
const getDateFromTimestamp = (timestamp: Date | FirestoreTimestamp): Date => {
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp.seconds * 1000);
};

// Helper function to format date
const formatDate = (date: Date | FirestoreTimestamp) => {
  const d = getDateFromTimestamp(date);
  return d.toLocaleDateString();
};

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState<'vendor-requests' | 'review-testing' | 'orders'>("vendor-requests");
  const [vendorRequests, setVendorRequests] = useState<any[]>([]);
  const [vendorMessage, setVendorMessage] = useState("");
  const [vendorTab, setVendorTab] = useState<'pending' | 'accepted'>("pending");
  
  // Search and pagination states
  const [searchName, setSearchName] = useState("");
  const [searchStoreName, setSearchStoreName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Review testing states
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [reviewType, setReviewType] = useState<'product' | 'vendor'>('product');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: "",
    comment: "",
    userName: "",
    userEmail: ""
  });
  const [reviewMessage, setReviewMessage] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Orders states
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderSortField, setOrderSortField] = useState<'purchaseDate' | 'amount' | 'payoutStatus' | 'customerName' | 'vendorName'>('purchaseDate');
  const [orderSortDirection, setOrderSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    console.log("Attempting login with:", { username, password });
    
    try {
      const res = await fetch("/api/v1/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important for cookies
        body: JSON.stringify({ username, password }),
      });
      
      console.log("Login response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Login successful:", data);
        setLoggedIn(true);
      } else {
        const errorData = await res.json();
        console.log("Login failed:", errorData);
        setLoginError(errorData.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Network error occurred");
    }
  };

  // Fetch vendor requests with search and pagination
  const fetchVendorRequests = async () => {
    if (!loggedIn || view !== "vendor-requests") return;
    
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: '10',
      ...(searchName && { name: searchName }),
      ...(searchStoreName && { storeName: searchStoreName })
    });
    
    try {
      const res = await fetch(`/api/v1/vendor/request-vendor?${params}`, {
        credentials: "include"
      });
      const data = await res.json();
      setVendorRequests(data.requests || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (error) {
      console.error("Failed to fetch vendor requests:", error);
    }
  };

  useEffect(() => {
    fetchVendorRequests();
  }, [loggedIn, view, currentPage, searchName, searchStoreName]);

  const handleApprove = async (uid: string) => {
    setVendorMessage("");
    const res = await fetch(`/api/v1/vendor/approve-vendor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies for admin authentication
      body: JSON.stringify({ uid }),
    });
    if (res.ok) {
      setVendorMessage("Vendor approved!");
      // Refresh the vendor requests list to show updated status
      fetchVendorRequests();
    } else {
      setVendorMessage("Failed to approve vendor");
    }
  };
  const handleDeny = async (uid: string) => {
    setVendorMessage("");
    // Call PATCH to update status
    const res = await fetch(`/api/v1/vendor/request-vendor`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies for admin authentication
      body: JSON.stringify({ uid }),
    });
    if (res.ok) {
      setVendorMessage("Vendor denied and status updated.");
      // Refresh the vendor requests list to show updated status
      fetchVendorRequests();
    } else {
      setVendorMessage("Failed to deny vendor");
    }
  };

  // Helper functions
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    fetchVendorRequests();
  };

  const handleClearSearch = () => {
    setSearchName("");
    setSearchStoreName("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // Filter vendor requests by tab (client-side filtering)
  const filteredVendorRequests = vendorRequests.filter(r => {
    if (vendorTab === "pending") {
      return r.vendorSignUpStatus === "submittedApprovalForm" || (!r.isApproved && !r.denied);
    } else if (vendorTab === "accepted") {
      return r.vendorSignUpStatus === "approvalFormApproved" || r.isApproved;
    }
    return false;
  });

  // Review testing functions
  const fetchProducts = async () => {
    if (!loggedIn || view !== "review-testing") return;
    
    try {
      const res = await fetch('/api/v1/product?pageSize=50', {
        credentials: "include"
      });
      const data = await res.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchVendors = async () => {
    if (!loggedIn || view !== "review-testing") return;
    
    try {
      console.log('Fetching vendors for admin...');
      const res = await fetch('/api/v1/vendor?pageSize=50', {
        credentials: "include"
      });
      console.log('Vendor API response status:', res.status);
      const data = await res.json();
      console.log('Vendor API response data:', data);
      setVendors(data.data || []);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSelectedVendor(null);
    setReviewMessage("");
  };

  const handleVendorSelect = (vendor: any) => {
    setSelectedVendor(vendor);
    setSelectedProduct(null);
    setReviewMessage("");
  };

  const handleReviewTypeChange = (type: 'product' | 'vendor') => {
    setReviewType(type);
    setSelectedProduct(null);
    setSelectedVendor(null);
    setReviewMessage("");
    setReviewData({
      rating: 5,
      title: "",
      comment: "",
      userName: "",
      userEmail: ""
    });
  };

  const handleSampleReviewSelect = (sampleReview: any) => {
    setReviewData({
      ...sampleReview,
      userName: sampleReview.userName,
      userEmail: sampleReview.userEmail
    });
  };

  const handleSubmitReview = async () => {
    const currentTarget = reviewType === 'product' ? selectedProduct : selectedVendor;
    if (!currentTarget || !reviewData.title || !reviewData.comment || !reviewData.userName || !reviewData.userEmail) {
      setReviewMessage("Please fill in all required fields");
      return;
    }

    setIsSubmittingReview(true);
    setReviewMessage("");

    try {
      const endpoint = reviewType === 'product' 
        ? '/api/v1/product/reviews'
        : '/api/v1/vendor/reviews';

      const requestBody = reviewType === 'product' 
        ? {
            productId: selectedProduct.id,
            userId: `admin-test-${Date.now()}`,
            userName: reviewData.userName,
            userEmail: reviewData.userEmail,
            rating: reviewData.rating,
            title: reviewData.title,
            comment: reviewData.comment,
            images: []
          }
        : {
            vendorId: selectedVendor.id,
            userId: `admin-test-${Date.now()}`,
            userName: reviewData.userName,
            userEmail: reviewData.userEmail,
            rating: reviewData.rating,
            title: reviewData.title,
            comment: reviewData.comment,
            images: []
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        const data = await res.json();
        setReviewMessage(`✅ ${reviewType === 'product' ? 'Product' : 'Vendor'} review added successfully! Review ID: ${data.reviewId}`);
        // Reset form
        setReviewData({
          rating: 5,
          title: "",
          comment: "",
          userName: "",
          userEmail: ""
        });
      } else {
        const errorData = await res.json();
        setReviewMessage(`❌ Failed to add ${reviewType} review: ${errorData.error}`);
      }
    } catch (error) {
      setReviewMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchVendors();
  }, [loggedIn, view]);

  const handleOrderSort = (field: 'purchaseDate' | 'amount' | 'payoutStatus' | 'customerName' | 'vendorName') => {
    if (orderSortField === field) {
      setOrderSortDirection(orderSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderSortField(field);
      setOrderSortDirection('desc');
    }
  };

  const getOrderSortIcon = (field: 'purchaseDate' | 'amount' | 'payoutStatus' | 'customerName' | 'vendorName') => {
    if (orderSortField !== field) return <FaSort className="w-3 h-3 text-gray-400" />;
    return orderSortDirection === 'asc' ? 
      <FaSortUp className="w-3 h-3 text-blue-600" /> : 
      <FaSortDown className="w-3 h-3 text-blue-600" />;
  };

  useEffect(() => {
    if (view === "orders") {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const response = await fetch('/api/v1/admin/orders');
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Failed to fetch orders');
          setOrders(data.orders || []);
        } catch (error) {
          console.error('Error fetching orders:', error);
          setOrderError('Failed to fetch orders');
          toast.error('Failed to fetch orders');
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [view]);

  const handleUpdateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      const response = await fetch('/api/v1/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, updates })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update order');

      // Update the orders list with the updated order
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      ));

      toast.success('Order updated successfully');
      
      // If this was an admin approval, show a specific message
      if (updates.payoutStatus === 'admin_approved') {
        toast.success('Order approved for immediate withdrawal');
      }

      // Close the modal if we're in edit mode
      if (isEditingOrder) {
        setSelectedOrder(null);
        setIsEditingOrder(false);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchString = orderSearchTerm.toLowerCase();
    return (
      order.id?.toLowerCase().includes(searchString) ||
      order.vendorName.toLowerCase().includes(searchString) ||
      order.customerEmail.toLowerCase().includes(searchString) ||
      order.vendorId.toLowerCase().includes(searchString) ||
      order.shippingAddress.name.toLowerCase().includes(searchString)
    );
  }).sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (orderSortField) {
      case 'purchaseDate':
        aValue = getDateFromTimestamp(a.purchaseDate).getTime();
        bValue = getDateFromTimestamp(b.purchaseDate).getTime();
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'payoutStatus':
        aValue = a.payoutStatus;
        bValue = b.payoutStatus;
        break;
      case 'customerName':
        aValue = a.shippingAddress.name;
        bValue = b.shippingAddress.name;
        break;
      case 'vendorName':
        aValue = a.vendorName;
        bValue = b.vendorName;
        break;
      default:
        return 0;
    }
    
    return orderSortDirection === 'asc' ? 
      (aValue > bValue ? 1 : -1) : 
      (aValue < bValue ? 1 : -1);
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {!loggedIn ? (
        // Login form
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-md w-96">
            <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {loginError && (
                <div className="text-red-600 text-sm">{loginError}</div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      ) : (
        // Main admin interface
        <div className="min-h-screen">
          {/* Navigation Tabs */}
          <div className="bg-white border-b">
            <div className="container mx-auto px-4">
              <div className="flex space-x-4 py-4">
                {SECTIONS.map((section) => (
                  <button
                    key={section.value}
                    onClick={() => setView(section.value as typeof view)}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      view === section.value
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="container mx-auto px-4 py-6">
            {/* Content sections */}
            {view === "vendor-requests" && (
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Vendor Requests</h1>
                
                {/* Search Controls */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-3">Search Vendor Requests</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search by Name</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        placeholder="Enter applicant name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search by Store Name</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        placeholder="Enter store name..."
                        value={searchStoreName}
                        onChange={(e) => setSearchStoreName(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        onClick={handleSearch}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Search
                      </button>
                      <button
                        onClick={handleClearSearch}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tab Controls */}
                <div className="flex gap-4 mb-4">
                  {VENDOR_TABS.map(tab => (
                    <button
                      key={tab.value}
                      className={`px-4 py-2 rounded-t ${vendorTab === tab.value ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
                      onClick={() => setVendorTab(tab.value as 'pending' | 'accepted')}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Results Info */}
                <div className="mb-4 text-sm text-gray-600">
                  Showing {filteredVendorRequests.length} of {pagination.totalCount} total requests
                  {(searchName || searchStoreName) && (
                    <span className="ml-2">
                      (filtered by: {[searchName && `name: "${searchName}"`, searchStoreName && `store: "${searchStoreName}"`].filter(Boolean).join(', ')})
                    </span>
                  )}
                </div>

                {vendorMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{vendorMessage}</div>}
                
                {/* Vendor Requests List */}
                {filteredVendorRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {(searchName || searchStoreName) ? "No vendor requests found matching your search criteria." : "No vendor requests found."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredVendorRequests.map((req, i) => (
                      <div key={i} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="font-semibold text-gray-700">Name:</span>
                            <span className="ml-2">{req.name}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Store Name:</span>
                            <span className="ml-2">{req.storeName}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Email:</span>
                            <span className="ml-2">{req.storeEmail}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Phone:</span>
                            <span className="ml-2">{req.storePhone}</span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <span className="font-semibold text-gray-700">Description:</span>
                          <p className="mt-1 text-gray-600 text-sm">{req.storeDescription?.substring(0, 150)}...</p>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
                          <span>
                            <span className="font-semibold">Created:</span> {formatDate(req.createdAt)}
                          </span>
                          {req.approvedAt && (
                            <span>
                              <span className="font-semibold">Approved:</span> {formatDate(req.approvedAt)}
                            </span>
                          )}
                          <span>
                            <span className="font-semibold">Status:</span>
                            <span className={`ml-1 px-2 py-1 rounded text-xs ${
                              req.isApproved ? 'bg-green-100 text-green-800' :
                              req.denied ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {req.isApproved ? 'Approved' : req.denied ? 'Denied' : 'Pending'}
                            </span>
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(req)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            View Details
                          </button>
                          {vendorTab === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(req.uid)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDeny(req.uid)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                              >
                                Deny
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`px-3 py-2 rounded ${
                        pagination.hasPrevPage 
                          ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNumber = Math.max(1, Math.min(
                        pagination.currentPage - 2 + i,
                        pagination.totalPages - 4 + i
                      ));
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-2 rounded ${
                            pageNumber === pagination.currentPage
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`px-3 py-2 rounded ${
                        pagination.hasNextPage 
                          ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next
                    </button>
                    
                    <span className="ml-4 text-sm text-gray-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                  </div>
                )}
              </div>
            )}
            {view === "review-testing" && (
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Review Testing</h1>
                <p className="text-gray-600 mb-6">Add test reviews to products or vendors to verify the review system is working correctly.</p>
                
                {/* Review Type Selection */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-3">1. Select Review Type</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleReviewTypeChange('product')}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        reviewType === 'product'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Product Reviews
                    </button>
                    <button
                      onClick={() => handleReviewTypeChange('vendor')}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        reviewType === 'vendor'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Vendor Reviews
                    </button>
                  </div>
                </div>

                {/* Product Selection */}
                {reviewType === 'product' && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-3">2. Select a Product</h3>
                    {products.length === 0 ? (
                      <p className="text-gray-500">Loading products...</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.slice(0, 12).map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductSelect(product)}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              selectedProduct?.id === product.id 
                                ? 'border-green-500 bg-green-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex gap-3">
                              {product.images?.[0] && (
                                <div className="relative w-16 h-16">
                                  <Image 
                                    src={product.images[0]} 
                                    alt={product.name}
                                    fill
                                    className="object-cover rounded"
                                    sizes="64px"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium text-sm mb-1">{product.name}</h4>
                                <p className="text-xs text-gray-600 mb-1">by {product.vendorName}</p>
                                <p className="text-sm font-semibold">${product.price}</p>
                                {product.reviewSummary?.totalReviews > 0 && (
                                  <p className="text-xs text-gray-500">
                                    {product.reviewSummary.totalReviews} review{product.reviewSummary.totalReviews !== 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {products.length > 12 && (
                      <p className="text-sm text-gray-500 mt-2">Showing first 12 products. Select one to continue.</p>
                    )}
                  </div>
                )}

                {/* Vendor Selection */}
                {reviewType === 'vendor' && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-3">2. Select a Vendor</h3>
                    {vendors.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-2">No vendors available for testing.</p>
                        <p className="text-sm text-gray-400">
                          This could mean:
                          <br />• No vendors have been approved yet
                          <br />• No vendor applications have been submitted
                          <br />• Admin authentication issue
                        </p>
                        <p className="text-sm text-blue-600 mt-2">
                          Check the browser console for more details.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vendors.slice(0, 12).map((vendor) => (
                          <div
                            key={vendor.id}
                            onClick={() => handleVendorSelect(vendor)}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              selectedVendor?.id === vendor.id 
                                ? 'border-green-500 bg-green-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex gap-3">
                              {vendor.profileImage && (
                                <div className="relative w-16 h-16">
                                  <Image 
                                    src={vendor.profileImage} 
                                    alt={vendor.storeName}
                                    fill
                                    className="object-cover rounded"
                                    sizes="64px"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium text-sm mb-1">{vendor.storeName}</h4>
                                <p className="text-xs text-gray-600 mb-1">by {vendor.ownerName}</p>
                                <p className="text-xs text-gray-500">{vendor.storeCity}, {vendor.storeState}</p>
                                {vendor.reviewSummary?.totalReviews > 0 && (
                                  <p className="text-xs text-gray-500">
                                    {vendor.reviewSummary.totalReviews} review{vendor.reviewSummary.totalReviews !== 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {vendors.length > 12 && (
                      <p className="text-sm text-gray-500 mt-2">Showing first 12 vendors. Select one to continue.</p>
                    )}
                  </div>
                )}

                {/* Sample Reviews */}
                {(selectedProduct || selectedVendor) && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-3">3. Choose a Sample Review (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(reviewType === 'product' ? SAMPLE_REVIEWS : SAMPLE_VENDOR_REVIEWS).map((sample, index) => (
                        <div
                          key={index}
                          onClick={() => handleSampleReviewSelect(sample)}
                          className="border border-gray-200 rounded p-3 cursor-pointer hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={star <= sample.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-sm font-medium">{sample.title}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{sample.comment.substring(0, 100)}...</p>
                          <p className="text-xs text-gray-500">by {sample.userName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {(selectedProduct || selectedVendor) && (
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      4. Review Details for "{reviewType === 'product' ? selectedProduct?.name : selectedVendor?.storeName}"
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                        <div className="flex gap-1 mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewData({...reviewData, rating: star})}
                              className={`text-2xl transition-colors ${
                                star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {reviewData.rating} star{reviewData.rating !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-2">Review Title *</label>
                        <input
                          type="text"
                          value={reviewData.title}
                          onChange={(e) => setReviewData({...reviewData, title: e.target.value})}
                          placeholder="Enter review title..."
                          className="w-full border rounded p-2 mb-4"
                          maxLength={100}
                        />

                        <label className="block text-sm font-medium text-gray-700 mb-2">Reviewer Name *</label>
                        <input
                          type="text"
                          value={reviewData.userName}
                          onChange={(e) => setReviewData({...reviewData, userName: e.target.value})}
                          placeholder="Enter reviewer name..."
                          className="w-full border rounded p-2 mb-4"
                        />

                        <label className="block text-sm font-medium text-gray-700 mb-2">Reviewer Email *</label>
                        <input
                          type="email"
                          value={reviewData.userEmail}
                          onChange={(e) => setReviewData({...reviewData, userEmail: e.target.value})}
                          placeholder="Enter reviewer email..."
                          className="w-full border rounded p-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Review Comment *</label>
                        <textarea
                          value={reviewData.comment}
                          onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                          placeholder="Enter detailed review comment..."
                          rows={8}
                          className="w-full border rounded p-2 resize-none"
                          maxLength={1000}
                        />
                        <p className="text-xs text-gray-500 mt-1">{reviewData.comment.length}/1000 characters</p>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-4">
                      <button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview || !reviewData.title || !reviewData.comment || !reviewData.userName || !reviewData.userEmail}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isSubmittingReview ? `Adding ${reviewType} Review...` : `Add ${reviewType} Review`}
                      </button>
                      <button
                        onClick={() => {
                          setReviewData({rating: 5, title: "", comment: "", userName: "", userEmail: ""});
                          setReviewMessage("");
                        }}
                        className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
                      >
                        Clear Form
                      </button>
                    </div>

                    {reviewMessage && (
                      <div className={`mt-4 p-3 rounded ${
                        reviewMessage.includes('✅') 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {reviewMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {view === "orders" && (
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Orders</h1>

                {/* Search and Filter Controls */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-3">Search Orders</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        placeholder="Search by customer, vendor, or order ID..."
                        value={orderSearchTerm}
                        onChange={(e) => setOrderSearchTerm(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                      <select
                        className="w-full border rounded p-2"
                        value={orderSortField}
                        onChange={(e) => handleOrderSort(e.target.value as any)}
                      >
                        <option value="purchaseDate">Purchase Date</option>
                        <option value="amount">Amount</option>
                        <option value="payoutStatus">Payout Status</option>
                        <option value="customerName">Customer Name</option>
                        <option value="vendorName">Vendor Name</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => setOrderSortDirection(orderSortDirection === 'asc' ? 'desc' : 'asc')}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
                      >
                        {orderSortDirection === 'asc' ? 'Ascending' : 'Descending'}
                        {orderSortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Orders List */}
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {orderSearchTerm ? "No orders found matching your search criteria." : "No orders found."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <span className="font-semibold text-gray-700">Order ID:</span>
                            <span className="ml-2 font-mono text-sm">{order.id}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Customer:</span>
                            <span className="ml-2">{order.customerName}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Vendor:</span>
                            <span className="ml-2">{order.vendorName}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <span className="font-semibold text-gray-700">Purchase Date:</span>
                            <span className="ml-2">{formatDate(order.purchaseDate)}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Amount:</span>
                            <span className="ml-2">${order.amount.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Shipping Status:</span>
                            <span className="ml-2">{order.shippingStatus}</span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <span className="font-semibold text-gray-700">Items:</span>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                                <span className="font-medium">{item.name}</span>
                                <span className="text-gray-600 ml-2">
                                  ({item.quantity}x @ ${item.price.toFixed(2)})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">Payout Status:</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.payoutStatus === 'admin_approved' ? 'bg-green-100 text-green-800' :
                              order.payoutStatus === 'withdrawn' ? 'bg-blue-100 text-blue-800' :
                              order.payoutStatus === 'blocked' ? 'bg-red-100 text-red-800' :
                              order.payoutStatus === 'refunded' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.payoutStatus.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsEditingOrder(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-2"
                            title="View Details"
                          >
                            <FaEdit className="w-5 h-5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modals - rendered outside the main content area */}
          <div className="relative z-50">
            {/* Vendor Request Modal */}
            <VendorRequestModal
              request={selectedRequest}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />

            {/* Order Edit Modal */}
            {selectedOrder && isEditingOrder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">Order Details</h2>
                      <button
                        onClick={() => {
                          setSelectedOrder(null);
                          setIsEditingOrder(false);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Order Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Order Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Order ID</label>
                            <div className="mt-1 text-sm text-gray-900">{selectedOrder.id}</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                            <div className="mt-1 text-sm text-gray-900">{formatDate(selectedOrder.purchaseDate)}</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                            <div className="mt-1 text-sm text-gray-900">${selectedOrder.amount.toFixed(2)}</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Platform Fee</label>
                            <div className="mt-1 text-sm text-gray-900">${selectedOrder.platformFee.toFixed(2)}</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Vendor Earnings</label>
                            <div className="mt-1 text-sm text-gray-900">${selectedOrder.vendorEarnings.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-4">Shipping Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Shipping Status</label>
                            <div className="mt-1 text-sm text-gray-900">{selectedOrder.shippingStatus}</div>
                          </div>
                          {selectedOrder.trackingNumber && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                              <div className="mt-1 text-sm text-gray-900">{selectedOrder.trackingNumber}</div>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Shipping Address</label>
                            <div className="mt-1 text-sm text-gray-900">
                              <p>{selectedOrder.shippingAddress.name}</p>
                              <p>{selectedOrder.shippingAddress.address1}</p>
                              {selectedOrder.shippingAddress.address2 && <p>{selectedOrder.shippingAddress.address2}</p>}
                              <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}</p>
                              <p>{selectedOrder.shippingAddress.country}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Products</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {selectedOrder.items?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                              <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payout Status */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Payout Status</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Current Status</label>
                          <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={selectedOrder.payoutStatus}
                            onChange={(e) => {
                              const updatedOrder: Order = {
                                ...selectedOrder,
                                payoutStatus: e.target.value as PayoutStatus
                              };
                              setSelectedOrder(updatedOrder);
                            }}
                          >
                            <option value="pending_delivery">Pending Delivery</option>
                            <option value="pending_holdback">In Holdback Period</option>
                            <option value="available">Available</option>
                            <option value="admin_approved">Admin Approved</option>
                            <option value="withdrawn">Withdrawn</option>
                            <option value="blocked">Blocked</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>

                        {selectedOrder.payoutStatus === 'pending_delivery' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                              This order is waiting to be delivered before payout can be processed.
                            </p>
                          </div>
                        )}

                        {selectedOrder.payoutStatus === 'pending_holdback' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                              This order is in the 30-day holdback period. Available for withdrawal on {formatDate(selectedOrder.withdrawAvailableDate)}.
                            </p>
                          </div>
                        )}

                        {selectedOrder.payoutStatus === 'admin_approved' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-green-800">
                              You have approved this order for immediate withdrawal.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="sticky bottom-0 bg-white pt-4 border-t">
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => {
                            setSelectedOrder(null);
                            setIsEditingOrder(false);
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (selectedOrder.id) {
                              handleUpdateOrder(selectedOrder.id, {
                                payoutStatus: selectedOrder.payoutStatus
                              });
                            }
                          }}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                        {selectedOrder.payoutStatus !== 'admin_approved' && selectedOrder.payoutStatus !== 'withdrawn' && (
                          <button
                            onClick={() => {
                              if (selectedOrder.id) {
                                handleUpdateOrder(selectedOrder.id, {
                                  payoutStatus: 'admin_approved'
                                });
                              }
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700"
                          >
                            Approve for Withdrawal
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 