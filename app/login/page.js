"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Loader2, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, X, Phone, KeyRound } from "lucide-react";
import Link from "next/link";
import { apiClient } from "../utils/apiClient";

import { executePendingAction, syncGuestWishlistToUser } from "../utils/cartUtils";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    let callback = searchParams ? decodeURIComponent(searchParams.get("redirect") || searchParams.get("callback") || "/shop") : "/shop";
    if (callback === "/profile") {
        callback = "/shop";
    }

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [formData, setFormData] = useState({ email: "", password: "", mobile: "", otp: "" });
    const [errors, setErrors] = useState({ email: "", password: "", mobile: "", otp: "" });
    const [loginMethod, setLoginMethod] = useState("email"); // "email" or "mobile"
    const [otpSent, setOtpSent] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    // Email verification states for unverified users
    const [showVerifyEmailButton, setShowVerifyEmailButton] = useState(false);
    const [isEmailVerifyStep, setIsEmailVerifyStep] = useState(false);
    const [emailOtp, setEmailOtp] = useState("");
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        let interval;
        if (isEmailVerifyStep && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (isEmailVerifyStep && timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [isEmailVerifyStep, timer]);

    // 🚀 We no longer need the render wake up ping here since it's now handled globally or the backend is fast enough.

    const validateField = (name, value) => {
        let error = "";
        if (!value.trim()) {
            if (name === "email" && loginMethod === "mobile") return "";
            if (name === "password" && loginMethod === "mobile") return "";
            if (name === "mobile" && loginMethod === "email") return "";
            if (name === "otp" && loginMethod === "email") return "";
            error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
        } else if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && loginMethod === "email") {
            error = "Please enter a valid email address";
        } else if (name === "password" && value.length < 6 && loginMethod === "email") {
            error = "Password must be at least 6 characters";
        } else if (name === "mobile" && !/^\d{10}$/.test(value) && loginMethod === "mobile") {
            error = "Please enter a valid 10-digit mobile number";
        }
        return error;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear field error as user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
        if (status.message) {
            setStatus({ type: "", message: "" });
        }
        if (showVerifyEmailButton) {
            setShowVerifyEmailButton(false);
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSendOtp = async () => {
        const mobileError = validateField("mobile", formData.mobile);
        if (mobileError) {
            setErrors({ ...errors, mobile: mobileError });
            return;
        }

        setIsSendingOtp(true);
        setStatus({ type: "", message: "" });
        try {
            await apiClient.post("/api/auth/login-mobile", { mobile: formData.mobile });
            setOtpSent(true);
            setStatus({ type: "success", message: "OTP sent successfully to your mobile." });
        } catch (error) {
            setStatus({ type: "error", message: error.message || "Failed to send OTP." });
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validation check before submission
        if (loginMethod === "email") {
            const emailError = validateField("email", formData.email);
            const passwordError = validateField("password", formData.password);
            if (emailError || passwordError) {
                setErrors({ email: emailError, password: passwordError });
                return;
            }
        } else {
            const mobileError = validateField("mobile", formData.mobile);
            const otpError = validateField("otp", formData.otp);
            if (mobileError || (otpSent && otpError)) {
                setErrors({ mobile: mobileError, otp: otpError });
                return;
            }
            if (!otpSent) {
                handleSendOtp();
                return;
            }
        }

        setIsLoading(true);
        setStatus({ type: "", message: "" });
        setShowVerifyEmailButton(false);

        try {
            const endpoint = loginMethod === "email" ? "/api/auth/login" : "/api/auth/verify-mobile-otp";
            const payload = loginMethod === "email"
                ? { email: formData.email, password: formData.password }
                : { mobile: formData.mobile, otp: formData.otp };

            const data = await apiClient.post(endpoint, payload);
            console.log("🔐 Login API full response:", JSON.stringify(data, null, 2));

            const isSuccess = data.status !== false
                && data.status !== 'error'
                && data.status !== 'fail'
                && data.success !== false
                && !(data.status_code && data.status_code >= 400);

            if (isSuccess) {

                // Deep search for token in all known field names
                let token = data.token
                    || data.access_token
                    || data.bearer_token
                    || data.plainTextToken
                    || data.data?.token
                    || data.data?.access_token
                    || data.data?.plainTextToken
                    || data.user?.token
                    || data.user?.access_token
                    || data.authorization?.token
                    || data.authorisation?.token
                    || "";

                // If still not found, recursively search for any JWT-like string in the response
                if (!token) {
                    const findToken = (obj) => {
                        if (!obj || typeof obj !== 'object') return "";
                        for (const key of Object.keys(obj)) {
                            const val = obj[key];
                            if (typeof val === 'string' && val.length > 20 && val.includes('.')) {
                                // Looks like a JWT (has dots and is long enough)
                                const parts = val.split('.');
                                if (parts.length === 3) return val;
                            }
                            if (typeof val === 'object' && val !== null) {
                                const found = findToken(val);
                                if (found) return found;
                            }
                        }
                        return "";
                    };
                    token = findToken(data);
                    if (token) console.log("🔑 Token found via deep search in response");
                }

                if (!token) {
                    const responseKeys = Object.keys(data).join(', ');
                    setStatus({ type: "error", message: `Login API mein token nahi mila. Response keys: [${responseKeys}]. Console check karo (F12).` });
                    console.error("❌ No token found. Full response:", data);
                    setIsLoading(false);
                    return;
                }

                let userObj = data.user || data.data?.user || data.data || {};

                // Attempt to deeply find an ID if it exists anywhere in the data
                const foundId = userObj.id || userObj.user_id || data.id || data.user_id || data.data?.id || data.data?.user_id;
                if (foundId) {
                    userObj.id = foundId;
                    userObj.user_id = foundId;
                }

                // Try decoding JWT to extract user info if not already found
                if (!userObj.id && !userObj.user_id) {
                    try {
                        const base64Url = token.split('.')[1];
                        if (base64Url) {
                            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                            }).join(''));
                            const decoded = JSON.parse(jsonPayload);
                            console.log("🔑 JWT decoded payload:", decoded);
                            const id = decoded.sub || decoded.id || decoded.user_id;
                            if (id) {
                                userObj = { ...userObj, id: id, user_id: id, username: decoded.username || formData.username };
                            }
                        }
                    } catch (e) {
                        console.error("Failed to decode JWT", e);
                    }
                }

                // Final fallback — use email as identifier if backend doesn't return an ID
                if (!userObj.id && !userObj.user_id) {
                    console.warn("⚠️ API did not return a user ID. Using email as fallback.");
                    userObj.email = formData.email;
                }

                const userToStore = (userObj && typeof userObj === 'object' && Object.keys(userObj).length > 0) ? userObj : { email: formData.email };
                login(userToStore, token);

                // --- GUEST CART MIGRATION START ---
                const migrateGuestCart = async (authToken) => {
                    try {
                        const GUEST_CART_KEY = "shri_divyam_guest_cart";
                        const guestCartStr = localStorage.getItem(GUEST_CART_KEY);
                        if (!guestCartStr) return;

                        const guestCart = JSON.parse(guestCartStr);
                        if (!Array.isArray(guestCart) || guestCart.length === 0) return;

                        console.log(`🚚 Migrating ${guestCart.length} guest items to server cart...`);

                        for (const item of guestCart) {
                            try {
                                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": `Bearer ${authToken}`
                                    },
                                    body: JSON.stringify({
                                        product_id: Number(item.product_id),
                                        variant_id: Number(item.variant_id),
                                        quantity: Number(item.quantity)
                                    })
                                });
                            } catch (err) { console.error("Migration failed for item:", item, err); }
                        }

                        // Clear guest cart after migration
                        localStorage.removeItem(GUEST_CART_KEY);
                        console.log("✅ Guest cart migration complete.");
                    } catch (e) { console.error("Migration error:", e); }
                };

                // Fire and forget migration & pending action
                migrateGuestCart(token);
                syncGuestWishlistToUser(token);
                executePendingAction(token);
                // --- GUEST CART MIGRATION END ---

                const isNewUser = searchParams ? searchParams.get("registered") === "true" : false;
                const toastMessage = isNewUser
                    ? "Welcome to Sri Divyam! We are so excited to have you."
                    : "Successfully logged in! Welcome back to Sri Divyam.";
                window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: toastMessage } }));

                setStatus({ type: "success", message: "Login successful!" });
                setTimeout(() => router.push(callback), 1500);
            } else {
                const errMsg = data.message || data.error || "Invalid email or password.";
                const isUnverified = errMsg.toLowerCase().includes("not verif") ||
                    errMsg.toLowerCase().includes("unverified") ||
                    errMsg.toLowerCase().includes("verify");
                if (isUnverified && loginMethod === "email") {
                    setStatus({ type: "error", message: "Your email is not verified yet. Please verify your account to continue." });
                    setShowVerifyEmailButton(true);
                } else {
                    setStatus({ type: "error", message: errMsg });
                }
            }
        } catch (error) {
            console.error("Login Error:", error);
            const errMsg = error.message || "Please try again later.";
            const isUnverified = errMsg.toLowerCase().includes("not verif") ||
                errMsg.toLowerCase().includes("unverified") ||
                errMsg.toLowerCase().includes("verify");

            if (isUnverified && loginMethod === "email") {
                setStatus({ type: "error", message: "Your email is not verified yet. Please verify your account to continue." });
                setShowVerifyEmailButton(true);
            } else {
                setStatus({ type: "error", message: ` ${errMsg}` });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendEmailOtp = async () => {
        // The backend already automatically sends an OTP when login fails with "unverified".
        // So we don't need to call the API again. Just show the OTP screen.
        setIsEmailVerifyStep(true);
        setTimer(60);
        setCanResend(false);
        setShowVerifyEmailButton(false);
        setStatus({ type: "success", message: "We've sent an OTP to your email. Please check your inbox (and spam folder, just in case)." });
    };

    const handleVerifyEmailOtp = async (e) => {
        e.preventDefault();
        if (!emailOtp || emailOtp.trim() === "") {
            setStatus({ type: "error", message: "Please enter the 6-digit verification code to continue." });
            return;
        }

        setIsLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const data = await apiClient.post("/api/auth/otp-verify", { email: formData.email, otp: emailOtp });

            if (data.success !== false) {
                setStatus({ type: "success", message: "Account verified successfully! You can now login." });
                setIsEmailVerifyStep(false);
                setShowVerifyEmailButton(false);
                setIsLoading(false);
            } else {
                setStatus({ type: "error", message: data.message || "Invalid OTP. Please try again." });
                setIsLoading(false);
            }
        } catch (error) {
            console.error("OTP Verify Error:", error);
            const errMsg = error.message || (error.response?.data?.message) || "Network error while verifying OTP.";
            setStatus({ type: "error", message: errMsg });
            setIsLoading(false);
        }
    };

    const handleResendEmailOtp = async () => {
        if (!canResend) return;
        setIsResending(true);
        setStatus({ type: "", message: "" });

        try {
            const data = await apiClient.post("/api/auth/resend-verification-otp", { email: formData.email });
            if (data.success !== false) {
                setStatus({ type: "success", message: "We've resent the OTP to your email. Please check your inbox (and spam folder, just in case)." });
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

            <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col justify-center items-center">
                <div className="max-w-[480px] w-full mx-auto">
                    {/* CENTERED BLOCK - FORM */}
                    <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-center relative overflow-hidden">

                        <div className="text-center mb-8 relative z-10">
                            {/* Krishna Image */}
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-[#DAC153]/50 shadow-md">
                                <img src="/login-krishna.jpg" alt="Divine Journey" className="w-full h-full object-cover" />
                            </div>
                            <h2 className="text-3xl font-playfair font-bold text-[#135B42] mb-2">Welcome Back</h2>
                            {/* Ornamental Divider */}
                            <div className="flex items-center justify-center gap-1.5 mb-3">
                                <div className="h-px bg-[#DAC153]/50 w-16"></div>
                                <div className="text-[#DAC153]">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
                                    </svg>
                                </div>
                                <div className="h-px bg-[#DAC153]/50 w-16"></div>
                            </div>
                            <p className="text-[15px] text-gray-500">Login to continue your divine journey</p>
                        </div>

                        {status.message && (
                            <div className={`mb-2 p-3 rounded-md flex items-start gap-2 animate-in fade-in duration-300 relative z-10 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                {status.type === "success" ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                                <div className="flex-1">
                                    <p className="text-[12.5px] font-medium leading-tight pt-0.5">{status.message}</p>
                                </div>
                            </div>

                        )}

                        {isEmailVerifyStep ? (
                            <form onSubmit={handleVerifyEmailOtp} className="space-y-4 relative z-10 mt-2" noValidate>
                                <div className="space-y-2 text-left">
                                    <label className="text-[13px] text-gray-700 font-medium">Enter verification OTP (Sent to {formData.email})</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={emailOtp}
                                            onChange={(e) => {
                                                setEmailOtp(e.target.value);
                                                if (status.message) setStatus({ type: "", message: "" });
                                            }}
                                            placeholder="Enter OTP"
                                            className={`w-full px-4 py-3.5 border outline-none transition-all duration-300 rounded-[4px] text-[15px] border-gray-200 focus:border-[#135B42] hover:border-gray-300 text-gray-800 text-center tracking-widest font-semibold bg-[#FBFBFB] shadow-sm`}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3.5 bg-[#0F4A36] text-white font-bold text-[15px] rounded-[4px] hover:bg-[#135B42] transition-colors shadow-md flex items-center justify-center gap-2 tracking-wider ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {isLoading ? (
                                        <><Loader2 className="animate-spin" size={18} /> VERIFYING...</>
                                    ) : (
                                        <>Verify Account</>
                                    )}
                                </button>

                                <div className="text-center !mt-4 !mb-2">
                                    {canResend ? (
                                        <button
                                            type="button"
                                            onClick={handleResendEmailOtp}
                                            disabled={isResending}
                                            className="text-[#135B42] text-[13px] font-bold hover:underline transition-colors disabled:opacity-50"
                                        >
                                            {isResending ? "Resending..." : "Resend OTP"}
                                        </button>
                                    ) : (
                                        <p className="text-gray-500 text-[12px]">
                                            Resend OTP in <span className="font-bold text-[#135B42]">{timer}s</span>
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => { setIsEmailVerifyStep(false); setStatus({ type: "", message: "" }); }}
                                    className="w-full py-1 text-gray-400 hover:text-[#135B42] text-[11px] transition-colors"
                                >
                                    &larr; Back to Login
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4 relative z-10" noValidate>
                                <>
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[13px] font-bold text-[#303030]">Email Address</label>
                                        <div className="relative group">
                                            <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.email ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={18} />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Enter your email address"
                                                className={`w-full pl-11 pr-4 py-3 border outline-none transition-all duration-300 rounded-md text-[15px] ${errors.email ? "border-red-300 bg-red-50/20 focus:border-red-500" : "border-gray-200 focus:border-[#135B42] hover:border-gray-300"} text-gray-800`}
                                            />
                                        </div>
                                        {errors.email && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-1.5 text-left mt-5">
                                        <label className="text-[13px] font-bold text-[#303030]">Password</label>
                                        <div className="relative group">
                                            <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.password ? "text-red-400" : "text-gray-400 group-focus-within:text-[#135B42]"}`} size={18} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Enter your password"
                                                className={`w-full pl-11 pr-10 py-3 border outline-none transition-all duration-300 rounded-md text-[15px] ${errors.password ? "border-red-300 bg-red-50/20 focus:border-red-500" : "border-gray-200 focus:border-[#135B42] hover:border-gray-300"} text-gray-800`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#135B42] transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.password}</p>}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 pb-2">
                                        <div className="flex items-center gap-2.5">
                                            {/* <input type="checkbox" id="remember" className="w-4 h-4 accent-[#135B42] rounded-sm cursor-pointer border-gray-300" /> */}

                                        </div>
                                        <Link href="/forgot-password" className="text-[13px] text-[#135B42] hover:underline font-bold">Forgot Password?</Link>
                                    </div>
                                </>

                                {showVerifyEmailButton ? (
                                    <button
                                        type="button"
                                        onClick={handleSendEmailOtp}
                                        disabled={isLoading}
                                        className={`w-full mt-4 py-3.5 bg-[#135B42] text-white font-bold text-[15px] rounded-md hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-all shadow-md flex items-center justify-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                    >
                                        {isLoading ? (
                                            <><Loader2 className="animate-spin" size={18} /> Sending OTP...</>
                                        ) : (
                                            <>Verify Your Account <span className="text-[18px] leading-none mb-0.5">&rarr;</span></>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full mt-4 py-3.5 bg-[#135B42] text-white font-bold text-[15px] rounded-md hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-all shadow-md flex items-center justify-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                    >
                                        {isLoading ? (
                                            <><Loader2 className="animate-spin" size={18} /> Logging in...</>
                                        ) : (
                                            <>Login <span className="text-[18px] leading-none mb-0.5">&rarr;</span></>
                                        )}
                                    </button>
                                )}
                            </form>
                        )}




                        <div className="mt-8 text-center relative z-10">
                            <p className="text-[14px] text-gray-500">
                                Don't have an account? <Link href="/register" className="text-[#135B42] font-bold hover:underline ml-1">Create Account</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
