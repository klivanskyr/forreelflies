'use client';
import { useState, useEffect } from "react";
import { uploadFileAndGetUrl } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import VendorRequestModal from "@/components/VendorRequestModal";
import Image from 'next/image';

const SECTIONS = [
  { value: "slider", label: "Homepage Slider" },
  { value: "our-flies", label: "Our Flies Section" },
  { value: "about-us", label: "About Us Page" },
  // Add more sections as needed
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

function formatDate(date: any) {
  if (!date) return "-";
  const d = typeof date === 'string' ? new Date(date) : date.toDate ? date.toDate() : date;
  return d instanceof Date && !isNaN(d.getTime()) ? d.toLocaleString() : "-";
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [selectedSection, setSelectedSection] = useState(SECTIONS[0].value);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [assignments, setAssignments] = useState<{ section: string; imageUrl: string }[]>([]);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<'images' | 'vendor-requests' | 'review-testing'>("images");
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

  // Fetch assignments from Firestore on login
  useEffect(() => {
    if (loggedIn) {
      (async () => {
        const q = query(collection(db, "adminImageAssignments"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data());
        setAssignments(data as { section: string; imageUrl: string }[]);
      })();
    }
  }, [loggedIn]);

  const handleUpload = async () => {
    if (!imageFile) return;
    setUploading(true);
    setMessage("");
    try {
      const url = await uploadFileAndGetUrl(imageFile, `admin/${selectedSection}_${Date.now()}_${imageFile.name}`);
      // Save to Firestore
      await addDoc(collection(db, "adminImageAssignments"), {
        section: selectedSection,
        imageUrl: url,
        createdAt: new Date(),
      });
      setAssignments((prev) => [...prev, { section: selectedSection, imageUrl: url }]);
      setMessage("Image uploaded and assigned!");
    } catch {
      setMessage("Upload failed");
    }
    setUploading(false);
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

  // Group assignments by section
  const sliderImages = assignments.filter(a => a.section === "slider");
  const ourFliesImages = assignments.filter(a => a.section === "our-flies");
  const aboutUsImages = assignments.filter(a => a.section === "about-us");

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

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="max-w-md w-full p-8 bg-white rounded shadow">
          <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input className="border rounded p-2" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <input className="border rounded p-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="bg-green-600 text-white px-4 py-2 rounded" type="submit">Login</button>
            {loginError && <div className="text-red-600">{loginError}</div>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-white">
      <div className="flex flex-col w-full max-w-5xl mx-auto flex-1">
        <div className="flex flex-row gap-4 border-b mb-6 pt-8">
          <button className={`px-4 py-2 rounded-t ${view === "images" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`} onClick={() => setView("images")}>Image Assignment</button>
          <button className={`px-4 py-2 rounded-t ${view === "vendor-requests" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`} onClick={() => setView("vendor-requests")}>Vendor Requests</button>
          <button className={`px-4 py-2 rounded-t ${view === "review-testing" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`} onClick={() => setView("review-testing")}>Review Testing</button>
        </div>
        {view === "images" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Image Assignment</h1>
            <div className="mb-4">
              <label className="block font-medium mb-1">Section</label>
              <select className="border rounded p-2 w-full" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Image</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleUpload} disabled={uploading}>{uploading ? "Uploading..." : "Upload & Assign"}</button>
            {message && <div className="mt-2 text-green-700">{message}</div>}
            <div className="mt-8 space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-2">Slider Images</h2>
                <ul className="flex gap-4 flex-wrap">
                  {sliderImages.length === 0 && <li className="text-gray-500">No images assigned.</li>}
                  {sliderImages.map((a, i) => (
                    <li key={i} className="flex flex-col items-center gap-2">
                      <div className="relative h-24 w-48">
                        <Image 
                          src={a.imageUrl} 
                          alt="slider" 
                          fill
                          className="object-cover rounded border"
                          sizes="192px"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Our Flies Section Images</h2>
                <ul className="flex gap-4 flex-wrap">
                  {ourFliesImages.length === 0 && <li className="text-gray-500">No images assigned.</li>}
                  {ourFliesImages.map((a, i) => (
                    <li key={i} className="flex flex-col items-center gap-2">
                      <div className="relative h-24 w-48">
                        <Image 
                          src={a.imageUrl} 
                          alt="our flies" 
                          fill
                          className="object-cover rounded border"
                          sizes="192px"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">About Us Images</h2>
                <ul className="flex gap-4 flex-wrap">
                  {aboutUsImages.length === 0 && <li className="text-gray-500">No images assigned.</li>}
                  {aboutUsImages.map((a, i) => (
                    <li key={i} className="flex flex-col items-center gap-2">
                      <div className="relative h-24 w-48">
                        <Image 
                          src={a.imageUrl} 
                          alt="about us" 
                          fill
                          className="object-cover rounded border"
                          sizes="192px"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
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
      </div>
      
      {/* Vendor Request Details Modal */}
      <VendorRequestModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
} 