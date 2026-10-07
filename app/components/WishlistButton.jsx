"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Heart } from "lucide-react";
import { apiClient } from "../utils/apiClient";
import { useRouter } from "next/navigation";

export default function WishlistButton({ product, className = "" }) {
  const { token } = useAuth();
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const checkWishlistStatus = () => {
    try {
      const stored = localStorage.getItem("shri_divyam_wishlist_items");
      if (stored) {
        const wishlistIds = JSON.parse(stored);
        setIsWishlisted(wishlistIds.includes(String(product._id || product.id)));
      }
    } catch (e) {}
  };

  useEffect(() => {
    checkWishlistStatus();
    window.addEventListener("wishlistUpdated", checkWishlistStatus);
    return () => window.removeEventListener("wishlistUpdated", checkWishlistStatus);
  }, [product]);

  const toggleWishlist = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!token) {
        window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Please login to add items to your wishlist.", type: "error" } }));
        setTimeout(() => router.push('/login'), 1000);
        return;
    }

    setIsWishlistLoading(true);
    try {
        const pId = String(product._id || product.id);

        let wishlistIds = [];
        try {
            const stored = localStorage.getItem("shri_divyam_wishlist_items");
            if (stored) wishlistIds = JSON.parse(stored);
        } catch (e) {}

        if (isWishlisted) {
            await apiClient.post("/api/auth/wishlist/remove", { productId: pId });
            wishlistIds = wishlistIds.filter(id => id !== pId);
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Removed from wishlist" } }));
        } else {
            await apiClient.post("/api/auth/wishlist/add", { productId: pId });
            if (!wishlistIds.includes(pId)) wishlistIds.push(pId);
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Added to wishlist!" } }));
        }

        localStorage.setItem("shri_divyam_wishlist_items", JSON.stringify(wishlistIds));
        localStorage.setItem("shri_divyam_guest_wishlist", JSON.stringify(wishlistIds));
        setIsWishlisted(!isWishlisted);
        window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (err) {
        console.error("Wishlist action failed", err);
        window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Please log in to save wishlist items." } }));
    } finally {
        setIsWishlistLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleWishlist}
      disabled={isWishlistLoading}
      className={`absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-[#2B352E]/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-[#135B42] transition-colors duration-300 group/btn ${className}`}
    >
      <Heart 
          size={14} 
          strokeWidth={2}
          className={`transition-all duration-300 ${isWishlisted ? 'fill-[#e11d48] text-[#e11d48]' : 'text-white group-hover/btn:scale-110'}`} 
      />
    </button>
  );
}
