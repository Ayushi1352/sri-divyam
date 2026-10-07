"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Heart,
    ShoppingCart,
    Trash2,
    ShieldCheck,
    RefreshCw,
    Truck,
    Award,
    ChevronRight,
    ArrowLeft,
    Loader2,
    X
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiClient } from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import { addToCart, getGuestWishlistIds, removeGuestWishlistItem } from "../utils/cartUtils";

function WishlistCardImage({ src, alt }) {
    const [imgLoading, setImgLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <div className="relative aspect-square w-full bg-[#FCF9F6] overflow-hidden flex items-center justify-center">
            {imgLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#F9F6F0] z-0">
                    <Loader2 size={24} className="animate-spin text-[#135B42]" />
                </div>
            )}
            <img
                src={error ? "https://placehold.co/400x400?text=No+Image" : src}
                alt={alt}
                onLoad={() => setImgLoading(false)}
                onError={() => { setImgLoading(false); setError(true); }}
                className={`w-full h-full object-cover mix-blend-darken transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
            />
        </div>
    );
}

export default function WishlistPage() {
    const { token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [movingId, setMovingId] = useState(null);
    const [removingId, setRemovingId] = useState(null);

    useEffect(() => {
        // Redirect logic removed to allow page view
    }, [authLoading, token, router]);

    const fetchWishlist = async () => {
        setLoading(true);
        if (!token) {
            try {
                const guestIds = getGuestWishlistIds();
                if (guestIds.length === 0) {
                    setWishlist([]);
                } else {
                    const productsRes = await apiClient.get("/api/products?limit=1000").catch(() => ({ data: [] }));
                    let allProds = productsRes.products || (productsRes.data && productsRes.data.products) || productsRes.data || [];
                    if (!Array.isArray(allProds)) allProds = [];
                    const filtered = allProds.filter(p => guestIds.map(String).includes(String(p._id || p.id)));
                    setWishlist(filtered);
                }
            } catch (err) {
                console.error("Failed to fetch guest wishlist:", err);
            } finally {
                setLoading(false);
            }
            return;
        }

        try {
            const data = await apiClient.get("/api/auth/wishlist");
            const items = data.wishlist || data.data || data || [];
            const mappedItems = items.map(item => item.product || item);
            setWishlist(mappedItems);
        } catch (error) {
            console.error("Failed to fetch wishlist:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchWishlist();
        }
    }, [token, authLoading]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price).replace("₹", "₹ ");
    };

    const handleRemove = async (productId, silent = false) => {
        setRemovingId(productId);
        try {
            if (!token) {
                removeGuestWishlistItem(productId);
                setWishlist(prev => prev.filter(item => String(item._id || item.id) !== String(productId)));
                window.dispatchEvent(new Event("wishlistUpdated"));
                if (!silent) window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Removed from wishlist" } }));
                return;
            }

            await apiClient.post("/api/auth/wishlist/remove", { productId });
            fetchWishlist();
            window.dispatchEvent(new Event("wishlistUpdated"));
            if (!silent) window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Removed from wishlist" } }));
        } catch (error) {
            if (!silent) alert(error.message || "Failed to remove item");
        } finally {
            setRemovingId(null);
        }
    };

    const handleMoveToCart = async (product, productId, item = {}) => {
        setMovingId(productId);
        try {
            const chosenSize = item?.size || item?.variantDetails?.size || "Standard Size";
            await addToCart(product, 1, chosenSize, { size: chosenSize });
            await handleRemove(productId, true); // silent true
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Product moved to cart successfully!" } }));
        } catch (error) {
            console.error("Error moving to cart:", error);
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Failed to move item to cart" } }));
        } finally {
            setMovingId(null);
        }
    };

    const [isClearing, setIsClearing] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);

    const handleClearWishlist = async () => {
        setIsClearing(true);
        try {
            if (!token) {
                localStorage.setItem("shri_divyam_guest_wishlist", JSON.stringify([]));
                localStorage.setItem("shri_divyam_wishlist_items", JSON.stringify([]));
                setWishlist([]);
                window.dispatchEvent(new Event("wishlistUpdated"));
                window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "All items removed from wishlist successfully!", type: "success" } }));
            } else {
                try {
                    await apiClient.post("/api/auth/wishlist/clear");
                } catch (e) {
                    await Promise.all(wishlist.map(item => {
                        const id = item._id || item.id;
                        return apiClient.post("/api/auth/wishlist/remove", { productId: id }).catch(() => { });
                    }));
                }
                localStorage.setItem("shri_divyam_wishlist_items", JSON.stringify([]));
                localStorage.setItem("shri_divyam_guest_wishlist", JSON.stringify([]));
                setWishlist([]);
                window.dispatchEvent(new Event("wishlistUpdated"));
                window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "All items removed from wishlist successfully!", type: "success" } }));
            }
        } catch (error) {
            console.error("Failed to clear wishlist:", error);
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Failed to clear wishlist", type: "error" } }));
        } finally {
            setIsClearing(false);
            setShowClearModal(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col font-poppins bg-[#FFFDF9] text-[#303030]">
            <Header />

            {/* MAIN CONTENT */}
            <div className="flex-1 py-10 lg:py-16">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 lg:px-24">

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-32">
                            <Loader2 size={42} className="animate-spin text-[#135B42] mb-3" />
                            <p className="text-sm font-medium text-gray-500">Loading wishlist...</p>
                        </div>
                    ) : wishlist.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Heart size={64} className="text-gray-300 mb-6" strokeWidth={1.5} />
                            <h2 className="text-2xl font-playfair font-semibold text-[#303030] mb-2">Your wishlist is empty</h2>
                            <p className="text-gray-500 mb-8 max-w-md">Browse our collection and save your favorite divine poshaks here.</p>
                            <Link href="/shop">
                                <button className="bg-[#135B42] text-white px-8 py-3 font-medium hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition rounded-md shadow-md cursor-pointer">
                                    Start Shopping
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between pb-6 border-b border-[#E8DDD4] mb-8">
                                <h1 className="text-2xl sm:text-3xl font-bold text-[#135B42]">My Wishlist</h1>
                                <div className="flex items-center gap-4">
                                    <span className="text-[14px] text-gray-500 font-medium">{wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}</span>
                                    {wishlist.length > 0 && (
                                        <button
                                            onClick={() => setShowClearModal(true)}
                                            disabled={isClearing}
                                            className="text-[13px] font-semibold text-red-500 border border-red-500 rounded px-3 py-1.5 hover:bg-red-50 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {wishlist.map((item) => {
                                    const product = item.product || item;
                                    const productId = product._id || product.id || product.productId;
                                    const isMoving = movingId === productId;
                                    const isRemoving = removingId === productId;
                                    const imgSrc = product.images?.[0] || product.image || product.image_path || "https://placehold.co/400x400?text=No+Image";

                                    return (
                                        <div key={productId} className="flex flex-col bg-white border border-[#E8DDD4]/50 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all hover:shadow-md rounded-sm overflow-hidden">
                                            {/* Image Container with Loading Skeleton */}
                                            <div className="relative aspect-[1/1] w-full p-[8px] sm:p-[10px] pb-0 bg-white">
                                                <div className="relative w-full h-full overflow-hidden bg-white rounded-sm group/img cursor-pointer">
                                                    <Link href={`/product-details/${product.slug || product.id}`}>
                                                        <WishlistCardImage src={imgSrc} alt={product.title || product.name || "Product"} />
                                                    </Link>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => handleRemove(productId)}
                                                    disabled={isRemoving || isMoving}
                                                    aria-label="Remove item"
                                                    className="absolute top-2 right-2 md:top-3 md:right-3 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100 hover:bg-red-50 transition-colors z-10 group cursor-pointer disabled:opacity-50"
                                                >
                                                    {isRemoving ? (
                                                        <Loader2 size={13} className="animate-spin text-red-500" />
                                                    ) : (
                                                        <Trash2 size={14} className="text-red-500 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Product Details */}
                                            <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5 flex flex-col flex-1">
                                                <Link href={`/product-details/${product.slug || product.id}`} className="block">
                                                    <h3 className="text-[16px] sm:text-[19px] md:text-[21px] font-medium leading-[1.25] font-gt-walsheim text-[#303030] hover:text-[#135B42] transition-colors line-clamp-1 min-h-[1.25em]">
                                                        {product.title || product.name}
                                                    </h3>
                                                </Link>

                                                <div className="min-h-[2.9em] mt-2 sm:mt-3">
                                                    <p className="text-[12px] sm:text-[14px] leading-[1.45] font-gt-walsheim text-gray-600 line-clamp-2">
                                                        {product.description || "Beautifully crafted divine item."}
                                                    </p>
                                                </div>
                                                <p className="text-[12px] text-[#d97706] font-medium italic mt-1">
                                                    Size: {item.size || item.variantDetails?.size || item.variant?.size || item.variation?.size || (typeof item.variant === 'string' && item.variant && isNaN(Number(item.variant)) ? item.variant : "") || "Standard Size"}
                                                </p>

                                                <div className="mt-auto pt-4 flex flex-col">
                                                    <div className="flex flex-wrap items-center gap-2 mb-4 min-h-[28px]">
                                                        {product.salePrice && product.price && product.salePrice < product.price ? (
                                                            <>
                                                                <span className="text-[14px] text-gray-400 line-through">
                                                                    {formatPrice(product.price, product.usdPrice)}
                                                                </span>
                                                                <span className="text-[16px] sm:text-[18px] font-bold text-[#135B42]">
                                                                    {formatPrice(product.salePrice, product.usdPrice)}
                                                                </span>
                                                                {Math.round(((product.price - product.salePrice) / product.price) * 100) > 0 && (
                                                                    <span className="text-[10px] font-bold text-[#104731] bg-[#E5F5ED] px-2 py-0.5 rounded ml-auto">
                                                                        {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-[16px] sm:text-[18px] font-bold text-[#135B42]">
                                                                {formatPrice(product.salePrice || product.price || 0, product.usdPrice)}
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
                                                            <button 
                                                                disabled
                                                                className="w-full h-[40px] flex items-center justify-center bg-white border border-gray-400 text-gray-500 text-[13px] md:text-[14px] font-medium cursor-not-allowed"
                                                            >
                                                                <span>Out of Stock</span>
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleMoveToCart(product, productId, item)}
                                                                disabled={isMoving || isRemoving}
                                                                className="w-full py-2 bg-white border border-[#135B42] text-[#135B42] font-semibold text-[12px] md:text-[13px] hover:bg-[#135B42] hover:text-white transition-colors text-center cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                                                            >
                                                                {isMoving ? (
                                                                    <>
                                                                        <Loader2 size={14} className="animate-spin" />
                                                                        <span>Moving to Cart...</span>
                                                                    </>
                                                                ) : (
                                                                    <span>Move to Cart</span>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Custom Clear Wishlist Modal */}
            {showClearModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-[450px] overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-[#fff1f2] px-6 py-4 flex items-center justify-between border-b border-[#ffe4e6]">
                            <h3 className="text-[#be123c] text-[17px] font-bold">Clear Wishlist</h3>
                            <button onClick={() => setShowClearModal(false)} className="text-[#e11d48] hover:text-[#9f1239] cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 pb-6">
                            <p className="text-[#303030] text-[14px] md:text-[15px] leading-relaxed font-gt-walsheim">
                                Are you sure you want to clear your entire wishlist? All items will be removed.
                            </p>
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="px-5 py-2 rounded-md bg-white border border-gray-300 text-[14px] font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearWishlist}
                                disabled={isClearing}
                                className="px-5 py-2 rounded-md bg-[#e00000] hover:bg-[#be0000] text-white text-[14px] font-bold transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isClearing && <Loader2 size={16} className="animate-spin" />}
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </main>
    );
}
