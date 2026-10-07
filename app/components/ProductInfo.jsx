"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import {
    Minus,
    Plus,
    ShoppingBag,
    Zap,
    Heart,
    Share2,
    Sparkles,
    ShieldCheck,
    Truck,
    RefreshCcw,
    AlertTriangle,
    Award,
    Loader2,
    Check,
    Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import { addToCart, getCartItemQuantity, setPendingAction } from "../utils/cartUtils";
import { apiClient } from "../utils/apiClient";

const COLOR_MAP = {
    'blue': '#2563EB',
    'royal blue': '#4169E1',
    'navy blue': '#000080',
    'navy': '#000080',
    'sky blue': '#38BDF8',
    'red': '#DC2626',
    'dark red': '#8B0000',
    'maroon': '#800000',
    'yellow': '#EAB308',
    'haldi yellow': '#FFC000',
    'gold': '#D4AF37',
    'golden': '#D4AF37',
    'green': '#16A34A',
    'dark green': '#135B42',
    'pista green': '#93C572',
    'rama green': '#00A877',
    'pink': '#EC4899',
    'rani pink': '#E75480',
    'light pink': '#FBCFE8',
    'orange': '#F97316',
    'saffron': '#FF9933',
    'purple': '#9333EA',
    'white': '#FFFFFF',
    'cream': '#FFFDD0',
    'black': '#111827',
    'grey': '#6B7280',
    'gray': '#6B7280',
    'silver': '#C0C0C0'
};

const resolveColorHex = (colorName) => {
    if (!colorName || typeof colorName !== 'string') return '#D4AF37';
    const c = colorName.trim();
    if (c.startsWith('#') || c.startsWith('rgb') || c.startsWith('hsl')) return c;
    return COLOR_MAP[c.toLowerCase()] || c;
};

const isRealValue = (v) =>
    typeof v === "string" && v.trim() !== "" && v.trim().toUpperCase() !== "N/A";

const normalize = (v) => (typeof v === "string" ? v.trim().toLowerCase() : v);

