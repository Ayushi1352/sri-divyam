"use client";

import { useAuth } from "../context/AuthContext";
import { PenSquare, Loader2, X, Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "../utils/apiClient";
import { useRouter } from "next/navigation";

export default function ProfileSettingsPage() {
    const { user, loading, logout, login } = useAuth();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const userName = user?.name || user?.username || user?.full_name || "User";
    const userEmail = user?.email || "No email available";
    const rawMobile = user?.phone || user?.mobile || user?.mobile_number || user?.phone_number || user?.contact_number;
    const userPhone = (!rawMobile || rawMobile === "Not provided" || rawMobile === "null" || rawMobile === "undefined") 
        ? (user?.addresses?.[0]?.mobile || "Not provided")
        : rawMobile;

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: userName,
        email: userEmail,
        mobile: userPhone,
        addresses: user?.addresses || []
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [showRemoveAvatarModal, setShowRemoveAvatarModal] = useState(false);

    const [avatarKey, setAvatarKey] = useState(Date.now());
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Update editForm when user loads (since it might load after initial mount)
    useEffect(() => {
        if (user) {
            setEditForm({
                name: user.name || user.username || user.full_name || "User",
                email: user.email || "No email available",
                mobile: (() => {
                    const rMobile = user.phone || user.mobile || user.mobile_number || user.phone_number || user.contact_number;
                    return (!rMobile || rMobile === "Not provided" || rMobile === "null" || rMobile === "undefined")
                        ? (user.addresses?.[0]?.mobile || "Not provided")
                        : rMobile;
                })(),
                addresses: user.addresses || []
            });
        }
    }, [user]);

    if (!isClient || loading) {
        return <div className="animate-pulse bg-gray-100 rounded-xl h-64 w-full"></div>;
    }

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setEditError("");
        try {
            const payload = {
                ...editForm,
                phone: editForm.mobile,
                mobile_number: editForm.mobile,
                phone_number: editForm.mobile
            };
            const data = await apiClient.put("/api/auth/profile", payload);

            // Update context without reloading the page
            const currentToken = localStorage.getItem("token") || token;
            const updatedUser = { ...user, name: editForm.name, email: editForm.email, phone: editForm.mobile };

            if (data && data.user) {
                login({ ...user, ...data.user }, currentToken);
            } else if (data && data.data) {
                login({ ...user, ...data.data }, currentToken);
            } else {
                login(updatedUser, currentToken);
            }

            setIsEditing(false);
            setEditLoading(false);
            showToast("Profile details updated successfully!");
        } catch (error) {
            setEditError(error.message || "Failed to update profile");
            setEditLoading(false);
        }
    };

    const handleDeactivate = async () => {
        setIsDeactivating(true);
        try {
            await apiClient.delete("/api/auth/delete-account");
            setShowDeactivateModal(false);
            showToast("Account deactivated successfully.");
            setTimeout(() => {
                logout();
                router.push("/login");
            }, 2000);
        } catch (error) {
            alert(error.message || "Failed to deactivate account");
            setIsDeactivating(false);
            setShowDeactivateModal(false);
        }
    };



    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("avatar", file);

        setAvatarLoading(true);
        try {
            // apiClient handles FormData automatically by deleting the Content-Type header
            await apiClient.put("/api/auth/avatar", formData);
            const token = localStorage.getItem("token");
            const updatedProfile = await apiClient.get(`/api/auth/profile?t=${Date.now()}`);
            const freshUser = updatedProfile.user || updatedProfile.data || updatedProfile;
            if (freshUser) login(freshUser, token);
            setAvatarKey(Date.now());
            showToast("Profile photo uploaded successfully!");
        } catch (error) {
            alert(error.message);
        } finally {
            setAvatarLoading(false);
            e.target.value = null; // reset
        }
    };

    const handleAvatarRemove = async () => {
        setAvatarLoading(true);
        try {
            await apiClient.delete("/api/auth/avatar");
            const token = localStorage.getItem("token");
            const updatedProfile = await apiClient.get(`/api/auth/profile?t=${Date.now()}`);
            const freshUser = updatedProfile.user || updatedProfile.data || updatedProfile;
            if (freshUser) login(freshUser, token);
            setAvatarKey(Date.now());
            setShowRemoveAvatarModal(false);
            showToast("Profile photo removed successfully!");
        } catch (error) {
            alert(error.message || "Failed to remove avatar");
        } finally {
            setAvatarLoading(false);
        }
    };

    return (
        <div className="space-y-6 min-w-0">
            {/* Header / Avatar Section */}
            <div className="flex items-center gap-4 sm:gap-6 pb-6 border-b border-gray-200 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-[#E8F0EA] flex items-center justify-center text-[#135B42] font-bold text-xl sm:text-2xl md:text-3xl shrink-0 overflow-hidden shadow-sm">
                    {avatarLoading ? (
                        <Loader2 size={24} className="animate-spin text-[#135B42]" />
                    ) : (user?.avatar && user.avatar !== "undefined" && user.avatar !== "null") ? (
                        <img src={user.avatar.startsWith('http') ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL}/${user.avatar.replace(/^\/+/, '')}?v=${avatarKey}`} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        getInitials(userName)
                    )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                    <h2 className="text-[16px] sm:text-[18px] md:text-[20px] font-bold text-[#1F2937] truncate">{userName}</h2>
                    <p className="text-[12px] sm:text-[14px] text-gray-500 mb-2 sm:mb-4 break-all">{userEmail}</p>

                    {isEditing && (
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <label className="bg-[#135B42] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-[11px] sm:text-[13px] font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#0f4a35] transition-colors shadow-sm">
                                <Camera size={14} className="sm:w-4 sm:h-4" />
                                {user?.avatar ? "Change Photo" : "Upload Photo"}
                                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={avatarLoading} />
                            </label>

                            {user?.avatar && (
                                <button
                                    onClick={() => setShowRemoveAvatarModal(true)}
                                    disabled={avatarLoading}
                                    className="border border-red-500 text-red-500 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-[11px] sm:text-[13px] font-bold hover:bg-red-50 transition-colors bg-white"
                                >
                                    Remove Photo
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Personal Details Section */}
            <div className="bg-[#FBF9F6] rounded-xl border border-gray-200 p-4 sm:p-6 md:p-8 min-w-0">
                <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
                    <h3 className="text-[16px] sm:text-[18px] md:text-[20px] font-medium text-[#1F2937]">Personal Details</h3>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[14px] font-medium text-[#135B42] hover:opacity-80 transition-opacity shrink-0">
                            <PenSquare size={15} />
                            Edit Details
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleEditSubmit} className="mt-4 sm:mt-6">
                        {editError && <div className="text-red-500 text-xs sm:text-sm bg-red-50 p-2 rounded border border-red-100 mb-4 sm:mb-6">{editError}</div>}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-4 sm:gap-y-6 gap-x-8">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                                <span className="text-[13px] sm:text-[15px] font-medium text-[#303030] shrink-0">Full Name -</span>
                                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full sm:flex-1 bg-white sm:bg-transparent text-[13px] sm:text-[15px] text-gray-700 outline-none border border-gray-200 sm:border-none rounded sm:rounded-none px-2.5 py-1.5 sm:p-0 focus:ring-1 focus:ring-[#135B42]" required />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                                <span className="text-[13px] sm:text-[15px] font-medium text-[#303030] shrink-0">Mobile Number -</span>
                                <input type="text" value={editForm.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })} className="w-full sm:flex-1 bg-white sm:bg-transparent text-[13px] sm:text-[15px] text-gray-700 outline-none border border-gray-200 sm:border-none rounded sm:rounded-none px-2.5 py-1.5 sm:p-0 focus:ring-1 focus:ring-[#135B42]" required />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:col-span-2 min-w-0">
                                <span className="text-[13px] sm:text-[15px] font-medium text-[#303030] shrink-0">Email Address -</span>
                                <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full sm:flex-1 bg-white sm:bg-transparent text-[13px] sm:text-[15px] text-gray-700 outline-none border border-gray-200 sm:border-none rounded sm:rounded-none px-2.5 py-1.5 sm:p-0 focus:ring-1 focus:ring-[#135B42] break-all" required />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 sm:pt-8">
                            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-1.5 sm:px-6 sm:py-2 rounded bg-white text-[12px] sm:text-[14px] font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                                Cancel
                            </button>
                            <button type="submit" disabled={editLoading} className="bg-[#135B42] text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded text-[12px] sm:text-[14px] font-medium flex items-center gap-2 hover:bg-[#0f4a35] transition-colors shadow-sm">
                                {editLoading && <Loader2 size={16} className="animate-spin" />} 
                                Save Details
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-4 sm:gap-y-6 gap-x-8 mt-4 sm:mt-6">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                            <span className="text-[13px] sm:text-[15px] font-medium text-[#303030] shrink-0">Full Name -</span>
                            <span className="text-[13px] sm:text-[15px] text-gray-600 break-words">{userName}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                            <span className="text-[13px] sm:text-[15px] font-medium text-[#303030] shrink-0">Mobile Number -</span>
                            <span className="text-[13px] sm:text-[15px] text-gray-600 break-words">{userPhone}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 lg:col-span-2 min-w-0">
                            <span className="text-[13px] sm:text-[15px] font-medium text-[#303030] shrink-0">Email Address -</span>
                            <span className="text-[13px] sm:text-[15px] text-gray-600 break-all">{userEmail}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Deactivate Account Section */}
            <div className="bg-[#fff1f2] rounded-xl border border-[#fecdd3] p-4 sm:p-6 md:p-8 min-w-0">
                <h3 className="text-[16px] sm:text-[18px] font-medium text-[#9f1239] mb-2">Deactivate Account</h3>
                <p className="text-[12px] sm:text-[14px] text-[#e11d48] mb-4 sm:mb-6 leading-relaxed max-w-3xl">
                    Deactivates your profile. You will be signed out immediately, and can only log back in if an administrator reactivates your account.
                </p>
                <button
                    onClick={() => setShowDeactivateModal(true)}
                    disabled={isDeactivating}
                    className="bg-[#dc2626] hover:bg-[#b91c1c] text-white text-[13px] sm:text-[15px] font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded transition-colors flex items-center gap-2 w-max"
                >
                    {isDeactivating ? <Loader2 size={16} className="animate-spin" /> : null}
                    Deactivate Account
                </button>
            </div>

            {/* Custom Deactivate Modal */}
            {showDeactivateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-[450px] overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-[#fff1f2] px-6 py-4 flex items-center justify-between border-b border-[#ffe4e6]">
                            <h3 className="text-[#be123c] text-[17px] font-bold">Deactivate Account</h3>
                            <button onClick={() => setShowDeactivateModal(false)} className="text-[#e11d48] hover:text-[#9f1239]">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 pb-8">
                            <p className="text-[#303030] text-[14px] md:text-[15px] leading-relaxed">
                                Are you sure you want to deactivate your profile? You will not be able to log back in until an administrator reactivates your account.
                            </p>
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setShowDeactivateModal(false)}
                                className="px-5 py-2 rounded-md bg-white border border-gray-300 text-[14px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeactivate}
                                disabled={isDeactivating}
                                className="px-5 py-2 rounded-md bg-[#e00000] hover:bg-[#be0000] text-white text-[14px] font-bold transition-colors shadow-sm flex items-center gap-2"
                            >
                                {isDeactivating && <Loader2 size={16} className="animate-spin" />}
                                Deactivate Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Remove Photo Modal */}
            {showRemoveAvatarModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-[450px] overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-[#fff1f2] px-6 py-4 flex items-center justify-between border-b border-[#ffe4e6]">
                            <h3 className="text-[#be123c] text-[17px] font-bold">Confirm Removal</h3>
                            <button onClick={() => setShowRemoveAvatarModal(false)} className="text-[#e11d48] hover:text-[#9f1239]">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 pb-8">
                            <p className="text-[#303030] text-[15px] leading-relaxed font-medium">
                                Are you sure you want to remove your profile photo?
                            </p>
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setShowRemoveAvatarModal(false)}
                                className="px-5 py-2.5 rounded-md bg-white border border-gray-300 text-[14px] font-bold text-[#1F2937] hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAvatarRemove}
                                disabled={avatarLoading}
                                className="px-5 py-2.5 rounded-md bg-[#e00000] hover:bg-[#be0000] text-white text-[14px] font-bold transition-colors shadow-sm flex items-center gap-2"
                            >
                                {avatarLoading && <Loader2 size={16} className="animate-spin" />}
                                Remove Photo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-24 right-4 z-[9999] bg-[#F8FAF9] px-5 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-[#1f2937] flex items-start sm:items-center gap-3 transition-all duration-300 animate-in slide-in-from-top-2 max-w-[400px] border border-gray-100">
                    <div className="shrink-0 mt-0.5 sm:mt-0">
                        {toast.type === 'error' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        )}
                    </div>
                    <span className="text-[15px] font-medium leading-snug flex-1">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2 -mr-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            )}
        </div>
    );
}
