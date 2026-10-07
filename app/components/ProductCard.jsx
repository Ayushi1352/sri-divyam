"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import DirectAddToCart from "./DirectAddToCart";
import { Heart } from "lucide-react";
import { apiClient } from "../utils/apiClient";
import { useRouter } from "next/navigation";
import { getImageUrl } from "../utils/imageUtils";
import { setPendingAction } from "../utils/cartUtils";

export default function ProductCard({ product }) {
  const { formatPrice } = useCurrency();
  const { token } = useAuth();
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Read initial state from localStorage
  const checkWishlistStatus = () => {
    try {
      const stored = localStorage.getItem("shri_divyam_wishlist_items");
      if (stored) {
        const wishlistIds = JSON.parse(stored);
        setIsWishlisted(wishlistIds.includes(String(product._id || product.id)));
      }
    } catch (e) { }
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
      setPendingAction("ADD_TO_WISHLIST", product);
      const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/shop";
      window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Please login to add items to your wishlist.", type: "error" } }));
      setTimeout(() => router.push(`/login?redirect=${encodeURIComponent(currentPath)}`), 1000);
      return;
    }

    setIsWishlistLoading(true);
    try {
      const pId = String(product._id || product.id);

      let wishlistIds = [];
      try {
        const stored = localStorage.getItem("shri_divyam_wishlist_items");
        if (stored) wishlistIds = JSON.parse(stored);
      } catch (e) { }

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
    <div className="relative overflow-hidden bg-white ring-1 ring-[#EFEAE4] h-full flex flex-col group rounded-sm shadow-sm transition-all duration-300 hover:shadow-md">

      {/* Wishlist Button Overlay */}
      <button
        onClick={toggleWishlist}
        disabled={isWishlistLoading}
        className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-[#2B352E]/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-[#135B42] transition-colors duration-300 group/btn"
      >
        <Heart
          size={14}
          strokeWidth={2}
          className={`transition-all duration-300 ${isWishlisted ? 'fill-[#e11d48] text-[#e11d48]' : 'text-white group-hover/btn:scale-110'}`}
        />
      </button>

      <Link href={`/product-details/${product.slug}`} className="block">
        <div className="p-[8px] sm:p-[10px] pb-0">
          <div className="relative aspect-[1/1] w-full overflow-hidden bg-white rounded-sm">
            <Image
              src={getImageUrl(product) || product.image || "https://placehold.co/400x400?text=No+Image"}
              alt={product.title || product.name || "Product"}
              fill
              className="object-contain p-1 transition-transform duration-700 group-hover:scale-105"
              unoptimized={true}
            />
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5 flex flex-col flex-1">
        <Link href={`/product-details/${product.slug || product.id || product._id}`} className="block">
          <h3 className="text-[16px] sm:text-[19px] md:text-[21px] font-medium leading-[1.25] font-gt-walsheim text-[#303030] group-hover:text-[#135B42] transition-colors line-clamp-1 min-h-[1.25em]">
            {product.title || product.name}
          </h3>
        </Link>

        <div className="min-h-[2.9em] mt-2 sm:mt-3">
          <p className="text-[12px] sm:text-[14px] leading-[1.45] font-gt-walsheim text-gray-600 line-clamp-2">
            {product.description || product.short_description}
          </p>
        </div>

        <div className="mt-auto pt-4 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-4 min-h-[28px]">
            {product.salePrice && product.salePrice < product.price ? (
              <>
                <span className="text-[14px] text-gray-400 line-through">
                  {formatPrice(product.price, product.usdPrice)}
                </span>
                <span className="text-[16px] sm:text-[18px] font-bold text-[#135B42]">
                  {formatPrice(product.salePrice, product.usdPrice)}
                </span>
                {Math.round(((product.price - product.salePrice) / product.price) * 100) > 0 && (
                  <span className="text-[10px] font-bold text-[#135B42] bg-[#E5F5ED] px-2 py-0.5 rounded ml-auto">
                    {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                  </span>
                )}
              </>
            ) : (
              <span className="text-[16px] sm:text-[18px] font-bold text-[#135B42]">
                {formatPrice(product.price, product.usdPrice)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 relative z-20">
            {((product.inventory !== undefined && product.inventory !== null && Number(product.inventory) <= 0) ||
              (product.totalInventory !== undefined && product.totalInventory !== null && Number(product.totalInventory) <= 0) ||
              (product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0) ||
              (product.inStock === false) ||
              (product.status === "outofstock" || product.status === "out_of_stock") ||
              (product.variations && product.variations.length > 0 && product.variations.every(v => Number(v.inventory ?? v.stock ?? v.quantity ?? 0) <= 0)) ||
              (product.variants && product.variants.length > 0 && product.variants.every(v => Number(v.inventory ?? v.stock ?? v.quantity ?? 0) <= 0)) ||
              (product.sizes && product.sizes.length > 0 && product.sizes.every(s => Number(s.inventory ?? s.stock ?? s.quantity ?? 0) <= 0)) ||
              (product.rawSizes && product.rawSizes.length > 0 && product.rawSizes.every(s => Number(s.inventory ?? s.stock ?? s.quantity ?? 0) <= 0))) ? (
              <>
                <button
                  onClick={toggleWishlist}
                  className="w-full h-[40px] flex items-center justify-center bg-[#EFE9DF] text-[13px] md:text-[14px] font-medium text-black transition-all duration-300 hover:bg-[#E2DDCF] gap-2"
                >
                  <Heart size={14} className={isWishlisted ? "fill-[#e11d48] text-[#e11d48]" : "text-black"} />
                  {isWishlisted ? "In Wishlist" : "Add to Wishlist"}
                </button>
                <button disabled className="w-full h-[40px] flex items-center justify-center bg-white border border-gray-400 text-gray-500 text-[13px] md:text-[14px] font-medium cursor-not-allowed">
                  Out of Stock
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/product-details/${product.slug || product.id || product._id}`}
                  className="w-full h-[40px] flex items-center justify-center bg-[#DAC153] text-[13px] md:text-[14px] font-medium text-white transition-all duration-300 hover:bg-[#C4AD4A]"
                >
                  Shop Now
                </Link>
                <DirectAddToCart product={product} className="!w-full !h-[40px] !text-[13px] md:!text-[14px]" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}