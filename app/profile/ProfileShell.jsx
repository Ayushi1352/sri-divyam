"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";
import { User, MapPin, Package, RefreshCw, Lock, LogOut } from "lucide-react";

export default function ProfileShell({ children }) {
    const { token, logout, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    useEffect(() => {
        if (!loading && !token) {
            router.push("/login");
        }
    }, [token, loading, router]);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    // Show nothing during SSR or while loading auth state to prevent hydration mismatch
    if (!isClient || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135B42]"></div>
            </div>
        );
    }

    if (!token) {
        return null; // Don't flash a loader while redirecting to login
    }

    const navItems = [
        { name: "Profile Settings", path: "/profile", icon: User },
        { name: "Addresses", path: "/profile/addresses", icon: MapPin },
        { name: "My Order History", path: "/profile/orders", icon: Package },
        { name: "Return/Replacement", path: "/profile/refunds", icon: RefreshCw },
        { name: "Change Password", path: "/profile/change-password", icon: Lock },
    ];
    const currentPage = navItems.find((item) => (
        item.path === "/profile" ? pathname === item.path : pathname.startsWith(item.path)
    ))?.name || "My Account Dashboard";

    return (
        <div className="bg-[#FAF8F5] min-h-screen flex flex-col font-poppins text-[#303030]">
            <Header />

            <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-playfair font-bold text-[#135B42]">My Account Dashboard</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-[#e11d48] border border-[#fecdd3] bg-white hover:bg-[#fff1f2] rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm"
                    >
                        <LogOut size={16} className="text-[#e11d48]" />
                        Sign Out
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-5 lg:gap-8 items-start">
                    {/* Sidebar */}
                    <div className="w-full md:w-[240px] lg:w-[280px] shrink-0 bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
                        <nav className="flex flex-col p-3 gap-1">
                            {navItems.map((item) => {
                                const isActive = item.path === '/profile' ? pathname === item.path : pathname.startsWith(item.path);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 sm:py-4 mb-1 rounded-md transition-all font-bold text-[13px] ${isActive
                                            ? "bg-[#135B42] text-white shadow-md"
                                            : "text-[#4b5563] hover:bg-gray-50 hover:text-[#135B42]"
                                            }`}
                                    >
                                        <Icon size={16} className={isActive ? "text-white" : "text-gray-500"} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 w-full min-h-[400px] min-w-0">
                        {children}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