export default function ProductInfo({
    product,
    selectedColor: propColor,
    setSelectedColor: propSetColor,
    selectedSize: propSize,
    setSelectedSize: propSetSize,
    avgRating: propAvgRating,
    reviewCount: propReviewCount
}) {
    const { token } = useAuth();

    const [quantity, setQuantity] = useState(1);

    // NOTHING pre-selected on load. Base product price/stock shows until
    // the user actively picks a size. Do NOT default to the first size.
    const [internalSize, setInternalSize] = useState("");
    const [internalColor, setInternalColor] = useState(
        product.colors?.find(isRealValue) || (isRealValue(product.color) ? product.color : "")
    );

    const [isAdding, setIsAdding] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);
    const [cartQty, setCartQty] = useState(0);
    const [activeVariantId, setActiveVariantId] = useState(null);
    const [message, setMessage] = useState({ type: "", text: "" });

    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isWishlistLoading, setIsWishlistLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // IMPORTANT: if the parent (ProductContainer) passes its own
    // selectedSize/selectedColor state, that state must ALSO start as ""
    // — otherwise a pre-filled prop will override this component's own
    // empty default. Check ProductContainer.jsx if size still preselects.
    const selectedSize = propSize !== undefined ? propSize : internalSize;
    const setSelectedSize = propSetSize || setInternalSize;

    const selectedColor = propColor !== undefined ? propColor : internalColor;
    const setSelectedColor = propSetColor || setInternalColor;

    const { formatPrice, currency } = useCurrency();
    const router = useRouter();

    const reviewList = product.reviews || [];
    const totalReviewCount = propReviewCount !== undefined
        ? propReviewCount
        : (reviewList.length > 0 ? reviewList.length : (product.numReviews || 0));

    const displayRating = propAvgRating !== undefined
        ? propAvgRating
        : (reviewList.length > 0
            ? (reviewList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewList.length).toFixed(1)
            : (product.rating > 0 ? Number(product.rating).toFixed(1) : "0.0"));

    const numericRating = !isNaN(Number(displayRating)) ? Number(displayRating) : 0;

    /* --------------------------------------------------------------- */
    /* Color / Size option lists                                        */
    /* --------------------------------------------------------------- */

    const hasVariations = Array.isArray(product.variations) && product.variations.length > 0;
    const hasRawSizes = Array.isArray(product.rawSizes) && product.rawSizes.length > 0;

    const colorOptions = hasVariations
        ? [...new Set(product.variations.map(v => v.color).filter(isRealValue))]
        : (product.colors?.filter(isRealValue) || []);

    const sizeOptions = (() => {
        let options = [];
        if (hasVariations) {
            const filteredByColor = isRealValue(selectedColor)
                ? product.variations.filter(v => !v.color || normalize(v.color) === normalize(selectedColor))
                : product.variations;
            const szs = [...new Set(filteredByColor.map(v => v.size).filter(isRealValue))];
            options = szs.length > 0 ? szs : [...new Set(product.variations.map(v => v.size).filter(isRealValue))];
        } else if (hasRawSizes) {
            options = [...new Set(product.rawSizes.map(s => (typeof s === 'object' && s !== null ? s.size : s)).filter(isRealValue))];
        } else {
            options = (product.sizes?.filter(isRealValue) || []);
        }

        // Always add Standard Size if there's base stock, so users can buy the default product along with variations
        const baseStock = product.inventory ?? product.stock ?? product.quantity;
        const hasBaseStock = baseStock !== null && baseStock !== undefined && baseStock !== "";

        if (hasBaseStock && !options.some(s => s.toLowerCase() === "standard size" || s.toLowerCase() === "standard")) {
            // Add to beginning of the list
            options.unshift("Standard Size");
        }

        return options;
    })();

    /* --------------------------------------------------------------- */
    /* Variant / Size-entry resolution                                  */
    /* --------------------------------------------------------------- */

    const isSizeChosen = isRealValue(selectedSize);

    // Match variant from product.variations when size is chosen
    const activeVariant = (hasVariations && isSizeChosen)
        ? (product.variations.find(v =>
            normalize(v.size) === normalize(selectedSize) &&
            (!isRealValue(selectedColor) || !isRealValue(v.color) || normalize(v.color) === normalize(selectedColor))
        ) || product.variations.find(v => normalize(v.size) === normalize(selectedSize)) || null)
        : null;

    // Match raw size entry from product.rawSizes when size is chosen
    const activeSizeEntry = (hasRawSizes && isSizeChosen)
        ? (product.rawSizes.find(s => normalize(typeof s === 'object' && s !== null ? s.size : s) === normalize(selectedSize)) || null)
        : null;

    const variantKey = activeVariant
        ? (activeVariant.id || activeVariant._id || activeVariant.sku || `${activeVariant.size || ''}_${activeVariant.color || ''}`)
        : activeSizeEntry
            ? (activeSizeEntry.id || activeSizeEntry.size || selectedSize)
            : (selectedSize || "default");

    /* --------------------------------------------------------------- */
    /* Pricing — shows standard base product price initially;           */
    /* dynamically updates to size-specific price when size is chosen   */
    /* --------------------------------------------------------------- */

    const baseActualPrice = Number(product.actualPrice || product.regular_price || product.mrp || product.price || product.basePrice || 0);
    const baseSalePrice = (product.salePrice !== null && product.salePrice !== undefined)
        ? Number(product.salePrice)
        : (product.sale_price !== null && product.sale_price !== undefined ? Number(product.sale_price) : null);

    let effectiveActualPrice = baseActualPrice;
    let effectiveSalePrice = (baseSalePrice !== null && baseSalePrice > 0 && baseSalePrice < baseActualPrice) ? baseSalePrice : baseActualPrice;
    let maxStock = (product.inventory !== null && product.inventory !== undefined && !isNaN(Number(product.inventory))) ? Number(product.inventory) : null;
    let currentSku = product.sku || "";

    if (isSizeChosen) {
        if (activeVariant) {
            const vActual = activeVariant.actual_price ?? activeVariant.actualPrice ?? activeVariant.regular_price ?? activeVariant.mrp ?? null;
            const vSale = activeVariant.sale_price ?? activeVariant.salePrice ?? activeVariant.discount_price ?? null;
            const vPrice = (activeVariant.price !== undefined && activeVariant.price !== null && !isNaN(Number(activeVariant.price))) ? Number(activeVariant.price) : null;

            if (vSale !== null && Number(vSale) > 0) {
                effectiveSalePrice = Number(vSale);
                effectiveActualPrice = vActual !== null ? Number(vActual) : (vPrice && vPrice > effectiveSalePrice ? vPrice : (baseActualPrice > effectiveSalePrice ? baseActualPrice : effectiveSalePrice));
            } else if (vPrice !== null && vPrice > 0) {
                if (vActual !== null && Number(vActual) > vPrice) {
                    effectiveActualPrice = Number(vActual);
                    effectiveSalePrice = vPrice;
                } else if (baseActualPrice > vPrice) {
                    effectiveActualPrice = baseActualPrice;
                    effectiveSalePrice = vPrice;
                } else {
                    effectiveActualPrice = vPrice;
                    effectiveSalePrice = vPrice;
                }
            } else if (vActual !== null && Number(vActual) > 0) {
                effectiveActualPrice = Number(vActual);
                effectiveSalePrice = Number(vActual);
            }

            const vStock = activeVariant.inventory ?? activeVariant.stock ?? activeVariant.quantity ?? null;
            if (vStock !== null && vStock !== undefined && !isNaN(Number(vStock))) {
                maxStock = Number(vStock);
            }
            if (activeVariant.sku) currentSku = activeVariant.sku;
        } else if (activeSizeEntry && typeof activeSizeEntry === 'object') {
            const sActual = activeSizeEntry.actual_price ?? activeSizeEntry.actualPrice ?? activeSizeEntry.regular_price ?? activeSizeEntry.mrp ?? null;
            const sSale = activeSizeEntry.sale_price ?? activeSizeEntry.salePrice ?? activeSizeEntry.discount_price ?? null;
            const sPrice = (activeSizeEntry.price !== undefined && activeSizeEntry.price !== null && !isNaN(Number(activeSizeEntry.price))) ? Number(activeSizeEntry.price) : null;

            if (sSale !== null && Number(sSale) > 0) {
                effectiveSalePrice = Number(sSale);
                effectiveActualPrice = sActual !== null ? Number(sActual) : (sPrice && sPrice > effectiveSalePrice ? sPrice : (baseActualPrice > effectiveSalePrice ? baseActualPrice : effectiveSalePrice));
            } else if (sPrice !== null && sPrice > 0) {
                if (sActual !== null && Number(sActual) > sPrice) {
                    effectiveActualPrice = Number(sActual);
                    effectiveSalePrice = sPrice;
                } else if (baseActualPrice > sPrice) {
                    effectiveActualPrice = baseActualPrice;
                    effectiveSalePrice = sPrice;
                } else {
                    effectiveActualPrice = sPrice;
                    effectiveSalePrice = sPrice;
                }
            } else if (sActual !== null && Number(sActual) > 0) {
                effectiveActualPrice = Number(sActual);
                effectiveSalePrice = Number(sActual);
            }

            const sStock = activeSizeEntry.inventory ?? activeSizeEntry.stock ?? activeSizeEntry.quantity ?? null;
            if (sStock !== null && sStock !== undefined && !isNaN(Number(sStock))) {
                maxStock = Number(sStock);
            }
            if (activeSizeEntry.sku) currentSku = activeSizeEntry.sku;
        }
    }

    const hasDiscount = effectiveSalePrice < effectiveActualPrice && effectiveSalePrice > 0;
    const discountPercent = hasDiscount && effectiveActualPrice > 0
        ? Math.round(((effectiveActualPrice - effectiveSalePrice) / effectiveActualPrice) * 100)
        : 0;
    const savingsAmount = hasDiscount ? (effectiveActualPrice - effectiveSalePrice) : 0;
    const isOutOfStock = maxStock !== null && maxStock <= 0;

    // Debug logging
    useEffect(() => {
        console.log("SIZE DEBUG:", {
            selectedSize,
            selectedColor,
            hasVariations,
            hasRawSizes,
            matchedVariant: activeVariant,
            matchedSizeEntry: activeSizeEntry,
            finalMrp: effectiveActualPrice,
            finalSalePrice: effectiveSalePrice,
            finalMaxStock: maxStock
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSize, selectedColor, effectiveActualPrice, effectiveSalePrice, maxStock]);

    // Quantity controls
    const decrement = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
            setMessage({ type: "", text: "" });
        }
    };

    const increment = () => {
        if (isOutOfStock) {
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Selected item is currently out of stock.", type: "error" } }));
            return;
        }
        if (maxStock !== null && quantity >= maxStock) {
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: `Maximum stock limit reached! Only ${maxStock} unit${maxStock === 1 ? '' : 's'} available in stock.`, type: "error" } }));
            return;
        }
        setQuantity(prev => prev + 1);
    };

    // Check if product is already in cart on mount & listen for updates
    useEffect(() => {
        const checkCart = () => {
            const { quantity: qty, variantId } = getCartItemQuantity(product, variantKey);
            if (String(variantId) === String(variantKey) && qty > 0) {
                setCartQty(qty);
                setActiveVariantId(variantId);
            } else {
                setCartQty(0);
                setActiveVariantId(null);
            }
        };
        checkCart();
        window.addEventListener("cartUpdated", checkCart);
        return () => window.removeEventListener("cartUpdated", checkCart);
    }, [product, selectedColor, selectedSize, variantKey]);

    const handleColorChange = (newColor) => {
        setSelectedColor(newColor);
        setQuantity(1);
        setMessage({ type: "", text: "" });
    };

    const handleSizeChange = (newSize) => {
        setSelectedSize(newSize);
        setQuantity(1);
        setMessage({ type: "", text: "" });
    };

    const handleAddToCart = async () => {
        if (!token) {
            const chosenSize = isRealValue(selectedSize) ? selectedSize : (sizeOptions[0] || "Standard Size");
            const variantDetails = {
                size: chosenSize,
                color: isRealValue(selectedColor) ? selectedColor : "",
                price: effectiveActualPrice,
                salePrice: effectiveSalePrice,
                sku: currentSku
            };
            setPendingAction("ADD_TO_CART", product, quantity, variantKey, variantDetails);
            const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : `/product-details/${product.slug}`;
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Please login to add items to your cart.", type: "error" } }));
            setTimeout(() => router.push(`/login?redirect=${encodeURIComponent(currentPath)}`), 1000);
            return;
        }

        if (sizeOptions.length > 1 && !isRealValue(selectedSize)) {
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Please select a size first.", type: "error" } }));
            return;
        }
        if (isOutOfStock) {
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Selected size is currently out of stock.", type: "error" } }));
            return;
        }

        setIsAdding(true);

        try {
            const chosenSize = isRealValue(selectedSize) ? selectedSize : (sizeOptions[0] || "Standard Size");
            const variantDetails = {
                size: chosenSize,
                color: isRealValue(selectedColor) ? selectedColor : "",
                price: effectiveActualPrice,
                salePrice: effectiveSalePrice,
                sellingPrice: effectiveSalePrice,
                sku: currentSku
            };

            const result = await addToCart(product, quantity, variantKey, variantDetails);

            if (result.success) {
                setCartQty(prev => prev + quantity);
                setActiveVariantId(variantKey);
                window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: `${quantity} ${quantity === 1 ? 'item' : 'items'} added to your cart!`, type: "success" } }));
            } else {
                window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: result.message || "Failed to add to cart.", type: "error" } }));
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Something went wrong. Please try again.", type: "error" } }));
        } finally {
            setIsAdding(false);
        }
    };

    const handleBuyNow = async () => {
        if (!token) {
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Please login to proceed to checkout.", type: "error" } }));
            setTimeout(() => router.push('/login'), 1000);
            return;
        }

        if (sizeOptions.length > 1 && !isRealValue(selectedSize)) {
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Please select a size first.", type: "error" } }));
            return;
        }
        if (isOutOfStock) {
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Selected size is currently out of stock.", type: "error" } }));
            return;
        }

        setIsBuyingNow(true);
        try {
            const chosenSize = isRealValue(selectedSize) ? selectedSize : (sizeOptions[0] || "Standard Size");
            const variantDetails = {
                size: chosenSize,
                color: isRealValue(selectedColor) ? selectedColor : "",
                price: effectiveActualPrice,
                salePrice: effectiveSalePrice,
                sellingPrice: effectiveSalePrice,
                sku: currentSku
            };

            const result = await addToCart(product, quantity, variantKey, variantDetails);
            if (result.success) {
                router.push("/checkout");
            } else {
                window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: result.message || "Failed to proceed to checkout.", type: "error" } }));
            }
        } catch (err) {
            console.error("Error in Buy Now:", err);
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Could not proceed to checkout. Please try again.", type: "error" } }));
        } finally {
            setIsBuyingNow(false);
        }
    };

    const toggleWishlist = async (e) => {
        e.preventDefault();

        if (!token) {
            setPendingAction("ADD_TO_WISHLIST", product);
            const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : `/product-details/${product.slug}`;
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Please login to add items to your wishlist.", type: "error" } }));
            setTimeout(() => router.push(`/login?redirect=${encodeURIComponent(currentPath)}`), 1000);
            return;
        }

        setIsWishlistLoading(true);
        try {
            if (isWishlisted) {
                await apiClient.post("/api/auth/wishlist/remove", { productId: product._id || product.id });
                window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Removed from Wishlist", type: "success" } }));
            } else {
                await apiClient.post("/api/auth/wishlist/add", { productId: product._id || product.id });
                window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Saved to Wishlist!", type: "success" } }));
            }
            setIsWishlisted(!isWishlisted);
            window.dispatchEvent(new Event("wishlistUpdated"));
        } catch (err) {
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Please log in to use your wishlist.", type: "error" } }));
        } finally {
            setIsWishlistLoading(false);
        }
    };

    const handleShare = async (e) => {
        e.preventDefault();
        const shareData = {
            title: product.title,
            text: `Check out ${product.title} on Sri Divyam`,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: "Product link copied to clipboard!", type: "success" } }));
                setTimeout(() => setCopied(false), 2500);
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    // Slash-separated colour names shown just under the price (e.g. "CREAM / OLIVE / MAROON").
    const colorSubline = (colorOptions.length > 0 ? colorOptions : [product.color])
        .filter(isRealValue)
        .map((c) => c.trim().toUpperCase())
        .join(" / ");

    // Price shown as "INR 4000" style — currency code label + number, no ₹/$ glyph.
    const stripSymbol = (s) => String(s).replace(/[₹$]/g, "").trim();
    const salePriceText = stripSymbol(formatPrice(effectiveSalePrice, product.usdPrice));
    const actualPriceText = stripSymbol(formatPrice(effectiveActualPrice, product.usdPrice));

    return (
        <div className="h-full w-full flex flex-col items-start text-left">

            {/* 1. Category & Online Exclusive Badge */}
            {/* <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[#F3ECE4] text-[#8C5D36]">
                    <Sparkles size={12} className="text-[#C48834]" />
                    {product.type || "Divine Collection"}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-[#E6F4EA] text-[#135B42]">
                    Online Exclusive
                </span>
            </div> */}

            {/* 2. Product Title — Playfair Display, 500, 32px / 42px, 0 letter-spacing */}
            <h1 className="w-full font-playfair text-[32px] font-medium leading-[42px] tracking-normal text-[#241F1C] mb-2">
                {product.title}
            </h1>

            {/* 3. Online Exclusive label — GT Walsheim, 700, 12px / 15px, 3px tracking, uppercase */}
            <span className="font-gt-walsheim text-[12px] font-bold leading-[15px] tracking-[3px] uppercase text-[#9a938a] mb-3.5">
                Online Exclusive
            </span>

            {/* 4. Price & Discount Display — GT Walsheim, 300, 24px / 28px, 0 letter-spacing */}
            <div className="w-full mb-4">
                {/* Current price + discount badge */}
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-gt-walsheim">
                    <span className="text-[24px] font-light leading-[28px] tracking-normal text-[#1F1C1A]">
                        {currency}:
                    </span>
                    <span className="text-[24px] font-light leading-[28px] tracking-normal text-[#1F1C1A]">
                        {salePriceText}
                    </span>

                    {/* Discount Badge */}
                    {hasDiscount && discountPercent > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#135B42] text-white tracking-wide">
                            {discountPercent}% OFF
                        </span>
                    )}
                </div>

                {/* Original price (strikethrough) */}
                {hasDiscount && (
                    <p className="mt-2 text-[15px] text-[#6b6560]">
                        Original Price:{" "}
                        <span className="line-through">
                            {formatPrice(effectiveActualPrice, product.usdPrice)}
                        </span>
                    </p>
                )}

                {/* Tax note */}
                <p className="mt-1 text-[12px] font-medium uppercase tracking-wide text-[#8a827a]">
                    MRP (incl. of all taxes)
                </p>
            </div>

            {/* 4b. Colour-names sub-line */}
            {colorSubline && (
                <p className="w-full text-[11px] font-medium tracking-[0.06em] uppercase text-[#3f3a37] mb-4">
                    {colorSubline}
                </p>
            )}

            {/* Description — GT Walsheim, 300, 16px / 26px, 0 letter-spacing */}
            {product.description && (
                <p className="w-full font-gt-walsheim text-[16px] font-light leading-[26px] tracking-normal text-[#303030] mb-6">
                    {product.description}
                </p>
            )}

            {/* 5. Size Selection — hidden if only one (or zero) real size */}
            {sizeOptions.length > 1 && (
                <div className="w-full mb-5">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[13px] font-bold uppercase tracking-wide text-[#2A2421]">
                            Select Size{" "}
                            <span className="text-[#9a8f80]">
                                ({isRealValue(selectedSize) ? `Current: ${selectedSize}` : "Select a size"})
                            </span>
                        </span>
                        <button
                            type="button"
                            onClick={() => router.push("/contact")}
                            className="shrink-0 text-[12px] text-[#135B42] underline underline-offset-2 hover:text-[#0F4A36] cursor-pointer"
                        >
                            Find your size
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        {sizeOptions.map((size) => {
                            const isSelected = isRealValue(selectedSize) && normalize(selectedSize) === normalize(size);
                            return (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => handleSizeChange(size)}
                                    className={`h-11 min-w-[44px] px-3 flex items-center justify-center text-[13px] font-medium rounded border transition-colors duration-200 cursor-pointer ${isSelected
                                        ? "bg-[#135B42] text-white border-[#135B42]"
                                        : "bg-white text-[#303030] border-[#D8CFC2] hover:border-[#135B42] hover:bg-[#FDFBF7]"
                                        }`}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 6. Quantity Selector */}
            <div className="w-full mb-5">
                <span className="block text-[13px] font-bold text-[#2A2421] mb-2">
                    Quantity
                </span>
                <div className="flex h-10 w-[120px] items-center border border-[#D8CFC2] bg-white rounded overflow-hidden">
                    <button
                        type="button"
                        onClick={decrement}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="flex h-full w-[42px] items-center justify-center text-[#303030] hover:bg-[#F7F4EF] active:bg-[#EFEAE0] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-r border-[#E2DAD0]"
                        aria-label="Decrease quantity"
                    >
                        <Minus size={15} strokeWidth={2.5} />
                    </button>
                    <div className="flex flex-1 items-center justify-center text-[15px] font-bold text-[#1F1C1A]">
                        {quantity}
                    </div>
                    <button
                        type="button"
                        onClick={increment}
                        disabled={isOutOfStock}
                        className="flex h-full w-[42px] items-center justify-center text-[#303030] hover:bg-[#F7F4EF] active:bg-[#EFEAE0] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-l border-[#E2DAD0]"
                        aria-label="Increase quantity"
                    >
                        <Plus size={15} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* 7. Color Selection — hidden if only one (or zero) real color */}
            {colorOptions.length > 1 && (
                <div className="w-full mb-6">
                    <span className="block text-[13px] font-bold text-[#2A2421] mb-3">
                        Select Color
                    </span>
                    <div className="flex items-center gap-3.5 flex-wrap">
                        {colorOptions.map((color) => {
                            const isSelected = normalize(selectedColor) === normalize(color);
                            const hexColor = resolveColorHex(color);
                            return (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => handleColorChange(color)}
                                    aria-label={`Select color ${color}`}
                                    title={color}
                                    className={`relative group h-[34px] w-[34px] rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${isSelected
                                        ? "ring-2 ring-[#135B42] ring-offset-2 scale-110 shadow-sm"
                                        : "hover:scale-105 border border-gray-300"
                                        }`}
                                >
                                    <div
                                        className="h-full w-full rounded-full flex items-center justify-center border border-black/10 shadow-inner"
                                        style={{ backgroundColor: hexColor }}
                                    >
                                        {isSelected && (
                                            <Check size={14} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 8. Stock Urgency Status — plain text */}
            {(isOutOfStock || (maxStock !== null && maxStock <= 5)) && (
                <div className="mb-4">
                    {isOutOfStock ? (
                        <span className="text-[12px] font-bold text-red-700">
                            Currently Out of Stock
                        </span>
                    ) : (
                        <span className="text-[12px] font-bold text-[#B45309]">
                            Only {maxStock} left!
                        </span>
                    )}
                </div>
            )}

            {/* 9. Action Buttons */}
            <div className="w-full space-y-3">

                {/* Primary: Add to Cart / View Cart */}
                {cartQty > 0 ? (
                    <button
                        type="button"
                        onClick={() => router.push("/cart")}
                        className="w-full h-[52px] rounded bg-[#135B42] text-white font-semibold text-[13px] tracking-[0.12em] uppercase transition-colors duration-200 hover:bg-[#0F4A36] cursor-pointer flex items-center justify-center"
                    >
                        View Cart
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isAdding || isOutOfStock}
                        className={`w-full h-[52px] rounded font-semibold text-[13px] tracking-[0.12em] uppercase transition-colors duration-200 flex items-center justify-center gap-2 ${isOutOfStock
                            ? "bg-gray-400 text-white opacity-60 cursor-not-allowed"
                            : "bg-[#135B42] text-white hover:bg-[#0F4A36] cursor-pointer"
                            }`}
                    >
                        {isAdding ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Adding...</span>
                            </>
                        ) : isOutOfStock ? (
                            <span>Out of Stock</span>
                        ) : (
                            <span>Add to Cart</span>
                        )}
                    </button>
                )}

                {/* Secondary: Buy Now (outline) — proceeds straight to checkout */}
                {!isOutOfStock && (
                    <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={isBuyingNow}
                        className="w-full h-[52px] rounded border border-[#135B42] bg-white text-[#135B42] font-semibold text-[13px] tracking-[0.12em] uppercase transition-colors duration-200 hover:bg-[#135B42] hover:text-white cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {isBuyingNow ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <span>Buy Now</span>
                        )}
                    </button>
                )}
            </div>

            {/* 9d. Wishlist · Share */}
            <div className="w-full flex items-center justify-center gap-8 text-[12px] font-medium mt-4">
                <button
                    type="button"
                    onClick={toggleWishlist}
                    disabled={isWishlistLoading}
                    className={`flex items-center gap-1.5 transition-colors duration-200 cursor-pointer ${isWishlisted ? "text-[#E11D48]" : "text-gray-500 hover:text-[#135B42]"}`}
                >
                    <Heart size={15} className={isWishlisted ? "fill-[#E11D48] text-[#E11D48]" : ""} />
                    <span>{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span>
                </button>
                <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-[#135B42] transition-colors duration-200 cursor-pointer"
                >
                    {copied ? (
                        <>
                            <Check size={15} className="text-emerald-600" />
                            <span className="text-emerald-600">Link Copied</span>
                        </>
                    ) : (
                        <>
                            <Share2 size={15} />
                            <span>Share</span>
                        </>
                    )}
                </button>
            </div>


            {/* 10. Sacred Divine Value & Trust Badges */}
            {/* <div className="w-full bg-[#FFFDF9] rounded-md border border-[#EFE8DC] p-4 sm:p-5 mt-2">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#8A633B] mb-3.5 flex items-center gap-1.5">
                    <Award size={14} className="text-[#C48834]" />
                    Sri Divyam Devotional Guarantee
                </h4>
                <div className="grid grid-cols-2 gap-3.5 text-left">
                    <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[#F3EDE3] text-[#135B42] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sparkles size={14} />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-[#303030]">100% Handcrafted</p>
                            <p className="text-[10px] text-gray-500">Pure devotional craftsmanship</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[#F3EDE3] text-[#135B42] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Truck size={14} />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-[#303030]">Express Delivery</p>
                            <p className="text-[10px] text-gray-500">Fast & secure door delivery</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[#F3EDE3] text-[#135B42] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ShieldCheck size={14} />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-[#303030]">Secure Checkout</p>
                            <p className="text-[10px] text-gray-500">Razorpay & SSL encrypted</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[#F3EDE3] text-[#135B42] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <RefreshCcw size={14} />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-[#303030]">Easy Exchange</p>
                            <p className="text-[10px] text-gray-500">7-day hassle-free assistance</p>
                        </div>
                    </div>
                </div>
            </div> */}

        </div>
    );
}