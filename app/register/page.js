"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Loader2, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Phone, X } from "lucide-react";
import Link from "next/link";
import { apiClient } from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import { RxCross2 } from "react-icons/rx";

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [showVerifyButton, setShowVerifyButton] = useState(false);

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        password_confirmation: "",
        mobile_number: "",
    });

    const [errors, setErrors] = useState({});
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // 🚀 MAGIC FIX: Wake up the free Render backend while the user is typing!
    // This silently pings the backend the moment the page loads. By the time
    // the user finishes filling the form, the server will already be awake.
    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/`, { mode: 'no-cors' }).catch(() => { });
    }, []);

    // Timer for Resend OTP
    useEffect(() => {
        let interval;
        if (step === 2 && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (step === 2 && timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const validateField = (name, value) => {
        let error = "";
        const stringValue = value ? value.toString().trim() : "";

        if (!stringValue && name !== "terms") {
            error = `${name.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} is required`;
        } else {
            if (name === "full_name") {
                if (stringValue.length < 2) {
                    error = "Must be at least 2 characters";
                } else if (!/^[A-Za-z\s]+$/.test(stringValue)) {
                    error = "Alphabet required";
                }
            }

            if (name === "email") {
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(stringValue)) error = "Please enter a valid email address";
            }
            if (name === "mobile_number") {
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(stringValue)) error = "10-digit number required";
            }
            if (name === "password") {
                if (stringValue.length < 8) {
                    error = "Password must be at least 8 characters";
                } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(stringValue)) {
                    error = "Must include uppercase, lowercase, and a number";
                }
            }
            if (name === "password_confirmation" && stringValue !== formData.password) {
                error = "Passwords do not match";
            }
        }
        return error;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
        if (name === "password" && errors.password_confirmation) {
            setErrors(prev => ({ ...prev, password_confirmation: "" }));
        }
        // Clear errors and verify button if user starts typing again
        if (status.message) {
            setStatus({ type: "", message: "" });
        }
        if (showVerifyButton) {
            setShowVerifyButton(false);
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!agreedToTerms) {
            setStatus({ type: "error", message: "You must agree to the Terms & Conditions." });
            return;
        }

        // Validate all fields
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setStatus({ type: "error", message: "Please fill in all required fields correctly." });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsLoading(true);
        setStatus({ type: "success", message: "Creating your account..." });
        setShowVerifyButton(false);

        try {
            const data = await apiClient.post("/api/auth/register", {
                name: formData.full_name,
                email: formData.email,
                password: formData.password,
                mobile: formData.mobile_number,
                phone: formData.mobile_number,
                phone_number: formData.mobile_number,
                mobile_number: formData.mobile_number
            });

            const isError = data.status === false ||
                data.status === "error" ||
                data.success === false ||
                data.status_code >= 400 ||
                (data.message && typeof data.message === 'object' && !Array.isArray(data.message)) ||
                (data.errors);

            const isAlreadyExists = data && data.message && typeof data.message === 'string' && 
                (data.message.toLowerCase().includes("already exist") || 
                 data.message.toLowerCase().includes("already register") ||
                 data.message.toLowerCase().includes("already taken"));
            
            if (!isError && !isAlreadyExists) {
                setStatus({ type: "success", message: "Your account has been created successfully! We’ve sent a verification code to your email. Please check your inbox and spam folder if needed." });
                setStep(2);
                setTimer(60);
                setCanResend(false);
            } else if (isAlreadyExists) {
                setStatus({ type: "error", message: data.message || "Email already registered." });
                setShowVerifyButton(true);
            } else {
                let errorMsg = "Registration failed. Please try again.";

                if (typeof data.message === 'string') {
                    errorMsg = data.message;
                } else if (data.message && typeof data.message === 'object') {
                    const errorLines = Object.values(data.message).map(val =>
                        Array.isArray(val) ? val[0] : String(val)
                    );
                } else if (data.errors) {
                    errorMsg = typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors);
                }
                setStatus({ type: "error", message: errorMsg });
            }
        } catch (error) {
            console.error("Registration Error:", error);
            const errMsg = error.message || "Network error. Please try again later.";
            const isAlreadyExists = errMsg.toLowerCase().includes("already exist") || 
                                    errMsg.toLowerCase().includes("already register") || 
                                    errMsg.toLowerCase().includes("already taken");
                                    
            if (isAlreadyExists) {
                setStatus({ type: "error", message: errMsg });
                setShowVerifyButton(true);
            } else {
                setStatus({ type: "error", message: errMsg });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAccount = async () => {
        setIsLoading(true);
        setStatus({ type: "success", message: "Sending OTP to your email..." });
        
        try {
            const otpData = await apiClient.post("/api/auth/resend-verification-otp", { email: formData.email });
            if (otpData.success !== false) {
                setStatus({ type: "success", message: "We've sent a verification code to your email. Please check your inbox (and spam folder, just in case)." });
                setStep(2);
                setTimer(60);
                setCanResend(false);
                setShowVerifyButton(false);
            } else {
                setStatus({ type: "error", message: otpData.message || "Failed to send OTP. Please try again." });
            }
        } catch (otpErr) {
            setStatus({ type: "error", message: otpErr.message || "Network error while sending OTP." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp) {
            setStatus({ type: "error", message: "Please enter the OTP." });
            return;
        }

        setIsLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const data = await apiClient.post("/api/auth/otp-verify", { email: formData.email, otp: otp });

            if (data.success !== false) {
                setStatus({ type: "success", message: "Account verified successfully! Redirecting to login..." });
                setTimeout(() => router.push("/login?registered=true"), 2000);
            } else {
                setStatus({ type: "error", message: data.message || "Invalid OTP. Please try again." });
            }
        } catch (error) {
            console.error("OTP Verify Error:", error);
            const errMsg = error.message || (error.response?.data?.message) || "Network error while verifying OTP.";
            setStatus({ type: "error", message: errMsg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        setIsResending(true);
        setStatus({ type: "", message: "" });

        try {
            const data = await apiClient.post("/api/auth/resend-verification-otp", { email: formData.email });
            if (data.success !== false) {
                setStatus({ type: "success", message: "We've sent a new verification code to your email. Please check your inbox (and spam folder, just in case)." });
                setTimer(60);
                setCanResend(false);
            } else {
                setStatus({ type: "error", message: data.message || "Failed to resend OTP. Please try again." });
            }
        } catch (error) {
            console.error("Resend OTP Error:", error);
            const errMsg = error.message || (error.response?.data?.message) || "Network error while resending OTP.";
            setStatus({ type: "error", message: errMsg });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <main className="bg-[#FAF8F5] min-h-screen flex flex-col font-poppins text-[#303030]">
            <Header />

            <div className={`flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 ${step === 1 ? 'py-10' : 'py-4 sm:py-6 lg:py-8'} flex flex-col justify-center items-center`}>
                <div className="max-w-[600px] w-full mx-auto">
                    {/* CENTERED BLOCK - FORM */}
                    <div className={`bg-white rounded-2xl ${step === 1 ? 'p-5 sm:p-8' : 'p-5 sm:p-8 md:p-10'} shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-center relative overflow-hidden`}>

                        <div className="text-center mb-5 relative z-10">
                            {step === 1 ? (
                                <>
                                    {/* Krishna Image */}
                                    <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-[#DAC153]/50 shadow-md">
                                        <img src="/register-krishna.jpg" alt="Divine Journey" className="w-full h-full object-cover" />
                                    </div>
                                    <h2 className="text-[26px] font-playfair font-bold text-[#135B42] mb-1">Create Your Account</h2>
                                    {/* Ornamental Divider */}
                                    <div className="flex items-center justify-center gap-1.5 mb-2 mt-1">
                                        <div className="h-px bg-[#DAC153]/50 w-16"></div>
                                        <div className="text-[#DAC153]">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
                                            </svg>
                                        </div>
                                        <div className="h-px bg-[#DAC153]/50 w-16"></div>
                                    </div>
                                    <p className="text-[13px] text-gray-500">Begin your divine journey with Sri Divyam</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#135B42] mb-3">Verify Account</h2>
                                    <p className="text-[15px] md:text-[16px] text-gray-600 mb-2">Enter the OTP sent to <br className="sm:hidden" /><span className="font-medium text-gray-800">{formData.email}</span></p>
                                </>
                            )}
                        </div>

                        {status.message && (
                            <div className={`mb-3 p-3 rounded-md flex items-start gap-2 animate-in fade-in duration-300 relative z-10 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                {status.type === "success" ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                                <div className="flex-1">
                                    <p className="text-[13px] md:text-[14px] font-medium leading-snug pt-0.5">{status.message}</p>
                                </div>
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleSubmit} className="space-y-4 relative z-10" noValidate>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Full Name */}
                                    <div className="space-y-1 text-left">
                                        <label className="text-[12px] font-bold text-[#303030]">Full Name <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <User className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.full_name ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={16} />
                                            <input
                                                type="text"
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Enter your full name"
                                                className={`w-full pl-9 pr-4 py-2 border outline-none transition-all duration-300 rounded-md text-[13px] ${errors.full_name ? "border-red-300 bg-red-50/20 focus:border-red-500" : "border-gray-200 focus:border-[#135B42] hover:border-gray-300"} text-gray-800`}
                                            />
                                        </div>
                                        {errors.full_name && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.full_name}</p>}
                                    </div>

                                    {/* Phone Number */}
                                    <div className="space-y-1 text-left">
                                        <label className="text-[12px] font-bold text-[#303030]">Phone Number <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.mobile_number ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={16} />
                                            <input
                                                type="tel"
                                                name="mobile_number"
                                                value={formData.mobile_number}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                inputMode="numeric"
                                                maxLength={10}
                                                placeholder="Enter your phone number"
                                                className={`w-full pl-9 pr-4 py-2 border outline-none transition-all duration-300 rounded-md text-[13px] ${errors.mobile_number ? "border-red-300 bg-red-50/20 focus:border-red-500" : "border-gray-200 focus:border-[#135B42] hover:border-gray-300"} text-gray-800`}
                                            />
                                        </div>
                                        {errors.mobile_number && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.mobile_number}</p>}
                                    </div>
                                </div>

                                {/* Email Address */}
                                <div className="space-y-1 text-left">
                                    <label className="text-[12px] font-bold text-[#303030]">Email Address <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.email ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={16} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            placeholder="Enter your email address"
                                            className={`w-full pl-9 pr-4 py-2 border outline-none transition-all duration-300 rounded-md text-[13px] ${errors.email ? "border-red-300 bg-red-50/20 focus:border-red-500" : "border-gray-200 focus:border-[#135B42] hover:border-gray-300"} text-gray-800`}
                                        />
                                    </div>
                                    {errors.email && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.email}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Password */}
                                    <div className="space-y-1 text-left">
                                        <label className="text-[12px] font-bold text-[#303030]">Password <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.password ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={16} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Create a password"
                                                className={`w-full pl-9 pr-9 py-2 border outline-none transition-all duration-300 rounded-md text-[13px] ${errors.password ? "border-red-300 bg-red-50/20 focus:border-red-500" : "border-gray-200 focus:border-[#135B42] hover:border-gray-300"} text-gray-800`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#135B42] transition-colors cursor-pointer"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.password}</p>}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1 text-left">
                                        <label className="text-[12px] font-bold text-[#303030]">Confirm Password <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.password_confirmation ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={16} />
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="password_confirmation"
                                                value={formData.password_confirmation}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Confirm your password"
                                                className={`w-full pl-9 pr-9 py-2 border outline-none transition-all duration-300 rounded-md text-[13px] ${errors.password_confirmation ? "border-red-300 bg-red-50/20 focus:border-red-500" : "border-gray-200 focus:border-[#135B42] hover:border-gray-300"} text-gray-800`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#135B42] transition-colors cursor-pointer"
                                            >
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {errors.password_confirmation && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.password_confirmation}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1 pb-1">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="w-3.5 h-3.5 accent-[#135B42] rounded-sm cursor-pointer border-gray-300 shrink-0"
                                    />
                                    <label htmlFor="terms" className="text-[12px] text-gray-600 font-medium cursor-pointer">
                                        I agree to the{" "}
                                        <Link href="/terms-and-conditions" className="text-[#135B42] font-bold hover:underline" onClick={(e) => e.stopPropagation()}>
                                            Terms & Conditions
                                        </Link>
                                        {" "}and{" "}
                                        <Link href="/privacy-policy" className="text-[#135B42] font-bold hover:underline" onClick={(e) => e.stopPropagation()}>
                                            Privacy Policy
                                        </Link>
                                    </label>
                                </div>

                                {showVerifyButton ? (
                                    <button
                                        type="button"
                                        onClick={handleVerifyAccount}
                                        disabled={isLoading}
                                        className={`w-full mt-2 py-2.5 bg-[#135B42] text-white font-bold text-[14px] rounded-md hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-all shadow-md flex items-center justify-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                    >
                                        {isLoading ? (
                                            <><Loader2 className="animate-spin" size={16} /> Sending OTP...</>
                                        ) : (
                                            <>Verify Your Account <span className="text-[16px] leading-none mb-0.5">&rarr;</span></>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full mt-2 py-2.5 bg-[#135B42] text-white font-bold text-[14px] rounded-md hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-all shadow-md flex items-center justify-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                    >
                                        {isLoading ? (
                                            <><Loader2 className="animate-spin" size={16} /> Creating Account...</>
                                        ) : (
                                            <>Create Account <span className="text-[16px] leading-none mb-0.5">&rarr;</span></>
                                        )}
                                    </button>
                                )}
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-4 relative z-10 mt-2" noValidate>
                                <div className="space-y-2 text-left">
                                    <label className="text-[14px] md:text-[15px] text-gray-700 font-medium">Enter verification OTP (Sent to Email)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="Enter OTP"
                                            className={`w-full px-4 py-3 md:py-3.5 border outline-none transition-all duration-300 rounded-[6px] text-[16px] md:text-[18px] border-gray-200 focus:border-[#135B42] hover:border-gray-300 text-gray-800 text-center tracking-[0.2em] font-semibold bg-[#FBFBFB] shadow-sm`}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 md:py-3.5 bg-[#0F4A36] text-white font-bold text-[15px] md:text-[16px] rounded-[6px] hover:bg-[#135B42] transition-colors shadow-md flex items-center justify-center gap-2 tracking-wider mt-3 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {isLoading ? (
                                        <><Loader2 className="animate-spin" size={18} /> VERIFYING...</>
                                    ) : (
                                        <>VERIFY ACCOUNT</>
                                    )}
                                </button>

                                <div className="text-center !mt-3 !mb-1.5">
                                    {canResend ? (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={isResending}
                                            className="text-[#135B42] text-[14px] font-bold hover:underline transition-colors disabled:opacity-50"
                                        >
                                            {isResending ? "Resending..." : "Resend OTP"}
                                        </button>
                                    ) : (
                                        <p className="text-gray-500 text-[13px]">
                                            Resend OTP in <span className="font-bold text-[#135B42]">{timer}s</span>
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full py-1 text-gray-400 hover:text-[#135B42] text-[13px] transition-colors mt-1"
                                >
                                    &larr; Back to Registration
                                </button>
                            </form>
                        )}



                        <div className="mt-5 text-center relative z-10">
                            <p className="text-[13px] text-gray-600">
                                Already have an account? <Link href="/login" className="text-[#135B42] font-semibold hover:underline ml-1">Sign in here</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
