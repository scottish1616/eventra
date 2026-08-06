"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  Image as ImageIcon, Upload, RefreshCw, CheckCircle,
  Clock, Trash2, Eye, ChevronRight, Shield
} from "lucide-react";

type AssetName = "hero_background" | "auth_background" | "about_banner" | "footer_banner";

interface AssetInfo {
  name: AssetName;
  label: string;
  description: string;
  recommended: string;
}

const ASSETS: AssetInfo[] = [
  {
    name: "hero_background",
    label: "Hero Background",
    description: "Full-screen background image displayed on the homepage hero section",
    recommended: "1920×1080px or wider · JPG/PNG · < 5MB",
  },
  {
    name: "auth_background",
    label: "Auth Background",
    description: "Background image for the login and register pages",
    recommended: "1200×800px · JPG/PNG · < 3MB",
  },
  {
    name: "about_banner",
    label: "About Page Banner",
    description: "Header banner image for the About Us page",
    recommended: "1600×600px · JPG/PNG · < 3MB",
  },
  {
    name: "footer_banner",
    label: "Footer Banner",
    description: "Decorative image displayed in the site footer",
    recommended: "1600×400px · JPG/PNG · < 2MB",
  },
];

interface AssetState {
  imageUrl: string | null;
  updatedAt: string | null;
  loading: boolean;
  uploading: boolean;
  preview: string | null;
  file: File | null;
}

const defaultState = (): AssetState => ({
  imageUrl: null,
  updatedAt: null,
  loading: true,
  uploading: false,
  preview: null,
  file: null,
});

export default function ContentManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeAsset, setActiveAsset] = useState<AssetName>("hero_background");
  const [assets, setAssets] = useState<Record<AssetName, AssetState>>({
    hero_background: defaultState(),
    auth_background: defaultState(),
    about_banner: defaultState(),
    footer_banner: defaultState(),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (!["ADMIN", "OVERSEER"].includes(user?.role || "")) {
      router.push("/dashboard/organizer");
      return;
    }
    // Load all assets
    ASSETS.forEach((a) => loadAsset(a.name));
  }, [status, session]);

  const loadAsset = async (name: AssetName) => {
    setAssets((prev) => ({ ...prev, [name]: { ...prev[name], loading: true } }));
    try {
      const res = await fetch(`/api/site-assets/${name}`);
      const json = await res.json();
      setAssets((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          loading: false,
          imageUrl: json.imageUrl || null,
          updatedAt: json.updatedAt || null,
        },
      }));
    } catch {
      setAssets((prev) => ({ ...prev, [name]: { ...prev[name], loading: false } }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast.error("File too large. Max 6MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAssets((prev) => ({
        ...prev,
        [activeAsset]: { ...prev[activeAsset], preview: ev.target?.result as string, file },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const asset = assets[activeAsset];
    if (!asset.file) { toast.error("Please select an image first."); return; }

    setAssets((prev) => ({ ...prev, [activeAsset]: { ...prev[activeAsset], uploading: true } }));
    try {
      const formData = new FormData();
      formData.append("image", asset.file);
      const res = await fetch(`/api/site-assets/${activeAsset}`, { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAssets((prev) => ({
        ...prev,
        [activeAsset]: {
          ...prev[activeAsset],
          uploading: false,
          imageUrl: json.data.imageUrl,
          updatedAt: json.data.updatedAt,
          preview: null,
          file: null,
        },
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Image updated successfully!");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
      setAssets((prev) => ({ ...prev, [activeAsset]: { ...prev[activeAsset], uploading: false } }));
    }
  };

  const handleRestore = async () => {
    if (!confirm("Restore default background? The current image will be removed.")) return;
    try {
      const res = await fetch(`/api/site-assets/${activeAsset}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAssets((prev) => ({
        ...prev,
        [activeAsset]: { ...defaultState(), loading: false },
      }));
      toast.success("Restored to default");
    } catch (e: any) {
      toast.error(e.message || "Failed to restore");
    }
  };

  const cancelPreview = () => {
    setAssets((prev) => ({ ...prev, [activeAsset]: { ...prev[activeAsset], preview: null, file: null } }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const timeAgo = (date: string | null) => {
    if (!date) return "Never updated";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const current = assets[activeAsset];
  const currentInfo = ASSETS.find((a) => a.name === activeAsset)!;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" toastOptions={{
        style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151", borderRadius: "12px", fontSize: "13px" },
      }} />

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-300 font-medium">Content Management</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Content Management</h1>
              <p className="text-xs text-gray-500">Manage site images and backgrounds</p>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-purple-400 font-semibold">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-6">
        {/* Sidebar — asset list */}
        <aside className="w-56 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Site Assets
          </p>
          <nav className="space-y-1">
            {ASSETS.map((asset) => {
              const state = assets[asset.name];
              return (
                <button
                  key={asset.name}
                  onClick={() => setActiveAsset(asset.name)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all relative ${
                    activeAsset === asset.name
                      ? "bg-purple-600/20 text-white border border-purple-500/30"
                      : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <ImageIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-left leading-tight">{asset.label}</span>
                  {state.imageUrl && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main editor panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAsset}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {/* Asset header */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-white">{currentInfo.label}</h2>
                    <p className="text-sm text-gray-500 mt-1">{currentInfo.description}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Recommended: {currentInfo.recommended}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {timeAgo(current.updatedAt)}
                  </div>
                </div>
              </div>

              {/* Current image preview */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    Current image
                  </p>
                  {current.imageUrl && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>

                <div className="relative h-64 bg-gray-800/50">
                  {current.loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-purple-800 border-t-purple-400 rounded-full animate-spin" />
                    </div>
                  ) : current.preview ? (
                    <>
                      <img src={current.preview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
                      <div className="absolute top-3 left-3 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-xs text-yellow-400 font-semibold">
                        Preview — not saved yet
                      </div>
                    </>
                  ) : current.imageUrl ? (
                    <>
                      <img src={current.imageUrl} alt={currentInfo.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/40" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-500 text-sm">No custom image — using default gradient</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload section */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">
                  {current.imageUrl ? "Replace image" : "Upload image"}
                </h3>

                {/* Drop zone */}
                <div
                  className="border-2 border-dashed border-gray-700 hover:border-purple-500/50 rounded-2xl p-8 text-center transition-all cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-600 group-hover:text-purple-400 mx-auto mb-3 transition-colors" />
                  <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors font-medium">
                    Click to select an image
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{currentInfo.recommended}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={handleUpload}
                    disabled={!current.file || current.uploading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
                  >
                    {current.uploading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {current.uploading ? "Uploading..." : "Upload & apply"}
                  </button>

                  {current.preview && (
                    <button
                      onClick={cancelPreview}
                      className="px-4 py-2.5 bg-gray-800 text-gray-400 text-sm rounded-xl hover:bg-gray-700 transition-all"
                    >
                      Cancel
                    </button>
                  )}

                  {current.imageUrl && !current.preview && (
                    <button
                      onClick={handleRestore}
                      className="flex items-center gap-2 ml-auto px-4 py-2.5 text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Restore default
                    </button>
                  )}
                </div>
              </div>

              {/* Info card */}
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4">
                <p className="text-xs font-semibold text-purple-400 mb-1">💡 How it works</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Images are stored in Supabase cloud storage. The site fetches the latest active image on each page load — no redeployment needed. Restoring defaults removes the custom image and reverts to the built-in gradient.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
