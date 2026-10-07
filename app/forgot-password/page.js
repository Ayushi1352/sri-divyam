"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiClient } from "../utils/apiClient";
import { Loader2, Mail, ArrowLeft, AlertCircle, CheckCircle2, X } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const validateEmail = (value) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!value.trim()) {
            return "Email is required";
        } else if (!emailRegex.test(value)) {
            return "Please enter a valid email address";
        }
        return "";
    };

    const handleInputChange = (e) => {
        setEmail(e.target.value);
        if (error) setError("");
    };

    const handleBlur = () => {
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setIsLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const data = await apiClient.post("/api/auth/forgot-password", { 
                email: email.trim(),
                role: "customer"
            });
            console.log("🔑 Forgot Password API Response:", data);

            // Check for success - look for success flag, status field, or message
            const isSuccess = data.success !== false && data.status !== "error";

            if (isSuccess) {
                setStatus({ 
                    type: "success", 
                    message: data.message || "Reset link has been sent to your email. Please check your inbox and spam folder." 
                });
                setEmail("");
                // Redirect to reset password after 2 seconds
                setTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 2000);
            } else {
                setStatus({ 
                    type: "error", 
                    message: data.message || data.error || "Could not find an account with that email address. Please try again." 
                });
            }
        } catch (error) {
            console.error("Forgot Password Error:", error);
            setStatus({ 
                type: "error", 
                message: `${error.message || "Please try again later."}` 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="bg-white min-h-screen flex flex-col font-primary">
            <Header />
            
            <div className="flex-1 flex items-center justify-center bg-[#F9F7F5] pt-10 pb-20 px-4 sm:px-6">
                <div className="w-full max-w-[420px] bg-white border border-[#E8DDD4] p-6 sm:p-10 shadow-2xl rounded-sm">
                    
                    <div className="mb-8">
                        <Link href="/login" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#135B42] transition-colors mb-6 group">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Login
                        </Link>
                        
                        <h1 className="text-2xl sm:text-4xl font-playfair font-bold text-[#303030] mb-3">Reset Password</h1>
                        <p className="text-sm text-gray-500 italic">Enter your email to receive a password reset link</p>
                    </div>

                    {status.message && (
                        <div className={`mb-6 p-4 rounded-sm flex items-start gap-3 animate-in fade-in zoom-in duration-300 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                            {status.type === "success" ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                            <p className="text-[13px] font-medium leading-tight">{status.message}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        <div className="space-y-2">
                            <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400">Email Address</label>
                            <div className="relative group">
                                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${error ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={16} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    placeholder="Enter your registered email"
                                    className={`w-full pl-10 pr-10 py-3 border outline-none transition-all duration-300 rounded-sm text-sm ${error ? "border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-100" : "border-gray-200 focus:border-[#135B42] focus:shadow-sm"} text-gray-800`}
                                />
                                {email && (
                                    <button
                                        type="button"
                                        onClick={() => { setEmail(""); setError(""); }}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            {error && (
                                <p className="text-[11px] text-red-600 font-medium flex items-center gap-1.5 mt-1.5 animate-in slide-in-from-top-1">
                                    <AlertCircle size={12} /> {error}
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
                                        Processing...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-[13px] text-gray-500 mb-2">Remember your password?</p>
                        <Link href="/login" className="text-[#135B42] font-bold uppercase tracking-[0.2em] text-xs hover:underline">
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
