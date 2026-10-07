"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Loader2, ArrowLeft, ShoppingBag, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Truck, Award } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "../context/CurrencyContext";
import { products as staticProducts } from "../data/products";
import { useAuth } from "../context/AuthContext";

function CartContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { formatPrice } = useCurrency();
    const { token, loading: authLoading } = useAuth();

    useEffect(() => {
        // Redirect logic removed to allow page view
    }, [authLoading, token, router]);

    const productId = searchParams.get("productId");
    const [variantId, setVariantId] = useState(searchParams.get("variantId"));
    const [quantity, setQuantity] = useState(Number(searchParams.get("quantity")) || 1);

    // Attempt to find product in static data if name/image missing from URL
    const slug = searchParams.get("slug");
    const staticMatch = staticProducts.find(p => String(p.id) === String(productId) || p.slug === slug);

    const productName = searchParams.get("name") || staticMatch?.title || staticMatch?.name || "Loading Product...";
    const productImage = searchParams.get("image") || staticMatch?.image;

    // Get raw prices for dynamic formatting
    const priceINR = searchParams.get("priceINR") || staticMatch?.price;
    const priceUSD = searchParams.get("priceUSD");

    const [productVariantName, setProductVariantName] = useState(searchParams.get("variantName") || "");

    // NEW DYNAMIC STATES
    const [productData, setProductData] = useState(null);
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedSize, setSelectedSize] = useState("");

    const [isAdding, setIsAdding] = useState(false);
    const [isLoadingVariants, setIsLoadingVariants] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    // EFFECT TO FETCH FULL PRODUCT DATA
    useEffect(() => {
        if (slug) {
            const fetchProductInfo = async () => {
                setIsLoadingVariants(true);
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${slug}`);
                    const text = await res.text();
                    let data = null;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        console.error("Cart: Product API returned non-JSON response");
                    }

                    if (data && data.product) {
                        // Map variants to variations to handle API differences
                        if (data.product.variants && !data.product.variations) {
                            data.product.variations = data.product.variants;
                        }

                        setProductData(data.product);

                        // Parse current variant from variantName if available
                        let currentColor = "";
                        let currentSize = "";

                        if (productVariantName) {
                            const [sizeStr, colorStr] = productVariantName.split(" / ");
                            currentSize = sizeStr?.trim();
                            currentColor = colorStr?.trim();
                        }

                        // Initialize selections with in-stock prioritization
                        if (data.product.variations && data.product.variations.length > 0) {
                            // 1. Try to find the requested variant from URL params
                            let initialVariant = data.product.variations.find(v =>
                                (currentColor ? v.color === currentColor : true) &&
                                (currentSize ? v.size === currentSize : true)
                            );

                            // 2. If that variant is out of stock, or not found, pick the first in-stock one
                            if (!initialVariant || Number(initialVariant.stock) <= 0) {
                                const inStock = data.product.variations.find(v => Number(v.stock) > 0);
                                if (inStock) initialVariant = inStock;
                            }

                            // 3. Final fallback to first variant
                            if (!initialVariant) initialVariant = data.product.variations[0];

                            setSelectedColor(initialVariant.color);
                            setSelectedSize(initialVariant.size);
                            if (!variantId) setVariantId(initialVariant.id);
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch product details:", e);
                } finally {
                    setIsLoadingVariants(false);
                }
            };
            fetchProductInfo();
        }
    }, [slug, variantId, productVariantName]);


    // DYNAMIC DERIVED DATA
    const activeVariation = productData?.variations?.find(
        (v) => v.color === selectedColor && v.size === selectedSize
    ) || productData?.variations?.find(v => v.color === selectedColor) || productData?.variations?.[0];

    // Current Prices (Live mapping)
    const currentPriceINR = activeVariation?.price || priceINR;
    const currentPriceUSD = activeVariation?.usd_price || priceUSD;

    // Use active variant ID for the final submission
    const finalVariantId = activeVariation?.id || variantId;

    // Format current price based on currency context
    const formattedPrice = formatPrice(currentPriceINR, currentPriceUSD);
    const formattedTotalPrice = formatPrice(Number(currentPriceINR || 0) * quantity, Number(currentPriceUSD || 0) * quantity);

    const handleConfirmAdd = async () => {
        if (isAdding) return;
        setIsAdding(true);
        setStatus({ type: "", message: "" });

        const token = localStorage.getItem("token");
        const GUEST_CART_KEY = "shri_divyam_guest_cart";

        if (!token || token === "dummy-token-for-now") {
            // --- GUEST CART MODE ---
            try {
                const guestCartStr = localStorage.getItem(GUEST_CART_KEY);
                let guestCart = guestCartStr ? JSON.parse(guestCartStr) : [];

                // Add or update item in guest cart
                const existingIndex = guestCart.findIndex(it =>
                    String(it.product_id) === String(productId) &&
                    String(it.variant_id) === String(finalVariantId)
                );

                if (existingIndex > -1) {
                    guestCart[existingIndex].quantity = Number(guestCart[existingIndex].quantity) + Number(quantity);
                    guestCart[existingIndex].price = Number(currentPriceINR || priceINR || 0);
                    guestCart[existingIndex].sale_price = Number(currentPriceINR || priceINR || 0);
                    guestCart[existingIndex].selling_price = Number(currentPriceINR || priceINR || 0);
                    if (selectedSize) guestCart[existingIndex].size = selectedSize;
                    if (selectedColor) guestCart[existingIndex].color = selectedColor;
                } else {
                    guestCart.push({
                        productId: productId,
                        product_id: productId,
                        variant_id: finalVariantId,
                        variant: finalVariantId,
                        size: selectedSize,
                        color: selectedColor,
                        product_name: productName,
                        title: productName,
                        name: productName,
                        price: Number(currentPriceINR || priceINR || 0),
                        sale_price: Number(currentPriceINR || priceINR || 0),
                        selling_price: Number(currentPriceINR || priceINR || 0),
                        image_path: productImage || productData?.image || "/logo.png",
                        image: productImage || productData?.image || "/logo.png",
                        slug: slug || productData?.slug || "",
                        quantity: Number(quantity),
                        added_at: new Date().toISOString()
                    });
                }

                localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));

                // Also save to quantities override list for consistency
                const CART_QUANTITIES_KEY = "shri_divyam_cart_quantities";
                const qtyStored = localStorage.getItem(CART_QUANTITIES_KEY);
                const quantities = qtyStored ? JSON.parse(qtyStored) : {};
                const key = `${productId}_${finalVariantId || ''}`;
                quantities[key] = (quantities[key] || 0) + Number(quantity);
                localStorage.setItem(CART_QUANTITIES_KEY, JSON.stringify(quantities));

                // ★ Clear this product from removed list so it shows up if it was previously deleted
                try {
                    const REMOVED_ITEMS_KEY = "shri_divyam_removed_cart_items";
                    const stored = localStorage.getItem(REMOVED_ITEMS_KEY);
                    if (stored) {
                        const removed = JSON.parse(stored);
                        const filtered = removed.filter(r => {
                            const r_pId = String(r.pId || r.product_id || "");
                            return r_pId !== String(productId);
                        });
                        localStorage.setItem(REMOVED_ITEMS_KEY, JSON.stringify(filtered));
                    }
                } catch (e) { /* ignore */ }

                // Signal header to update count
                window.dispatchEvent(new Event("cartUpdated"));

                setStatus({
                    type: "success",
                    message: "Item added to your guest bag! Log in later to save it permanently."
                });

                setTimeout(() => router.push("/cart"), 2000);
            } catch (e) {
                console.error("Guest cart error:", e);
                setStatus({ type: "error", message: "Failed to add to guest cart. Please try logging in." });
            }
            return;
        }

        // Basic JWT format check (should have 3 parts separated by dots)
        const jwtParts = token.split('.');
        if (jwtParts.length !== 3) {
            console.error("❌ Invalid token format (not a JWT):", token.substring(0, 20) + "...");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setStatus({ type: "error", message: "Your session token is invalid. Please login again." });
            setTimeout(() => router.push("/login"), 2000);
            return;
        }

        if (!finalVariantId) {
            setStatus({ type: "error", message: "Please wait, or select a variant first." });
            setIsAdding(false);
            return;
        }

        try {
            const payload = {
                product_id: Number(productId),
                variant_id: Number(finalVariantId),
                quantity: Number(quantity)
            };

            console.log("🛒 Add to Cart Payload:", payload);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            // Use the direct backend URL to avoid local proxy issues
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const text = await response.text();
            let data = {};

            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    // Extract title or message from HTML if present
                    const rawMessage = text.replace(/(<([^>]+)>)/gi, "").substring(0, 50).trim();
                    console.error("JSON Parse Error on Response:", text);
                    if (!response.ok) {
                        setStatus({ type: "error", message: `Server 500: ${rawMessage || "Fatal backend error"}` });
                        return;
                    }
                }
            }

            if (response.ok && data.status !== 'error' && data.success !== false) {
                setStatus({ type: "success", message: data.message || "Product successfully added to your cart!" });

                // ★ Clear this product from localStorage removed list so it shows in My Bag
                try {
                    const REMOVED_ITEMS_KEY = "shri_divyam_removed_cart_items";
                    const stored = localStorage.getItem(REMOVED_ITEMS_KEY);
                    if (stored) {
                        const removed = JSON.parse(stored);
                        const filtered = removed.filter(r => {
                            if (r.pId && String(r.pId) === String(productId)) return false;
                            if (r.product_id && String(r.product_id) === String(productId)) return false;
                            return true;
                        });
                        localStorage.setItem(REMOVED_ITEMS_KEY, JSON.stringify(filtered));
                    }

                    // NOTE: For logged-in users, we no longer manually increment quantities here.
                    // The server handles the increment, and My Bag will fetch the fresh total.
                    // This prevents the "Double Increment" bug (server +1 and local +1).
                } catch (e) { /* ignore */ }

                setTimeout(() => router.push("/cart"), 2000);
                // Signal header to update count
                window.dispatchEvent(new Event("cartUpdated"));
            } else {
                setStatus({ type: "error", message: data.message || data.error || `Failed to add product (Error ${response.status}).` });
            }
        } catch (error) {
            console.error("Cart API Error Details:", error);
            if (error.name === 'AbortError') {
                setStatus({ type: "error", message: "Request timed out. The server took too long to respond." });
            } else {
                setStatus({ type: "error", message: "Unexpected API or network error. Check your connection." });
            }
        } finally {
            setIsAdding(false);
        }
    };

    const autoResumeRef = useRef(false);

    // AUTO-RESUME PENDING ACTION AFTER LOGIN
    useEffect(() => {
        const token = localStorage.getItem("token");
        const pendingAction = localStorage.getItem("pending_cart_action");

        if (token && pendingAction && !isAdding && status.type !== "success" && !autoResumeRef.current) {
            try {
                const action = JSON.parse(pendingAction);
                // Check if this is the right product page
                if (String(action.productId) === String(productId) && String(action.variantId) === String(finalVariantId)) {
                    console.log("🚀 Auto-resuming pending cart action...");
                    autoResumeRef.current = true; // Mark as handled to prevent re-trigger
                    localStorage.removeItem("pending_cart_action");
                    handleConfirmAdd();
                }
            } catch (e) {
                localStorage.removeItem("pending_cart_action");
            }
        }
    }, [productId, finalVariantId, isAdding, status.type]);

    if (!productId || (isLoadingVariants && !variantId)) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                {isLoadingVariants ? (
                    <Loader2 size={48} className="text-[#135B42] animate-spin mb-6" />
                ) : (
                    <ShoppingBag size={64} className="text-gray-300 mb-6" />
                )}
                <h2 className="text-2xl font-playfair font-semibold text-[#303030] mb-2">
                    {isLoadingVariants ? "Loading details..." : "Your pending cart is empty"}
                </h2>
                {!isLoadingVariants && (
                    <p className="text-gray-500 mb-8 max-w-md">It looks like you haven't selected a product to add yet. Browse our latest collection to find something special.</p>
                )}
                {!isLoadingVariants && (
                    <Link href="/">
                        <button className="bg-[#135B42] text-white px-8 py-3 font-medium hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition">
                            Browse Collection
                        </button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 md:px-16 lg:px-24 py-2 md:py-3">
            <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-4">
                <Link href="/" className="hover:text-[#135B42] transition">Home</Link>
                <span>/</span>
                <span className="text-[#303030] font-medium">Add to Cart</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:items-start">
                {/* Left Side: Product Summary */}
                <div className="bg-white border border-[#E8DDD4] rounded-sm p-5 sm:p-7 shadow-sm flex flex-col h-auto">
                    <h2 className="text-lg sm:text-2xl font-playfair font-bold text-[#303030] mb-4 relative">
                        Review Your Selection
                        <span className="absolute -bottom-3 left-0 w-20 h-1 bg-[#135B42]"></span>
                    </h2>

                    <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start flex-1 relative">
                        {/* Image & Trust Badges Column */}
                        <div className="w-full md:w-[280px] flex flex-col gap-5 md:sticky md:top-6 self-start">
                            <div className="w-full aspect-square bg-[#F9F7F5] rounded-md overflow-hidden border border-[#E8DDD4] shadow-sm group relative">
                                {(productImage || productData?.image || (productData?.images && productData.images[0])) ? (
                                    <img src={productImage || productData?.image || (productData?.images && productData.images[0])} alt={productName} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 italic">No Image</div>
                                )}
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>

                            {/* Trust Badges */}
                            <div className="hidden md:flex flex-col gap-3">
                                <div className="flex items-center gap-3 p-3.5 bg-[#F9F7F5] border border-[#E8DDD4] rounded-md shadow-sm transition-all hover:border-[#135B42]/30 group">
                                    <ShieldCheck size={22} className="text-[#135B42] shrink-0 group-hover:scale-110 transition-transform" />
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#303030]">100% Secure Checkout</p>
                                </div>
                                <div className="flex items-center gap-3 p-3.5 bg-[#F9F7F5] border border-[#E8DDD4] rounded-md shadow-sm transition-all hover:border-[#135B42]/30 group">
                                    <Award size={22} className="text-[#135B42] shrink-0 group-hover:scale-110 transition-transform" />
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#303030]">Premium Quality</p>
                                </div>
                                <div className="flex items-center gap-3 p-3.5 bg-[#F9F7F5] border border-[#E8DDD4] rounded-md shadow-sm transition-all hover:border-[#135B42]/30 group">
                                    <Truck size={22} className="text-[#135B42] shrink-0 group-hover:scale-110 transition-transform" />
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#303030]">Fast & Safe Shipping</p>
                                </div>
                            </div>
                        </div>

                        {/* Product Variations Column */}
                        <div className="flex-1 flex flex-col py-0 gap-4">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                        <h3 className="text-xl sm:text-3xl font-playfair font-semibold text-[#303030] leading-tight">{productName}</h3>
                                        {productData && (
                                            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-sm border border-green-100 font-bold uppercase tracking-wider">
                                                {productData.variations?.reduce((acc, v) => acc + (v.stock || 0), 0)} Total in stock
                                            </span>
                                        )}
                                    </div>
                                    <p className="inline-block bg-[#F9F7F5] text-[#135B42] text-[13px] font-bold px-3 py-1 rounded-full border border-[#135B42]/10">
                                        ID: {productId}
                                    </p>

                                    {productData && productData.variations && (
                                        <div className="mt-2 text-[12px] text-gray-500 font-medium">
                                            <span className="text-[#303030] font-bold">Available Colors:</span> {Array.from(new Set(productData.variations.map(v => v.color))).join(", ")}
                                        </div>
                                    )}
                                </div>

                                {formattedPrice && (
                                    <p className="text-2xl sm:text-3xl font-bold text-[#135B42] tracking-tight">{formattedPrice}</p>
                                )}
                            </div>

                            {/* COLOR & SIZE SELECTION */}
                            <div className="mt-6 flex flex-col gap-4">
                                {productData && productData.variations && (
                                    <>
                                        {/* COLOR SELECTION */}
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Color: <span className="text-[#303030]">{selectedColor}</span></p>
                                            <div className="flex gap-2.5 flex-wrap">
                                                {Array.from(new Set(productData.variations.map(v => v.color))).map(color => {
                                                    const colorStock = productData.variations.filter(v => v.color === color).reduce((sum, v) => sum + (v.stock || 0), 0);
                                                    return (
                                                        <button
                                                            key={color}
                                                            onClick={() => setSelectedColor(color)}
                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-[11px] font-medium transition-all cursor-pointer ${selectedColor === color ? "border-[#135B42] bg-[#135B42]/5 text-[#135B42]" : "border-gray-200 bg-white text-gray-600 hover:border-[#135B42]"}`}
                                                        >
                                                            <span className="w-4 h-4 rounded-full border border-gray-200 shadow-inner" style={{ backgroundColor: color }}></span>
                                                            {color}
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${colorStock > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                                                                {colorStock}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* SIZE SELECTION */}
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Size: <span className="text-[#303030]">{selectedSize}</span></p>
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from(new Set(productData.variations.filter(v => v.color === selectedColor).map(v => v.size))).map(size => {
                                                    const sizeVariant = productData.variations.find(v => v.color === selectedColor && v.size === size);
                                                    const sizeStock = sizeVariant?.stock || 0;
                                                    return (
                                                        <button
                                                            key={size}
                                                            onClick={() => setSelectedSize(size)}
                                                            className={`px-4 py-1.5 text-xs font-semibold rounded-sm border transition-all cursor-pointer ${selectedSize === size
                                                                ? "bg-[#135B42] border-[#135B42] text-white"
                                                                : "bg-white border-gray-200 text-gray-600 hover:border-[#135B42]"}`}
                                                        >
                                                            {size} <span className="opacity-70">({sizeStock})</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* PRODUCT SPECIFICATIONS */}
                            <div className="mt-8 bg-[#F9F7F5] border border-[#E8DDD4] p-6 rounded-sm">
                                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#135B42] mb-5 pb-2 border-b border-[#E8DDD4]/50 flex justify-between items-center">
                                    <span>Product Specifications</span>
                                    <span className="text-[9px] bg-[#135B42]/5 px-2 py-0.5 rounded text-[#135B42]">Live Data</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Selection</span>
                                        <span className="text-[#303030] font-semibold">{selectedColor && selectedSize ? `${selectedSize} / ${selectedColor}` : (productVariantName || "Standard Selection")}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Quantity</span>
                                        <div className="flex items-center border border-[#E8DDD4] rounded-sm w-[110px] bg-white h-8 mt-1">
                                            <button
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition border-r border-[#E8DDD4]"
                                            >-</button>
                                            <span className="flex-1 text-center text-[#303030] font-semibold text-sm">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(q => {
                                                    const stockVal = activeVariation?.stock ? Number(activeVariation.stock) : 10;
                                                    return Math.min(stockVal > 0 ? stockVal : 10, q + 1);
                                                })}
                                                className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition border-l border-[#E8DDD4]"
                                            >+</button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Current Stock</span>
                                        <span className={`${activeVariation?.stock > 0 ? "text-green-600" : "text-red-600"} font-bold flex items-center gap-1`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${activeVariation?.stock > 0 ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                                            {activeVariation?.stock > 0 ? `${activeVariation.stock} Units Available` : "Out of Stock"}
                                        </span>
                                    </div>
                                </div>

                                {/* FULL AVAILABILITY TABLE */}
                                {productData && productData.variations && (
                                    <div className="mt-6 pt-5 border-t border-[#E8DDD4]/50">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">All Variants Availability</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-[12px]">
                                                <thead>
                                                    <tr className="text-gray-400 border-b border-[#E8DDD4]/30">
                                                        <th className="pb-2 font-bold">Color</th>
                                                        <th className="pb-2 font-bold">Size</th>
                                                        <th className="pb-2 font-bold text-right">Stock</th>
                                                        <th className="pb-2 font-bold text-right">Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#E8DDD4]/20">
                                                    {productData.variations.map((v, idx) => (
                                                        <tr
                                                            key={idx}
                                                            onClick={() => { setSelectedColor(v.color); setSelectedSize(v.size); }}
                                                            className={`cursor-pointer transition-colors ${v.color === selectedColor && v.size === selectedSize ? "bg-[#135B42]/5 text-[#135B42] font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                                                        >
                                                            <td className="py-2.5 flex items-center gap-2">
                                                                <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: v.color }}></span>
                                                                {v.color}
                                                            </td>
                                                            <td className="py-2.5">{v.size}</td>
                                                            <td className={`py-2.5 text-right font-semibold ${v.stock > 0 ? "text-green-600" : "text-red-400"}`}>{v.stock}</td>
                                                            <td className="py-2.5 text-right">{formatPrice(v.price, v.usd_price)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Order Summary */}
                <div className="bg-[#FDF8F3] border border-[#E8DDD4] rounded-sm p-5 sm:p-7 shadow-lg flex flex-col justify-between h-auto lg:sticky lg:top-24">
                    <div>
                        <h3 className="text-lg font-playfair font-bold text-[#303030] mb-4 pb-2 border-b border-[#E8DDD4]">Order Summary</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Subtotal ({quantity} item{quantity !== 1 ? "s" : ""})</span>
                                <span className="font-semibold text-[#303030]">{formattedTotalPrice || "TBD"}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Standard Shipping</span>
                                <span className="text-green-600 font-bold uppercase text-[10px] tracking-widest bg-green-50 px-2 py-0.5 rounded border border-green-100">FREE</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="pt-4 border-t-[2px] border-[#E8DDD4] flex justify-between items-end mb-6">
                            <div>
                                <span className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-1">Total Amount</span>
                                <span className="font-bold text-[#303030] text-lg uppercase">Grand Total</span>
                            </div>
                            <span className="font-bold text-[#135B42] text-2xl sm:text-3xl tracking-tight">{formattedTotalPrice || "TBD"}</span>
                        </div>

                        {status.message && (
                            <div className={`mb-6 p-4 rounded-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                                {status.type === "success" ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                                <p className="text-sm font-medium leading-relaxed">{status.message}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {status.type === "success" ? (
                                <button
                                    onClick={() => router.push("/cart")}
                                    className={`w-full py-5 bg-[#135B42] text-white font-bold uppercase tracking-[0.25em] text-[13px] hover:bg-[#0f4a36] transition-all flex items-center justify-center rounded-sm shadow-[0_10px_20px_-10px_rgba(122,31,61,0.3)] active:scale-[0.98]`}
                                >
                                    View Cart
                                </button>
                            ) : (
                                <button
                                    onClick={handleConfirmAdd}
                                    disabled={isAdding || isLoadingVariants || !(activeVariation?.stock > 0)}
                                    className={`w-full py-5 bg-[#135B42] text-white font-bold uppercase tracking-[0.25em] text-[13px] hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-all flex items-center justify-center gap-3 rounded-sm shadow-[0_10px_20px_-10px_rgba(122,31,61,0.3)] active:scale-[0.98] ${isAdding || isLoadingVariants || !(activeVariation?.stock > 0) ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {isAdding ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Adding to Cart...
                                        </>
                                    ) : isLoadingVariants ? (
                                        "Checking Data..."
                                    ) : !(activeVariation?.stock > 0) ? (
                                        "Out of Stock"
                                    ) : (
                                        "Add To Cart"
                                    )}
                                </button>
                            )}

                            <button
                                onClick={() => router.back()}
                                className="w-full flex items-center justify-center gap-2 text-[12px] uppercase tracking-widest font-bold text-gray-400 hover:text-[#135B42] transition py-2"
                            >
                                <ArrowLeft size={16} />
                                Keep Shopping
                            </button>
                        </div>

                        <p className="mt-8 text-[10px] text-center text-gray-400 font-medium">
                            Premium Devotional Clothing by Sri Divyam. <br />
                            Safe & Secure Packaging.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CartPage() {
    return (
        <main className="bg-white min-h-screen flex flex-col">
            <Header />
            <div className="flex-1 bg-[#F9F7F5]">
                <Suspense fallback={
                    <div className="flex-1 flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-[#135B42]" size={48} />
                    </div>
                }>
                    <CartContent />
                </Suspense>
            </div>
            <Footer />
        </main>
    );
}
