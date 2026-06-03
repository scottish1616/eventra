"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { User, Mail, Phone, Building2, ArrowRight, ArrowLeft, Loader } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organizationName: string | null;
  organizationLogo: string | null;
  image: string | null;
  bio: string | null;
  mpesaPaybill: string | null;
  role: string;
  approvalStatus: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    organizationName: "",
    organizationLogo: "",
    image: "",
    bio: "",
    mpesaPaybill: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (json.success && json.data) {
        setProfile(json.data);
        setFormData({
          name: json.data.name || "",
          phone: json.data.phone || "",
          organizationName: json.data.organizationName || "",
          organizationLogo: json.data.organizationLogo || "",
          image: json.data.image || "",
          bio: json.data.bio || "",
          mpesaPaybill: json.data.mpesaPaybill || "",
        });
        setImagePreview(json.data.image || null);
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImagePreview(profile?.image || null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
        setFormData((prev) => ({ ...prev, image: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update profile");
      }
      setProfile(json.data);
      toast.success("Profile updated successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              const destination =
                session?.user?.role === "ORGANIZER"
                  ? "/dashboard/organizer"
                  : session?.user?.role === "ADMIN"
                  ? "/dashboard/admin"
                  : "/";
              router.push(destination);
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-500 text-sm mt-2">
              Manage your account information
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
          {/* Account Status */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
              Account Status
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Role</p>
                <p className="font-semibold text-gray-900 mt-1 capitalize">
                  {profile.role || "User"}
                </p>
              </div>
              {profile.role === "ORGANIZER" && (
                <div>
                  <p className="text-gray-500">Approval Status</p>
                  <p
                    className={`font-semibold mt-1 capitalize ${
                      profile.approvalStatus === "APPROVED"
                        ? "text-green-600"
                        : profile.approvalStatus === "PENDING"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {profile.approvalStatus || "Pending"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="block">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Full Name
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Email (Read-only)
                </span>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm bg-gray-50 text-gray-500"
                />
              </label>

              <div className="col-span-1 md:col-span-2">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Profile picture
                </span>
                <div className="mt-2 flex flex-col md:flex-row items-start gap-4">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-dashed border-gray-300 bg-white">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400 text-center px-2">
                        No image selected
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="profileImage"
                      className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
                    >
                      Choose file
                    </label>
                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2 hidden"
                    />
                    <p className="text-xs text-gray-500">
                      Select a local image from your device. The selected image will preview immediately.
                    </p>
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Phone
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0712 345 678"
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </label>
            </div>

            {formData.image && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Preview
                </p>
                <img
                  src={formData.image}
                  alt="Profile preview"
                  className="mt-2 h-24 w-24 rounded-full object-cover border border-gray-200"
                />
              </div>
            )}

            <label className="block">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Biography
              </span>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                rows={4}
                placeholder="Write a short bio about yourself or your business"
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>

            {profile.role === "ORGANIZER" && (
              <div className="space-y-6">
                <label className="block">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Organization Name
                  </span>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    placeholder="Your company name"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Organization logo URL
                  </span>
                  <input
                    type="url"
                    name="organizationLogo"
                    value={formData.organizationLogo}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    M-Pesa Paybill
                  </span>
                  <input
                    type="text"
                    name="mpesaPaybill"
                    value={formData.mpesaPaybill}
                    onChange={handleChange}
                    placeholder="Business number"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Account verified:</span> Your
              email has been verified
            </p>
          </div>
          {profile.role === "ORGANIZER" &&
            profile.approvalStatus === "PENDING" && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
                <p className="text-sm text-yellow-900">
                  <span className="font-semibold">Awaiting approval:</span>{" "}
                  Admin will review your request soon
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
