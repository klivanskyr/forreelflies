import React, { useState } from "react";
import { uploadFileAndGetUrl } from "@/lib/firebase";

export default function StoreManagerVendorProfileEditor({ vendor, onSave }: { vendor: any, onSave?: () => void }) {
  const [bannerImageUrl, setBannerImageUrl] = useState(vendor.bannerImageUrl || "");
  const [profileImageUrl, setProfileImageUrl] = useState(vendor.profileImageUrl || "");
  const [bio, setBio] = useState(vendor.bio || "");
  const [socialLinks, setSocialLinks] = useState(vendor.socialLinks || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingBanner(true);
    const file = e.target.files[0];
    const url = await uploadFileAndGetUrl(file, `vendors/${vendor.id}/banner_${Date.now()}`);
    setBannerImageUrl(url);
    setUploadingBanner(false);
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingProfile(true);
    const file = e.target.files[0];
    const url = await uploadFileAndGetUrl(file, `vendors/${vendor.id}/profile_${Date.now()}`);
    setProfileImageUrl(url);
    setUploadingProfile(false);
  };

  const handleSave = async () => {
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
      setMessage("Profile updated!");
      onSave && onSave();
    } else {
      setMessage("Failed to update profile");
    }
    setSaving(false);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Customize Your Storefront</h2>
      <div className="mb-2">
        <label className="block font-medium">Banner Image</label>
        {bannerImageUrl && <img src={bannerImageUrl} alt="Banner" className="w-full h-32 object-cover rounded mb-2" />}
        <input type="file" accept="image/*" onChange={handleBannerUpload} />
        {uploadingBanner && <span className="ml-2 text-sm text-gray-500">Uploading...</span>}
      </div>
      <div className="mb-2">
        <label className="block font-medium">Profile Image</label>
        {profileImageUrl && <img src={profileImageUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover mb-2" />}
        <input type="file" accept="image/*" onChange={handleProfileUpload} />
        {uploadingProfile && <span className="ml-2 text-sm text-gray-500">Uploading...</span>}
      </div>
      <div className="mb-2">
        <label className="block font-medium">Bio</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full border rounded p-2" />
      </div>
      <div className="mb-2">
        <label className="block font-medium">Social Links</label>
        {socialLinks.map((link: any, i: number) => (
          <div key={i} className="flex gap-2 mb-1">
            <input
              value={link.type}
              onChange={e => {
                const newLinks = [...socialLinks];
                newLinks[i].type = e.target.value;
                setSocialLinks(newLinks);
              }}
              placeholder="Type (e.g. Instagram)"
              className="border rounded p-1 w-1/3"
            />
            <input
              value={link.url}
              onChange={e => {
                const newLinks = [...socialLinks];
                newLinks[i].url = e.target.value;
                setSocialLinks(newLinks);
              }}
              placeholder="URL"
              className="border rounded p-1 w-2/3"
            />
            <button onClick={() => setSocialLinks(socialLinks.filter((_: any, j: number) => j !== i))} className="text-red-500">Remove</button>
          </div>
        ))}
        <button onClick={() => setSocialLinks([...socialLinks, { type: "", url: "" }])} className="text-blue-600 underline mt-1">Add Social Link</button>
      </div>
      <button onClick={handleSave} disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded mt-2">
        {saving ? "Saving..." : "Save Changes"}
      </button>
      {message && <div className="mt-2 text-green-700">{message}</div>}
    </div>
  );
} 