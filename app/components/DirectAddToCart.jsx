"use client";

import React, { useState, useEffect } from "react";
import { Loader2, ShoppingBag, Eye } from "lucide-react";
import { addToCart, getCartItemQuantity, setPendingAction } from "../utils/cartUtils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function DirectAddToCart({ product, className = "" }) {
  const [isAdding, setIsAdding] = useState(false);
  const [inCart, setInCart] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  const checkCart = () => {
    const { quantity } = getCartItemQuantity(product);
    setInCart(quantity > 0);
  };

  useEffect(() => {
    // Cross-check localStorage against actual cart to fix stale "View Cart" state.
    // If the cart is actually empty on server, wipe stale localStorage quantities.
    const syncAndCheck = async () => {
      try {
        const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (storedToken) {
          const { apiClient } = await import("../utils/apiClient");
          const res = await apiClient.get("/api/cart").catch(() => null);
          if (res) {
            const items = res.data?.items || res.cart?.items || res.items || [];
            if (items.length === 0) {
              // Cart is genuinely empty — clear stale local quantities
              localStorage.removeItem("shri_divyam_cart_quantities");
              setInCart(false);
              return;
            }
          }
        }
      } catch (_) {}
      checkCart();
    };

    syncAndCheck();
    window.addEventListener("cartUpdated", checkCart);
    window.addEventListener("storage", checkCart);
    return () => {
      window.removeEventListener("cartUpdated", checkCart);
      window.removeEventListener("storage", checkCart);
    };
  }, [product]);

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
        setPendingAction("ADD_TO_CART", product, 1, "Standard Size");
        const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/shop";
        window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Please login to add items to your cart.", type: "error" } }));
        setTimeout(() => router.push(`/login?redirect=${encodeURIComponent(currentPath)}`), 1000);
        return;
    }

    if (isAdding) return;
    setIsAdding(true);

    try {
      // 1. Proactive frontend stock check
      const stock = product.inventory ?? product.totalInventory ?? product.stock;
      const { quantity } = getCartItemQuantity(product);
      
      if (stock !== null && stock !== undefined) {
        if (Number(stock) === 0) {
          window.dispatchEvent(new CustomEvent("showGlobalToast", { 
            detail: { message: "Out of stock", type: "error" } 
          }));
          setIsAdding(false);
          return;
        }
        if (quantity >= stock) {
          window.dispatchEvent(new CustomEvent("showGlobalToast", { 
            detail: { message: "Out of stock", type: "error" } 
          }));
          setIsAdding(false);
          return;
        }
      }

      const result = await addToCart(product, 1, "Standard Size");

      if (result.success) {
        window.dispatchEvent(new CustomEvent("showGlobalToast", { 
          detail: { message: `${product.title || product.name || "Product"} added to cart!` } 
        }));
        setInCart(true);
      } else {
        // 2. Format backend errors to be user-friendly
        let errMsg = result.message || "Failed to add to cart";
        if (errMsg.toLowerCase().includes("stock") || errMsg.toLowerCase().includes("inventory")) {
            errMsg = "Out of stock";
        }
        
        window.dispatchEvent(new CustomEvent("showGlobalToast", { 
          detail: { message: errMsg, type: "error" } 
        }));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent("showGlobalToast", { 
        detail: { message: "An error occurred while adding to cart", type: "error" } 
      }));
    } finally {
      setIsAdding(false);
    }
  };

  if (inCart) {
    return (
      <div className="relative w-full">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push('/cart');
          }}
          className={`w-full h-[40px] md:h-[42px] border font-medium text-[13px] md:text-[14px] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 rounded-xs select-none bg-[#135B42] border-[#135B42] text-white hover:bg-white hover:text-[#135B42] ${className}`}
        >
          <Eye size={16} />
          <span>View Cart</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={handleAdd}
        disabled={isAdding}
        className={`w-full h-[40px] md:h-[42px] border font-medium text-[13px] md:text-[14px] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 rounded-xs select-none border-[#135B42] text-[#135B42] bg-white hover:bg-[#135B42] hover:text-white ${className}`}
      >
        {isAdding ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Adding...</span>
          </>
        ) : (
          <>
            <ShoppingBag size={15} />
            <span>Add to Cart</span>
          </>
        )}
      </button>
    </div>
  );
}
