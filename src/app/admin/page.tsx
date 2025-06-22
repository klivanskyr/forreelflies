'use client';
import { useState, useEffect } from "react";
import { uploadFileAndGetUrl } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";

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
  const [view, setView] = useState<'images' | 'vendor-requests'>("images");
  const [vendorRequests, setVendorRequests] = useState<any[]>([]);
  const [vendorMessage, setVendorMessage] = useState("");
  const [vendorTab, setVendorTab] = useState<'pending' | 'accepted'>("pending");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/v1/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      setLoggedIn(true);
    } else {
      setLoginError("Invalid credentials");
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

  // Fetch vendor requests
  useEffect(() => {
    if (loggedIn && view === "vendor-requests") {
      fetch("/api/v1/vendor/request-vendor")
        .then(res => res.json())
        .then(data => setVendorRequests(data.requests || []));
    }
  }, [loggedIn, view]);

  const handleApprove = async (uid: string) => {
    setVendorMessage("");
    const res = await fetch(`/api/v1/vendor/approve-vendor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    if (res.ok) {
      setVendorMessage("Vendor approved!");
      setVendorRequests(vendorRequests.filter(r => r.uid !== uid));
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
      body: JSON.stringify({ uid }),
    });
    if (res.ok) {
      setVendorRequests(vendorRequests.filter(r => r.uid !== uid));
      setVendorMessage("Vendor denied and status updated.");
    } else {
      setVendorMessage("Failed to deny vendor");
    }
  };

  // Filter vendor requests by tab
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
                      <img src={a.imageUrl} alt="slider" className="h-24 w-48 object-cover rounded border" />
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
                      <img src={a.imageUrl} alt="our flies" className="h-24 w-48 object-cover rounded border" />
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
                      <img src={a.imageUrl} alt="about us" className="h-24 w-48 object-cover rounded border" />
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
            {vendorMessage && <div className="mb-2 text-green-700">{vendorMessage}</div>}
            {filteredVendorRequests.length === 0 ? (
              <div>No vendor requests found.</div>
            ) : (
              <ul className="space-y-4">
                {filteredVendorRequests.map((req, i) => (
                  <li key={i} className="border rounded p-4 flex flex-col gap-2">
                    <div><span className="font-semibold">Name:</span> {req.name}</div>
                    <div><span className="font-semibold">Email:</span> {req.email}</div>
                    <div><span className="font-semibold">Store Name:</span> {req.storeName}</div>
                    <div><span className="font-semibold">Description:</span> {req.storeDescription}</div>
                    <div className="flex gap-8 mt-2 text-sm text-gray-600">
                      <span><span className="font-semibold">Created At:</span> {formatDate(req.createdAt)}</span>
                      <span><span className="font-semibold">Accepted At:</span> {formatDate(req.acceptedAt)}</span>
                    </div>
                    {vendorTab === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => handleApprove(req.uid)}>Approve</button>
                        <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => handleDeny(req.uid)}>Deny</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 