"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Eye, EyeOff, Lock, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { apiClient } from "../utils/apiClient";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState("");
    const [email, setEmail] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        code: "",
        password: "",
        password_confirmation: ""
    });
    const [errors, setErrors] = useState({});
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        let currentToken = searchParams?.get("token") || "";
        let currentEmail = searchParams?.get("email") || "";

        if (typeof window !== "undefined") {
            if (!currentEmail) {
                const urlParams = new URLSearchParams(window.location.search);
                currentEmail = urlParams.get("email") || "";
            }
            if (!currentToken) {
                // Extract token from either query param or path
                const urlParams = new URLSearchParams(window.location.search);
                currentToken = urlParams.get("token") || "";
                
                if (!currentToken) {
                    const pathParts = window.location.pathname.split('/');
                    const lastPart = pathParts[pathParts.length - 1];
                    if (lastPart && lastPart !== 'reset-password') {
                        currentToken = lastPart;
                    }
                }
            }
        }

        if (!currentEmail) {
            setStatus({ type: "error", message: "Invalid reset link. Missing email information." });
        } else {
            setEmail(currentEmail);
            if (currentToken) {
                setFormData(prev => ({ ...prev, code: currentToken }));
            }
        }
        setIsMounted(true);
    }, [searchParams]);

    useEffect(() => {
        if (isMounted) {
            if (!email) {
                setStatus({ type: "error", message: `Invalid reset attempt. Missing email. Please request a new link.` });
            } else if (status.type === "error" && status.message.includes("Invalid")) {
                // Clear the error if email is now present
                setStatus({ type: "", message: "" });
            }
        }
    }, [token, email, isMounted]);

    const validateField = (name, value) => {
        let error = "";
        if (!value.trim()) {
            if (name === "code") error = "OTP code is required";
            else error = `${name === "password" ? "Password" : "Confirm Password"} is required`;
        } else if (name === "password" && value.length < 8) {
            error = "Password must be at least 8 characters";
        } else if (name === "password_confirmation" && value !== formData.password) {
            error = "Passwords do not match";
        }
        return error;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) return;

        const cError = validateField("code", formData.code);
        const pError = validateField("password", formData.password);
        const cpError = validateField("password_confirmation", formData.password_confirmation);

        if (cError || pError || cpError) {
            setErrors({ code: cError, password: pError, password_confirmation: cpError });
            return;
        }

        setIsLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const data = await apiClient.post("/api/auth/reset-password", {
                email: email.trim(),
                code: formData.code.trim(),
                newPassword: formData.password,
                role: "customer"
            });
            console.log("🔑 Reset Password API Response:", data);

            // Check for success - look for success flag, status field, or message
            const isSuccess = data.success !== false && data.status !== "error";

            if (isSuccess) {
                setStatus({ type: "success", message: data.message || "Password has been reset successfully! Redirecting to login..." });
                setTimeout(() => router.push("/login"), 3000);
            } else {
                setStatus({ type: "error", message: data.message || data.error || "Failed to reset password. Link might be expired. Please request a new one." });
            }
        } catch (error) {
            console.error("Reset Password Error:", error);
            setStatus({ type: "error", message: ` ${error.message || "Please try again later."}` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="bg-white min-h-screen flex flex-col font-primary">
            <Header />
            
            <div className="flex-1 flex items-center justify-center bg-[#F9F7F5] pt-10 pb-20 px-4 sm:px-6">
                {!isMounted ? (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                        <Loader2 className="animate-spin mb-2" size={24} />
                        <p className="text-sm">Verifying secure link...</p>
                    </div>
                ) : (
                    <div className="w-full max-w-[420px] bg-white border border-[#E8DDD4] p-6 sm:p-10 shadow-2xl rounded-sm">
                    
                    <div className="text-center mb-8">
                        <h1 className="text-2xl sm:text-4xl font-playfair font-bold text-[#303030] mb-3">New Password</h1>
                        <p className="text-sm text-gray-500 italic">Create a strong password for your account</p>
                    </div>

                    {status.message && (
                        <div className={`mb-6 p-4 rounded-sm flex items-start gap-3 animate-in fade-in zoom-in duration-300 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                            {status.type === "success" ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                            <p className="text-[13px] font-medium leading-tight">{status.message}</p>
                        </div>
                    )}

                    {(!email) && status.type === "error" ? (
                        <div className="text-center pt-4">
                            <button 
                                onClick={() => router.push("/forgot-password")}
                                className="text-[#135B42] font-bold uppercase tracking-widest text-xs hover:underline"
                            >
                                Request New Link
                            </button>
                        </div>
                    ) : (
                            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off" noValidate>
                                {/* OTP / Code */}
                                <div className="space-y-2">
                                    <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400">Reset Code (OTP)</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            placeholder="Enter the code sent to your email"
                                            autoComplete="one-time-code"
                                            className={`w-full px-4 py-3 border outline-none transition-all duration-300 rounded-sm text-sm ${errors.code ? "border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-100" : "border-gray-200 focus:border-[#135B42] focus:shadow-sm"} text-gray-800 text-center tracking-widest font-semibold`}
                                        />
                                    </div>
                                    {errors.code && (
                                        <p className="text-[11px] text-red-600 font-medium flex items-center gap-1.5 mt-1.5 animate-in slide-in-from-top-1">
                                            <AlertCircle size={12} /> {errors.code}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400">New Password</label>
                                    <div className="relative group">
                                        <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.password ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={16} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            className={`w-full pl-10 pr-16 py-3 border outline-none transition-all duration-300 rounded-sm text-sm ${errors.password ? "border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-100" : "border-gray-200 focus:border-[#135B42] focus:shadow-sm"} text-gray-800`}
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                            {formData.password && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, password: "" }))}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-gray-400 hover:text-[#135B42] transition-colors p-1"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    {errors.password && (
                                        <p className="text-[11px] text-red-600 font-medium flex items-center gap-1.5 mt-1.5 animate-in slide-in-from-top-1">
                                            <AlertCircle size={12} /> {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400">Confirm Password</label>
                                    <div className="relative group">
                                        <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.password_confirmation ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={16} />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="password_confirmation"
                                            value={formData.password_confirmation}
                                            onChange={handleInputChange}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            className={`w-full pl-10 pr-16 py-3 border outline-none transition-all duration-300 rounded-sm text-sm ${errors.password_confirmation ? "border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-100" : "border-gray-200 focus:border-[#135B42] focus:shadow-sm"} text-gray-800`}
                                        />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                        {formData.password_confirmation && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, password_confirmation: "" }))}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="text-gray-400 hover:text-[#135B42] transition-colors p-1"
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="text-[11px] text-red-600 font-medium flex items-center gap-1.5 mt-1.5 animate-in slide-in-from-top-1">
                                        <AlertCircle size={12} /> {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading || status.type === "success"}
                                    className={`w-full py-4 bg-[#135B42] text-white font-bold uppercase tracking-[0.25em] text-xs shadow-xl hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 rounded-sm ${(isLoading || status.type === "success") ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Updating...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                )}
            </div>

            <Footer />
        </main>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F9F7F5]">
                <div className="flex flex-col items-center justify-center text-gray-500">
                    <Loader2 className="animate-spin mb-2" size={24} />
                    <p className="text-sm">Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
