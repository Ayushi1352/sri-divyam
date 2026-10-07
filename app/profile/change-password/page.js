"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { apiClient } from "../../utils/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
    const { logout } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
    const [formData, setFormData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleShowPassword = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });

        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setMessage({ type: "error", text: "Please fill in all fields." });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: "error", text: "New password and confirm password do not match." });
            return;
        }

        if (formData.newPassword.length < 6) {
            setMessage({ type: "error", text: "New password must be at least 6 characters long." });
            return;
        }

        setIsLoading(true);
        try {
            const data = await apiClient.put("/api/auth/change-password", {
                oldPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            
            setMessage({ type: "success", text: data.message || "Password updated successfully!" });
            setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
            setMessage({ type: "error", text: error.message || "Failed to update password." });
        } finally {
            setIsLoading(false);
        }
    };

    const renderInputField = (label, name, fieldKey) => (
        <div className="space-y-2">
            <label className="text-[15px] font-medium text-[#4b5563]">{label}</label>
            <div className="relative group max-w-xl">
                <input
                    type={showPassword[fieldKey] ? "text" : "password"}
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                    placeholder="........"
                    className="w-full pl-4 pr-11 py-3 bg-white border border-gray-200 outline-none transition-all duration-300 rounded-md text-[14px] tracking-widest focus:border-[#135B42] hover:border-gray-300 text-gray-800 shadow-sm"
                />
                <button
                    type="button"
                    onClick={() => toggleShowPassword(fieldKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#135B42] transition-colors"
                >
                    {showPassword[fieldKey] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-[#FBF9F6] rounded-xl border border-gray-200 p-4 sm:p-6 md:p-8 w-full min-w-0 animate-in fade-in duration-300">
            <div className="mb-4">
                <h2 className="text-[18px] sm:text-[22px] font-bold text-[#135B42] mb-1.5">Change Account Password</h2>
                <p className="text-[13px] sm:text-[15px] text-gray-600">Ensure your account is protected with a strong password.</p>
            </div>
            
            <hr className="border-gray-300 mb-8" />

            {message.text && (
                <div className={`mb-6 p-4 rounded-md text-[14px] font-medium max-w-xl ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {renderInputField("Current Account Password", "currentPassword", "current")}
                {renderInputField("New Account Password", "newPassword", "new")}
                {renderInputField("Confirm New Password", "confirmPassword", "confirm")}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-8 py-3 bg-[#0F4A36] text-white font-bold text-[14px] rounded-md hover:bg-[#135B42] transition-colors shadow-md flex items-center justify-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                        {isLoading ? (
                            <><Loader2 className="animate-spin" size={16} /> Updating...</>
                        ) : (
                            "Update Password"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
