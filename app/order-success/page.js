"use client";

import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function OrderSuccessPage() {
    useEffect(() => {
        // Clear all cart related persistent data after successful order
        localStorage.removeItem("shri_divyam_cart_quantities");
        localStorage.removeItem("shri_divyam_removed_cart_items");
        localStorage.removeItem("shri_divyam_guest_cart");

        // Signal header to update count (it will see 0 now)
        window.dispatchEvent(new Event("cartUpdated"));
    }, []);

    return (
        <main className="bg-white min-h-screen flex flex-col font-primary">
            <Header />

            <div className="flex-1 bg-[#F9F7F5] flex items-start justify-center pt-6 sm:pt-8 md:pt-10 pb-12 px-4">
                <div className="max-w-[500px] w-full bg-white border border-[#E8DDD4] p-6 sm:p-8 md:p-10 shadow-xl rounded-sm text-center">
                    {/* Laddu Gopal Ji Divine Image */}
                    <div className="flex justify-center mb-5">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#DAC153]/70 shadow-md relative bg-[#FDFBF7]">
                            <img src="/laddu-gopal-success.jpg" alt="Laddu Gopal Ji" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-playfair font-bold text-[#303030] mb-4">Jai Shri Krishna!</h1>
                    <h2 className="text-xl font-bold text-[#135B42] uppercase tracking-[0.2em] text-sm mb-6">Order Placed Successfully</h2>

                    <p className="text-gray-500 text-sm leading-relaxed mb-10">
                        Thank you for shopping with Sri Divyam. Your order has been received and is being prepared with love and devotion. You will receive a confirmation message shortly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6">
                        <Link href="/profile/orders" className="w-full sm:w-1/2">
                            <button className="w-full py-3.5 px-4 bg-white text-[#135B42] border border-[#135B42] font-bold uppercase tracking-wider text-xs rounded-md shadow-sm hover:bg-[#135B42] hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2">
                                <ShoppingBag size={16} />
                                View My Orders
                            </button>
                        </Link>

                        <Link href="/shop" className="w-full sm:w-1/2">
                            <button className="w-full py-3.5 px-4 bg-[#135B42] text-white font-bold uppercase tracking-wider text-xs rounded-md shadow-sm hover:bg-[#0c402d] transition-all cursor-pointer flex items-center justify-center gap-2">
                                Continue Shopping
                                <ArrowRight size={16} />
                            </button>
                        </Link>
                    </div>
                </div> 
            </div>

            <Footer />
        </main>
    ); 
}
