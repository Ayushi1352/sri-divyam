"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Loader2, Mail, ArrowLeft, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import Link from "next/link";
import { apiClient } from "../utils/apiClient";

function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryEmail = searchParams.get("email");

    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP

    useEffect(() => {
        if (queryEmail) {
            setEmail(queryEmail);
            setStep(2); // If email is in URL, jump to OTP step
        }
    }, [queryEmail]);

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        if (!email.trim()) {
            setStatus({ type: "error", message: "Please enter your email address." });
            return;
        }

        setIsLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const data = await apiClient.post("/api/auth/resend-verification-otp", { email: email.trim() });
            
            if (data.success !== false) {
                setStatus({ type: "success", message: "Verification OTP has been sent to your email." });
                setStep(2);
            } else {
                setStatus({ type: "error", message: data.message || "Failed to send OTP. Please try again." });
            }
        } catch (error) {
            console.error("Resend OTP Error:", error);
            setStatus({ type: "error", message: error.message || ": Please try again later." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        
        if (!otp.trim()) {
            setStatus({ type: "error", message: "Please enter the verification OTP." });
            return;
        }

        setIsLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const data = await apiClient.post("/api/auth/verify-email", { 
                email: email.trim(),
                otp: otp.trim()
            });

            if (data.success !== false) {
                setStatus({ type: "success", message: "Your email has been successfully verified!" });
                setTimeout(() => router.push("/login"), 3000);
            } else {
                setStatus({ type: "error", message: data.message || "Invalid OTP. Please try again." });
            }
        } catch (error) {
            console.error("Verify Email Error:", error);
            setStatus({ type: "error", message: error.message || " Please try again later." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsResending(true);
        setStatus({ type: "", message: "" });

        try {
            const data = await apiClient.post("/api/auth/resend-verification-otp", { email: email.trim() });
            
            if (data.success !== false) {
                setStatus({ type: "success", message: "A new OTP has been sent to your email." });
            } else {
                setStatus({ type: "error", message: data.message || "Failed to resend OTP. Please try again." });
            }
        } catch (error) {
            console.error("Resend OTP Error:", error);
            setStatus({ type: "error", message: error.message || "Network error. Please try again." });
        } finally {
            setIsResending(false);
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
                        
                        <h1 className="text-2xl sm:text-4xl font-playfair font-bold text-[#303030] mb-3">Verify Email</h1>
                        <p className="text-sm text-gray-500 italic">
                            {step === 1 ? "Enter your email to receive a verification OTP." : `Enter the OTP sent to ${email}`}
                        </p>
                    </div>

                    {status.message && (
                        <div className={`mb-6 p-4 rounded-sm flex items-start gap-3 animate-in fade-in zoom-in duration-300 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                            {status.type === "success" ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                            <p className="text-[13px] font-medium leading-tight">{status.message}</p>
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSendOtp} className="space-y-6" noValidate>
                            <div className="space-y-2">
                                <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400">Email Address</label>
                                <div className="relative group">
                                    <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${status.type === 'error' ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={16} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className={`w-full pl-10 pr-10 py-3 border outline-none transition-all duration-300 rounded-sm text-sm ${status.type === 'error' ? "border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-100" : "border-gray-200 focus:border-[#135B42] focus:shadow-sm"} text-gray-800`}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-4 bg-[#135B42] text-white font-bold uppercase tracking-[0.25em] text-xs shadow-xl hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 rounded-sm ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {isLoading ? (
                                        <><Loader2 className="animate-spin" size={18} /> Sending...</>
                                    ) : (
                                        "Send OTP"
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6" noValidate>
                            <div className="space-y-2">
                                <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400">Verification OTP</label>
                                <div className="relative group">
                                    <KeyRound className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${status.type === 'error' ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={16} />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter OTP"
                                        className={`w-full pl-10 pr-10 py-3 border outline-none transition-all duration-300 rounded-sm text-sm tracking-widest font-semibold text-center ${status.type === 'error' ? "border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-100" : "border-gray-200 focus:border-[#135B42] focus:shadow-sm"} text-gray-800`}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading || status.type === "success"}
                                    className={`w-full py-4 bg-[#135B42] text-white font-bold uppercase tracking-[0.25em] text-xs shadow-xl hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 rounded-sm ${(isLoading || status.type === "success") ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {isLoading ? (
                                        <><Loader2 className="animate-spin" size={18} /> Verifying...</>
                                    ) : (
                                        "Verify Email"
                                    )}
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={isResending || status.type === "success"}
                                    className="text-[12px] font-bold text-gray-500 hover:text-[#135B42] transition-colors uppercase tracking-widest"
                                >
                                    {isResending ? "Resending..." : "Resend OTP"}
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>

            <Footer />
        </main>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <VerifyEmailForm />
        </Suspense>
    );
}
