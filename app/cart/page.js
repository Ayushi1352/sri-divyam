"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";
import { Loader2, ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ShieldCheck, Truck, AlertCircle, RefreshCw, Award, Heart, RefreshCcw, ArrowRight } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { updateCartItemQuantity, removeCartItem, resolveItemPricing, isItemRemoved, getRemovedItems, CART_QUANTITIES_KEY, REMOVED_ITEMS_KEY } from "../utils/cartUtils";
import { products as staticProducts } from "../data/products";
import { useAuth } from "../context/AuthContext";

// Generate a stable key for a cart item - use ID_VARIANT for strict grouping
const getItemKey = (item) => {
    if (!item) return "unknown";
    const productId = String(item.product_id || item.productId || item.product?._id || item.id || "");
    const variantId = String(item.variant_id || item.variation_id || item.variation?.id || item.variant?.id || item.variant || item.size || item.variantDetails?.size || "");

    if (productId) return `${productId}_${variantId}`;

    const slug = item.slug || item.product_slug || item.product?.slug;
    if (slug && typeof slug === 'string') return `${slug}_${variantId}`;

    return `unknown_${variantId}`;
};

// Resolve the display ID of a cart item (same chain as rendering uses)
const resolveItemId = (item) => {
    if (!item) return null;

    // Check for explicit cart row identifiers (must be different from product_id if possible)
    const rowId = item.cart_item_id || item.row_id || item.cart_id;
    if (rowId) return rowId;

    // If we only have product ID or MongoDB _id which might be ambiguous, 
    // we MUST incorporate variant data to ensure uniqueness in the UI.
    return getItemKey(item);
};

const addRemovedItem = (cartItem) => {
    try {
        const removed = getRemovedItems();
        const prodObj = cartItem.product && typeof cartItem.product === 'object' ? cartItem.product : {};
        const pIds = [
            cartItem.product_id,
            cartItem.productId,
            cartItem.id,
            cartItem._id,
            cartItem.cart_item_id,
            cartItem.row_id,
            cartItem.cart_id,
            prodObj._id,
            prodObj.id,
            cartItem.slug,
            prodObj.slug
        ].filter(Boolean).map(String);

        const vId = String(cartItem.variant_id || cartItem.variation_id || cartItem.variant || "");
        const size = String(cartItem.size || cartItem.variantDetails?.size || "");

        pIds.forEach(pId => {
            if (!removed.some(r => r.pId === pId && String(r.vId) === vId && String(r.size || '') === size)) {
                removed.push({ pId, vId, size, time: Date.now() });
            }
        });
        localStorage.setItem(REMOVED_ITEMS_KEY, JSON.stringify(removed));
    } catch (e) { console.error("Failed to save removed item:", e); }
};

const clearRemovedItem = (productId) => {
    try {
        const pId = String(productId);
        const removed = getRemovedItems();
        const filtered = removed.filter(r => String(r.pId) !== pId);
        localStorage.setItem(REMOVED_ITEMS_KEY, JSON.stringify(filtered));
    } catch (e) { }
};

const filterRemovedItems = (items) => {
    return items.filter(item => !isItemRemoved(item));
};

const getSavedQuantities = () => {
    try {
        const stored = localStorage.getItem(CART_QUANTITIES_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) { return {}; }
};

export default function MyBagPage() {
    const router = useRouter();
    const { formatPrice } = useCurrency();
    const { token, loading: authLoading } = useAuth();

    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutStatus, setCheckoutStatus] = useState({ type: "", message: "" });
    const [storeSettings, setStoreSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`);
                const data = await response.json();
                if (response.ok) {
                    // API returns { data: { domestic: {...}, international: {...} } }
                    const raw = data.data || data;
                    const currency = localStorage.getItem("currency") || "INR";
                    const regional = currency === "USD" ? (raw.international || raw) : (raw.domestic || raw);
                    setStoreSettings(regional);
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            }
        };
        fetchSettings();
    }, [authLoading, token, router]);

    const fetchCart = async () => {
        const token = localStorage.getItem("token");
        const GUEST_CART_KEY = "shri_divyam_guest_cart";

        if (!token) {
            // --- LOAD GUEST CART ---
            try {
                const guestCartStr = localStorage.getItem(GUEST_CART_KEY);
                let parsedItems = guestCartStr ? JSON.parse(guestCartStr) : [];
                const savedQty = getSavedQuantities();

                const itemsWithCorrectQty = parsedItems.map(item => {
                    const prodObj = item.product && typeof item.product === 'object' ? item.product : {};
                    const pId = String(item.productId || item.product_id || prodObj._id || prodObj.id || item.id || item._id || '');
                    const pricing = resolveItemPricing(item);
                    const qty = Math.max(1, Number(item.quantity) || 1);

                    let enriched = {
                        ...item,
                        product_id: pId,
                        productId: pId,
                        id: item._id || item.cart_item_id || item.row_id || item.id || pId,
                        cartItemId: item._id || item.cart_item_id,
                        quantity: qty,
                        product_name: item.product_name || item.title || item.name || prodObj.title || prodObj.name || "Divine Product",
                        title: item.title || item.name || item.product_name || prodObj.title || prodObj.name || "Divine Product",
                        name: item.name || item.title || item.product_name || prodObj.name || prodObj.title || "Divine Product",
                        image_path: item.image_path || item.image || prodObj.mainImage || prodObj.image_path || prodObj.image || "/logo.png",
                        image: item.image || item.image_path || prodObj.mainImage || prodObj.image_path || prodObj.image || "/logo.png",
                        price: pricing.actualPrice,
                        sale_price: pricing.salePrice,
                        selling_price: pricing.salePrice,
                        actual_price: pricing.actualPrice,
                        slug: item.slug || prodObj.slug || ""
                    };

                    if (staticProducts && staticProducts.length > 0 && pId) {
                        const found = staticProducts.find(p => String(p.id) === pId || String(p._id) === pId);
                        if (found) {
                            enriched.product_name = enriched.product_name || found.title || found.name;
                            enriched.image_path = enriched.image_path || found.image;
                            enriched.slug = enriched.slug || found.slug;
                        }
                    }
                    return enriched;
                });

                setCartItems(itemsWithCorrectQty);
                if (itemsWithCorrectQty.length > 0) {
                    enrichItems(itemsWithCorrectQty);
                }
                setIsLoading(false);
            } catch (e) {
                console.error("Guest cart load error:", e);
                setIsLoading(false);
            }
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                cache: "no-store"
            });

            const text = await response.text();
            let data = {};

            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error("Cart fetch parse error:", text);
                    setError("Failed to load cart data.");
                    setIsLoading(false);
                    return;
                }
            }

            if (response.ok) {
                // Handle different API response structures
                const rawItems = data.cart_items || data.cart || data.items || data.data || [];
                let parsedItems = [];

                if (Array.isArray(rawItems)) {
                    parsedItems = rawItems;
                } else if (rawItems && typeof rawItems === 'object') {
                    // Support transformed response from proxy (_original_items)
                    parsedItems = rawItems._original_items || (Array.isArray(rawItems.items) ? rawItems.items : []);
                }

                // ★ Filter out locally removed items so they don't reappear on refresh
                const filteredItems = filterRemovedItems(parsedItems);

                // --- AGGRESSIVE AUTO-CLEANUP START ---
                // If there are items on the server that we have removed locally, try to delete them from server again
                const ghostItems = parsedItems.filter(item => isItemRemoved(item));
                if (ghostItems.length > 0) {
                    console.log(`🧹 Auto-Cleanup: Found ${ghostItems.length} ghost items on server. Attempting removal...`);

                    const token = localStorage.getItem("token");
                    let userId = "";
                    try {
                        const userStr = localStorage.getItem("user");
                        if (userStr) {
                            const userData = JSON.parse(userStr);
                            userId = userData.id || userData.user_id || userData.userid || "";
                        }
                    } catch (e) { }
                    if (!userId) userId = "1";

                    ghostItems.forEach(async (item) => {
                        const itemId = item.id || item.cart_item_id || item.row_id || item.cart_id;
                        const pId = item.product_id || item.id;
                        const targetId = itemId || pId;
                        if (!targetId || targetId === "undefined") return;

                        try {
                            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/${targetId}`, {
                                method: "DELETE",
                                headers: {
                                    "Accept": "application/json",
                                    "Authorization": `Bearer ${token}`
                                }
                            });
                        } catch (e) { }
                    });
                }
                // --- AGGRESSIVE AUTO-CLEANUP END ---

                // ★ PRE-GROUPING ENRICHMENT
                // Extract per-size pricing and metadata
                const preEnrichedItems = filteredItems.map(item => {
                    const prodObj = item.product && typeof item.product === 'object' ? item.product : {};
                    const pId = String(item.productId || item.product_id || prodObj._id || prodObj.id || item.id || item._id || '');
                    const pricing = resolveItemPricing(item);
                    const qty = Math.max(1, Number(item.quantity) || 1);

                    let enriched = {
                        ...item,
                        product_id: pId,
                        productId: pId,
                        quantity: qty,
                        product_name: item.product_name || item.title || item.name || prodObj.title || prodObj.name || "Divine Product",
                        title: item.title || item.name || item.product_name || prodObj.title || prodObj.name || "Divine Product",
                        name: item.name || item.title || item.product_name || prodObj.name || prodObj.title || "Divine Product",
                        image_path: item.image_path || item.image || prodObj.mainImage || prodObj.image_path || prodObj.image || "/logo.png",
                        image: item.image || item.image_path || prodObj.mainImage || prodObj.image_path || prodObj.image || "/logo.png",
                        price: pricing.actualPrice,
                        sale_price: pricing.salePrice,
                        selling_price: pricing.salePrice,
                        actual_price: pricing.actualPrice,
                        slug: item.slug || prodObj.slug || ""
                    };

                    if (staticProducts && staticProducts.length > 0 && pId) {
                        const found = staticProducts.find(p => String(p.id) === pId || String(p._id) === pId);
                        if (found) {
                            enriched.slug = enriched.slug || found.slug;
                            enriched.product_name = enriched.product_name || found.title || found.name;
                            enriched.image_path = enriched.image_path || found.image;
                        }
                    }
                    return enriched;
                });

                // ★ OVERRIDE & GROUPING LOGIC
                // Group by exactKey (product_id + variant/size) so separate sizes appear as distinct cart rows
                const groupedMap = new Map();

                preEnrichedItems.forEach(item => {
                    const pId = String(item.product_id || item.productId || item.product?._id || item.id || '');
                    if (!pId) return;

                    const exactKey = getItemKey(item);
                    const itemQty = Math.max(1, Number(item.quantity) || 1);

                    if (groupedMap.has(exactKey)) {
                        const existing = groupedMap.get(exactKey);
                        groupedMap.set(exactKey, { ...item, quantity: Math.max(existing.quantity, itemQty) });
                    } else {
                        groupedMap.set(exactKey, { ...item, quantity: itemQty });
                    }
                });

                const itemsWithCorrectQty = Array.from(groupedMap.values());
                setCartItems(itemsWithCorrectQty);

                setError("");

                // --- PRODUCT ENRICHMENT START ---
                const itemsToEnrich = filteredItems.filter(it => !it.product_name && !it.name && !it.image_path && !it.image);
                if (itemsToEnrich.length > 0) {
                    enrichItems(filteredItems);
                } else {
                    // Even if no enrichment needed, still fetch variant stocks for stock validation
                    fetchVariantStocks();
                }
                // --- PRODUCT ENRICHMENT END ---
            } else {
                setError(data.message || "Failed to fetch cart.");
            }
        } catch (err) {
            console.error("Cart fetch error:", err);
            setError("Network error. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckout = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        if (cartItems.length === 0) return;

        // Redirect to the checkout page where address selection happens
        router.push("/checkout");
    };

    // enrichment helper to fill in missing product data from all major categories
    const enrichItems = async (items) => {
        try {
            // First, enrich from staticProducts
            if (staticProducts && staticProducts.length > 0) {
                setCartItems(prev => prev.map(item => {
                    const pId = item.product_id || item.id;
                    const found = staticProducts.find(p => String(p.id) === String(pId));

                    if (found) {
                        return {
                            ...item,
                            product_name: item.product_name || item.name || found.title || found.name,
                            image_path: item.image_path || item.image || found.image_path || found.image,
                            slug: item.slug || found.slug,
                            price: item.price || found.price,
                            product: item.product || found,
                            stock: item.stock !== undefined ? item.stock : (found.stock !== undefined ? found.stock : null)
                        };
                    }
                    return item;
                }));
            }

            // ★ PHASE 1.5: Fetch dynamic API products for items that are STILL missing names/images
            setCartItems(prev => {
                const stillMissing = prev.filter(it => !it.product_name && !it.name && !it.slug);
                if (stillMissing.length > 0) {
                    // Try to fetch all products to enrich dynamic ones
                    Promise.all([
                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`).then(r => r.ok ? r.json() : null).catch(() => null),
                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/premium/products`).then(r => r.ok ? r.json() : null).catch(() => null)
                    ]).then(([allProds, premiumProds]) => {
                        let pool = [];
                        if (allProds && allProds.data) pool = [...pool, ...allProds.data];
                        else if (allProds && allProds.products) pool = [...pool, ...allProds.products];
                        else if (Array.isArray(allProds)) pool = [...pool, ...allProds];

                        if (premiumProds && premiumProds.data) pool = [...pool, ...premiumProds.data];
                        else if (premiumProds && premiumProds.products) pool = [...pool, ...premiumProds.products];
                        else if (Array.isArray(premiumProds)) pool = [...pool, ...premiumProds];

                        if (pool.length > 0) {
                            setCartItems(currentItems => currentItems.map(item => {
                                if (item.product_name || item.name) return item; // Already enriched
                                const pId = item.product_id || item.id;
                                const foundApi = pool.find(p => String(p.id) === String(pId));
                                if (foundApi) {
                                    return {
                                        ...item,
                                        product_name: item.product_name || item.name || foundApi.name || foundApi.title,
                                        image_path: item.image_path || item.image || foundApi.image_path || foundApi.image,
                                        slug: item.slug || foundApi.slug,
                                        price: item.price || foundApi.price,
                                        product: item.product || foundApi,
                                        stock: item.stock !== undefined ? item.stock : (foundApi.stock !== undefined ? foundApi.stock : null)
                                    };
                                }
                                return item;
                            }));
                        }
                        fetchVariantStocks();
                    }).catch(e => { console.error(e); fetchVariantStocks(); });

                    return prev; // Return immediately, background fetch will update later
                } else {
                    // ★ PHASE 2: Fetch individual product details for accurate per-variant stock
                    fetchVariantStocks();
                    return prev;
                }
            });
        } catch (e) {
            console.error("Enrichment error:", e);
        }
    };

    // Fetch detailed product data (with variant-level stock) for every cart item
    const fetchVariantStocks = async () => {
        try {
            setCartItems(prev => {
                // Collect slugs/product_ids to fetch
                const itemsToFetch = prev.filter(item => {
                    const slug = item.slug || item.product?.slug;
                    return slug && !item._stockFetched;
                });

                if (itemsToFetch.length === 0) return prev;

                // Fire off fetches in background
                const slugs = [...new Set(itemsToFetch.map(it => it.slug || it.product?.slug).filter(Boolean))];

                Promise.all(
                    slugs.map(slug =>
                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${slug}`)
                            .then(res => res.ok ? res.json() : null)
                            .catch(() => null)
                    )
                ).then(results => {
                    const productMap = {};
                    results.forEach(data => {
                        if (data?.product) {
                            const p = data.product;
                            if (p.variants && !p.variations) p.variations = p.variants;
                            productMap[p.slug] = p;
                            if (p.id) productMap[`id_${p.id}`] = p;
                        }
                    });

                    if (Object.keys(productMap).length > 0) {
                        setCartItems(current => current.map(item => {
                            const slug = item.slug || item.product?.slug;
                            const detailedProduct = productMap[slug] || productMap[`id_${item.product_id}`];

                            if (detailedProduct) {
                                // Find matching variation for this cart item
                                const vId = item.variant_id || item.variation_id;
                                let matchedVariation = null;
                                if (vId && detailedProduct.variations) {
                                    matchedVariation = detailedProduct.variations.find(v => String(v.id) === String(vId));
                                }
                                // If no variant match, use first variation as fallback
                                if (!matchedVariation && detailedProduct.variations?.length > 0) {
                                    matchedVariation = detailedProduct.variations[0];
                                }

                                const variantStock = matchedVariation?.stock !== undefined ? Number(matchedVariation.stock) : null;
                                const productStock = detailedProduct.stock !== undefined ? Number(detailedProduct.stock) : null;

                                // Auto-correct quantity if it exceeds max stock (Fixes exponential bug)
                                let currentQty = Number(item.quantity) || 1;
                                let maxStock = Infinity;
                                if (variantStock !== null) maxStock = variantStock;
                                else if (productStock !== null) maxStock = productStock;
                                else if (item.stock !== undefined) maxStock = Number(item.stock);

                                if (maxStock !== Infinity && currentQty > maxStock) {
                                    // Auto-cap the quantity to maxStock to heal the user's cart
                                    currentQty = maxStock > 0 ? maxStock : 1;

                                    // Persist the fixed quantity to localStorage
                                    try {
                                        const quantities = getSavedQuantities();
                                        quantities[getItemKey(item)] = currentQty;
                                        localStorage.setItem(CART_QUANTITIES_KEY, JSON.stringify(quantities));
                                    } catch (e) { }
                                }

                                return {
                                    ...item,
                                    quantity: currentQty,
                                    product: detailedProduct,
                                    _matchedVariation: matchedVariation,
                                    _stockFetched: true,
                                    _variantStock: variantStock,
                                    _productStock: productStock
                                };
                            }
                            return { ...item, _stockFetched: true };
                        }));
                    }
                });

                return prev;
            });
        } catch (e) {
            console.error("Variant stock fetch error:", e);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const handleClearBag = async () => {
        if (!confirm("Are you sure you want to clear your entire bag?")) return;

        const token = localStorage.getItem("token");

        // 1. Clear Local Storage
        localStorage.removeItem("shri_divyam_cart_quantities");
        localStorage.removeItem("shri_divyam_removed_cart_items");
        localStorage.removeItem("shri_divyam_removed_items");
        localStorage.removeItem("shri_divyam_guest_cart");

        // 2. Optimistic UI State
        const itemsToRemove = [...cartItems];
        setCartItems([]);
        window.dispatchEvent(new Event("cartUpdated"));

        // 3. If logged in, try to remove items from server too
        if (token) {
            setCheckoutStatus({ type: "success", message: "Hard-resetting your cart..." });

            // Call delete for each item to sync server
            try {
                await Promise.all(itemsToRemove.map(async (item) => {
                    const itemId = item.id || item.cart_item_id || item.row_id || item.cart_id;
                    const pId = item.product_id || item.id;
                    const vId = item.variant_id || item.variation_id || "";

                    const strategies = [
                        () => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                            body: JSON.stringify({ cart_item_id: itemId, product_id: pId, variant_id: vId, user_id: "1" })
                        }),
                        () => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/${itemId}`, {
                            method: "DELETE",
                            headers: { "Authorization": `Bearer ${token}` }
                        }),
                        () => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove/${itemId}`, {
                            method: "DELETE",
                            headers: { "Authorization": `Bearer ${token}` }
                        })
                    ];

                    for (const strategy of strategies) {
                        try {
                            const res = await strategy();
                            if (res.ok) break;
                        } catch (e) { }
                    }
                }));
            } catch (e) { console.error("Server clear error:", e); }

            setCheckoutStatus({ type: "success", message: "Bag cleared successfully." });
            setTimeout(() => {
                setCheckoutStatus({ type: "", message: "" });
            }, 1500);
        } else {
            setCheckoutStatus({ type: "success", message: "Bag cleared successfully." });
            setTimeout(() => {
                setCheckoutStatus({ type: "", message: "" });
            }, 1500);
        }
    };

    const handleRemoveItem = async (cartItemId) => {
        // Find the target item BEFORE removing — use the same ID resolution as everywhere else
        const targetItem = cartItems.find((ci, idx) => {
            const id = resolveItemId(ci) || `index-${idx}`;
            return id == cartItemId;
        });

        if (!targetItem) return;

        // 1. Instant UI removal
        setCartItems(prev => prev.filter((it, idx) => {
            const id = resolveItemId(it) || `index-${idx}`;
            return id != cartItemId;
        }));

        // 2. Record in removed items tracking to prevent resurrection on refresh
        addRemovedItem(targetItem);

        // 3. Clear local quantities immediately
        try {
            const quantities = getSavedQuantities();
            delete quantities[getItemKey(targetItem)];
            localStorage.setItem(CART_QUANTITIES_KEY, JSON.stringify(quantities));
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (e) { }

        // 4. Delegate to cartUtils for backend and localStorage synchronization
        const variantId = targetItem.variant_id || targetItem.variation_id || "";
        await removeCartItem(targetItem, variantId);
    };

    const debounceTimersRef = useRef({});

    const handleUpdateQuantity = (cartItemId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveItem(cartItemId);
            return;
        }

        // Use the exact same ID resolution the rendered +/- buttons use
        const foundItem = cartItems.find((ci, idx) => {
            const id = resolveItemId(ci) || `index-${idx}`;
            return id == cartItemId;
        });

        if (!foundItem) return;

        const targetQuantity = Number(newQuantity);
        const maxStock = getMaxStock(foundItem);
        const currentQuantity = Number(foundItem.quantity) || 1;

        if (maxStock !== Infinity && targetQuantity > maxStock && targetQuantity > currentQuantity) {
            window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: `Maximum stock limit reached! Only ${maxStock} units of this product are available.`, type: "error" } }));
            return;
        }

        // 1. Instant Optimistic UI Update (0ms delay for ultra snappy experience)
        setCartItems(prev => prev.map((it, index) => {
            const currentItemId = resolveItemId(it) || `index-${index}`;
            if (currentItemId == cartItemId) return { ...it, quantity: targetQuantity };
            return it;
        }));

        // 2. Persist the new quantity locally right away
        try {
            const quantities = getSavedQuantities();
            quantities[getItemKey(foundItem)] = targetQuantity;
            localStorage.setItem(CART_QUANTITIES_KEY, JSON.stringify(quantities));
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (e) { }

        // 3. Debounce the backend API sync (450ms)
        if (debounceTimersRef.current[cartItemId]) {
            clearTimeout(debounceTimersRef.current[cartItemId]);
        }

        debounceTimersRef.current[cartItemId] = setTimeout(async () => {
            try {
                const variantId = foundItem.variant_id || foundItem.variation_id || "";
                await updateCartItemQuantity(foundItem, targetQuantity, variantId);
            } catch (err) {
                console.error("Debounced cart quantity update error:", err);
            } finally {
                delete debounceTimersRef.current[cartItemId];
            }
        }, 450);
    };

    // Get product image URL - Universal Resolver version
    const getImageUrl = (item) => {
        if (!item) return null;

        // Strategy 1: Known keys at various depths
        const knownKeys = ['mainImage', 'image_path', 'image', 'product_image', 'thumbnail', 'product_details_image', 'img', 'pic'];

        const findImg = (obj) => {
            if (!obj || typeof obj !== 'object') return null;
            for (const key of knownKeys) {
                if (obj[key] && typeof obj[key] === 'string' && obj[key] !== "null") return obj[key];
            }
            // Check deeper nested paths common in CRM APIs
            let found = obj.product?.mainImage ||
                obj.product?.image_path ||
                obj.product?.image ||
                obj.product_details?.image_path ||
                obj.variation?.product?.image_path ||
                obj.variation?.image_path ||
                obj.variant?.product?.image_path ||
                obj.variant?.image_path ||
                obj.variation?.image ||
                obj.detail?.image_path ||
                null;

            if (!found) {
                if (Array.isArray(obj.images) && obj.images.length > 0) return obj.images[0];
                if (Array.isArray(obj.product?.images) && obj.product.images.length > 0) return obj.product.images[0];
            }
            return found;
        };

        let img = findImg(item);

        // Strategy 2: Scan for any key containing 'image' or 'path' or 'thumb'
        if (!img) {
            const allKeys = Object.keys(item);
            const foundKey = allKeys.find(k => (k.includes('image') || k.includes('path') || k.includes('thumb')) && item[k] && typeof item[k] === 'string' && item[k] !== "null");
            if (foundKey) img = item[foundKey];
        }

        if (!img) return null;

        // Handle full URLs
        if (typeof img === 'string' && (img.startsWith("http") || img.startsWith("//") || img.startsWith("data:"))) {
            return img;
        }

        // Handle relative paths
        let cleanImg = typeof img === 'string' ? img : (img?.image || img?.image_path || '');
        if (!cleanImg || cleanImg === "null") return null;

        // Handle absolute paths to local assets like /logo.png
        if (cleanImg === '/logo.png' || cleanImg === 'logo.png') {
            return '/logo.png';
        }

        // Strip leading slash if present
        if (cleanImg.startsWith('/')) {
            cleanImg = cleanImg.slice(1);
        }

        // If the path already includes 'uploads/', avoid duplicating it
        if (cleanImg.startsWith('uploads/')) {
            return `${process.env.NEXT_PUBLIC_API_URL}/` + cleanImg;
        }

        // If it starts with storage, it's likely a different base
        if (cleanImg.startsWith('storage/')) {
            return `${process.env.NEXT_PUBLIC_API_URL}/` + cleanImg;
        }

        const IMAGE_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/uploads/`;
        return IMAGE_BASE_URL + cleanImg;
    };

    // Get product name - Universal Resolver version
    const getProductName = (item) => {
        if (!item) return "Premium Product";

        // Strategy 1: Known keys
        const knownKeys = ['product_name', 'name', 'title', 'item_name', 'product_title'];
        const findName = (obj) => {
            if (!obj || typeof obj !== 'object') return null;
            for (const key of knownKeys) {
                if (obj[key] && typeof obj[key] === 'string') return obj[key];
            }
            return obj.product?.name ||
                obj.product_details?.name ||
                obj.variation?.product?.name ||
                obj.variant?.product?.name ||
                obj.variation?.name ||
                obj.variant?.name ||
                obj.product_details?.product_name ||
                obj.detail?.product_name ||
                null;
        };

        let name = findName(item);

        // Strategy 2: Search for 'name' or 'title' in any key
        if (!name) {
            const allKeys = Object.keys(item);
            const foundKey = allKeys.find(k => (k.includes('name') || k.includes('title')) && item[k] && typeof item[k] === 'string');
            if (foundKey) name = item[foundKey];
        }

        // Strategy 3: Slug Fallback
        if (!name) {
            const slug = item.slug || item.product_slug || item.product?.slug;
            if (slug && typeof slug === 'string') {
                return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            }
        }

        // Strategy 4: Product ID Fallback
        if (!name) {
            const pId = item.product_id || item.id;
            if (pId) {
                return `Product #${pId}`;
            }
        }

        return name || "Premium Product";
    };

    // Get item price formatted for display
    const getItemPrice = (item) => {
        const rawSale = getRawPrice(item);
        let usdPrice = item.usd_price || item.product?.usd_price || item.variant?.usd_price || 0;
        if (typeof usdPrice === 'string') usdPrice = usdPrice.replace(/[^\d.]/g, '');

        return formatPrice(Number(rawSale), Number(usdPrice));
    };

    // Get raw effective sale price (always returns number in INR for charged calculation)
    const getRawPrice = (item) => {
        if (!item) return 0;
        return resolveItemPricing(item).salePrice;
    };

    // Get raw actual/MRP price (original price before discount)
    const getRawActualPrice = (item) => {
        if (!item) return 0;
        return resolveItemPricing(item).actualPrice;
    };

    // Get max stock for an item
    const getMaxStock = (item) => {
        if (!item) return Infinity;

        let stockVal = null;

        // ★ Priority 0: Check enriched variant stock (most accurate)
        if (item._variantStock !== undefined && item._variantStock !== null) {
            return Number(item._variantStock);
        }

        const vId = item.variant_id || item.variation_id || item.variation?.id || item.variant?.id;
        const product = item.product || item.product_details;

        // 1. Check direct variants/variations from enriched product data
        if (product) {
            if (vId) {
                const vars = product.variations || product.variants;
                if (Array.isArray(vars)) {
                    const targetVar = vars.find(v => String(v.id) === String(vId));
                    if (targetVar && targetVar.stock !== undefined && targetVar.stock !== null) stockVal = targetVar.stock;
                }
            }

            if (stockVal === null) {
                const size = String(item.size || item.variantDetails?.size || item.variant_details?.size || item.variant?.size || item.variation?.size || item.product_details?.size || "").trim();
                const allSizes = [...(Array.isArray(product.sizes) ? product.sizes : []), ...(Array.isArray(product.rawSizes) ? product.rawSizes : [])];
                if (allSizes.length > 0 && size) {
                    const sizeEntry = allSizes.find(s => typeof s === 'object' && s !== null && s.size && s.size.trim().toLowerCase() === size.toLowerCase());
                    if (sizeEntry) {
                        const sStock = sizeEntry.inventory ?? sizeEntry.stock ?? sizeEntry.quantity ?? null;
                        if (sStock !== null) stockVal = sStock;
                    }
                }
            }
        }

        // 2. Check matched variation from enrichment
        if (stockVal === null && item._matchedVariation) {
            if (item._matchedVariation.stock !== undefined && item._matchedVariation.stock !== null) {
                stockVal = item._matchedVariation.stock;
            }
        }

        // 3. Check variation object stock
        if (stockVal === null) {
            const variation = item.variation || item.variant || item.variant_details;
            if (variation && variation.stock !== undefined && variation.stock !== null) stockVal = variation.stock;
        }

        // 4. Check direct item stock
        if (stockVal === null && item.inventory !== undefined && item.inventory !== null) stockVal = item.inventory;
        if (stockVal === null && item.stock !== undefined && item.stock !== null) stockVal = item.stock;

        // 5. Check enriched product-level stock
        if (stockVal === null && item._productStock !== undefined && item._productStock !== null) stockVal = item._productStock;

        // 6. Check product level stock
        if (stockVal === null && product) {
            if (product.inventory !== undefined && product.inventory !== null) stockVal = product.inventory;
            else if (product.stock !== undefined && product.stock !== null) stockVal = product.stock;
        }

        // Fallback for "Standard Size" if its specific stock is empty or 0
        const sizeStr = String(item.size || item.variantDetails?.size || item.variant_details?.size || item.variant?.size || item.variation?.size || item.product_details?.size || "").trim().toLowerCase();
        if (sizeStr.includes("standard") && (stockVal === null || Number(stockVal) <= 0)) {
            if (product) {
                const baseStock = product.inventory ?? product.stock ?? product.quantity;
                if (baseStock !== null && baseStock !== undefined && !isNaN(Number(baseStock))) {
                    stockVal = baseStock;
                }
            }
        }

        return stockVal !== null ? Number(stockVal) : Infinity;
    };

    // Calculate totals
    const totalItems = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const subtotalPrice = cartItems.reduce((sum, item) => sum + (getRawPrice(item) * (Number(item.quantity) || 1)), 0);
    const totalActualAmount = cartItems.reduce((sum, item) => sum + (getRawActualPrice(item) * (Number(item.quantity) || 1)), 0);
    const totalSavings = Math.max(0, totalActualAmount - subtotalPrice);
    
    // Dynamic settings values — using regional (domestic/international) settings
    const shippingThreshold = storeSettings?.freeShippingThreshold ?? 399;
    const shippingChargeAmt = storeSettings?.shippingCharge ?? 150;
    const codChargeAmt = storeSettings?.codCharge ?? 100;
    const onlineDiscountPct = storeSettings?.onlineDiscountPercentage ?? 5;
    // GST is already baked into product prices — do NOT add on top
    
    const shippingCost = subtotalPrice >= shippingThreshold ? 0 : shippingChargeAmt;
    const totalPrice = Math.round((subtotalPrice + shippingCost) * 100) / 100;

    // Get variant info
    const getVariantInfo = (item) => {
        if (!item) return "";
        const color = item.color || item.variant?.color || item.variation?.color || item.product_details?.color || item.variant_details?.color || "";
        const size = item.size || item.variant?.size || item.variation?.size || item.product_details?.size || item.variant_details?.size || "";
        if (color && size) return `${size} / ${color}`;
        if (color) return color;
        if (size) return size;
        return "";
    };

    return (
        <main className="bg-white min-h-screen flex flex-col font-poppins text-[#303030]">
            <Header />



            <div className="flex-1 bg-white">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-10 md:px-16 lg:px-24 py-8 md:py-12">

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 size={48} className="text-[#135B42] animate-spin mb-4" />
                            <p className="text-gray-500">Loading your bag...</p>
                        </div>
                    )}

                    {/* Login Required */}
                    {!isLoading && error === "login_required" && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <ShoppingBag size={64} className="text-gray-300 mb-6" />
                            <h2 className="text-2xl font-playfair font-semibold text-[#303030] mb-2">Please Login First</h2>
                            <p className="text-gray-500 mb-8 max-w-md">You need to be logged in to view your shopping bag.</p>
                            <Link href="/login">
                                <button className="bg-[#135B42] text-white px-8 py-3 font-medium hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition rounded-md">
                                    Login Now
                                </button>
                            </Link>
                        </div>
                    )}

                    {/* Error State */}
                    {!isLoading && error && error !== "login_required" && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <AlertCircle size={48} className="text-red-400 mb-4" />
                            <p className="text-red-600 font-medium mb-4">{error}</p>
                            <button onClick={() => { setIsLoading(true); setError(""); fetchCart(); }} className="bg-[#135B42] text-white px-6 py-2 text-sm font-medium hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition rounded-md">
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Empty Cart */}
                    {!isLoading && !error && cartItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <ShoppingBag size={64} className="text-gray-300 mb-6" />
                            <h2 className="text-2xl font-playfair font-semibold text-[#303030] mb-2">Your bag is empty</h2>
                            <p className="text-gray-500 mb-8 max-w-md">Looks like you haven't added anything to your bag yet. Browse our collection to find something you'll love.</p>
                            <Link href="/shop">
                                <button className="bg-[#135B42] text-white px-8 py-3 font-medium hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition rounded-md">
                                    Continue Shopping
                                </button>
                            </Link>
                        </div>
                    )}

                    {/* Cart Items */}
                    {!isLoading && !error && cartItems.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] gap-8 items-start">
                                {/* Left: Cart Items List */}
                                <div className="flex flex-col gap-6 min-w-0">
                                    <div className="bg-white border border-[#E8DDD4] rounded-lg shadow-sm">
                                        <div className="flex flex-col divide-y divide-[#E8DDD4]">
                                            {cartItems.map((item, index) => {
                                                const itemId = resolveItemId(item) || `index-${index}`;
                                                const imageUrl = getImageUrl(item);
                                                const productName = getProductName(item);
                                                const quantity = Number(item.quantity) || 1;
                                                const isUpdating = updatingId === itemId;
                                                const maxStock = getMaxStock(item);
                                                const isAtMaxStock = quantity >= maxStock;

                                                // Determine unit and row prices
                                                const unitSalePrice = getRawPrice(item);
                                                const unitActualPrice = getRawActualPrice(item);
                                                const totalRowSalePrice = unitSalePrice * quantity;
                                                const totalRowActualPrice = unitActualPrice * quantity;

                                                const hasDiscount = unitActualPrice > unitSalePrice && unitSalePrice > 0;
                                                const discountPercent = hasDiscount ? Math.round(((unitActualPrice - unitSalePrice) / unitActualPrice) * 100) : 0;

                                                return (
                                                    <div key={itemId} className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 relative group">
                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={() => handleRemoveItem(itemId)}
                                                            className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 sm:p-0 z-10 cursor-pointer"
                                                            aria-label="Remove item"
                                                        >
                                                            <Trash2 size={20} strokeWidth={1.5} />
                                                        </button>

                                                        {/* Image */}
                                                        <div className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] shrink-0 bg-[#F9F9F9] rounded-lg overflow-hidden border border-[#F2EAE3]">
                                                            {imageUrl ? (
                                                                <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-[12px]">No Image</div>
                                                            )}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="flex flex-col flex-1 min-w-0 pt-1 pr-8">
                                                            <h3 className="text-[17px] sm:text-[18px] text-[#1e293b] mb-1 font-medium leading-tight">{productName}</h3>

                                                            {/* Simple fallback description */}
                                                            <p className="text-[12px] sm:text-[13px] text-gray-400 mb-2 line-clamp-2 leading-relaxed">
                                                                {item.description || item.product?.description || "Beautifully crafted divine item, ready for a secure checkout."}
                                                            </p>

                                                            {(() => {
                                                                const displaySize = item.size || item.variantDetails?.size || item.variant?.size || item.variation?.size || (typeof item.variant === 'string' && item.variant && isNaN(Number(item.variant)) ? item.variant : "") || "Standard Size";
                                                                const displayColor = item.color || item.variant?.color || item.variantDetails?.color;
                                                                return (
                                                                    <p className="text-[13px] text-[#d97706] mb-4 font-medium italic">
                                                                        Size: {displaySize}
                                                                        {displayColor && (
                                                                            <span className="text-gray-500 font-normal not-italic ml-2">| Color: {displayColor}</span>
                                                                        )}
                                                                    </p>
                                                                );
                                                            })()}

                                                            {/* Bottom Row - Quantity & Price */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-auto">
                                                                {/* Quantity Pill */}
                                                                <div className="flex items-center border border-[#E8DDD4] rounded-full bg-white h-[36px] w-[110px] overflow-hidden">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            if (quantity <= 1) {
                                                                                handleRemoveItem(itemId);
                                                                            } else {
                                                                                handleUpdateQuantity(itemId, quantity - 1);
                                                                            }
                                                                        }}
                                                                        className="flex-1 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer"
                                                                        title={quantity <= 1 ? "Remove item from cart" : "Decrease quantity"}
                                                                    >
                                                                        {quantity <= 1 ? (
                                                                            <Trash2 size={13} className="text-red-500 hover:scale-110 transition-transform" />
                                                                        ) : (
                                                                            <Minus size={14} />
                                                                        )}
                                                                    </button>
                                                                    <span className="w-10 text-center text-[#303030] font-semibold text-[14px]">{quantity}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            if (isAtMaxStock) {
                                                                                window.dispatchEvent(new CustomEvent("showGlobalToast", { detail: { message: `Maximum stock limit reached! Only ${maxStock} units of this product are available.`, type: "error" } }));
                                                                            } else {
                                                                                handleUpdateQuantity(itemId, quantity + 1);
                                                                            }
                                                                        }}
                                                                        className={`flex-1 h-full flex items-center justify-center transition ${isAtMaxStock ? "text-gray-300 bg-gray-50 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"}`}
                                                                    >
                                                                        <Plus size={14} />
                                                                    </button>
                                                                </div>

                                                                {/* Price Breakdown */}
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                                                                        {/* Actual MRP (Scales with Quantity) */}
                                                                        {hasDiscount && (
                                                                            <span className="text-[13px] text-gray-400 line-through whitespace-nowrap">
                                                                                {formatPrice(totalRowActualPrice, 0)}
                                                                            </span>
                                                                        )}

                                                                        {/* Selling Price (Scales with Quantity) */}
                                                                        <span className="text-[16px] sm:text-[18px] font-bold text-[#111827] whitespace-nowrap">
                                                                            {formatPrice(totalRowSalePrice, 0)}
                                                                        </span>

                                                                        {/* Discount Percentage */}
                                                                        {hasDiscount && discountPercent > 0 && (
                                                                            <span className="text-[12px] font-bold text-[#047857] uppercase tracking-wide whitespace-nowrap bg-[#E5F5ED] px-2 py-0.5 rounded">
                                                                                {discountPercent}% OFF
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {quantity > 1 && (
                                                                        <span className="text-[11px] text-gray-400 font-medium mt-0.5">
                                                                            ({formatPrice(unitSalePrice, 0)} per item)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Bottom actions */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
                                        <button onClick={() => router.push("/shop")} className="flex items-center gap-2 text-[#135B42] font-bold text-[14px] hover:underline cursor-pointer">
                                            <ArrowLeft size={16} /> Continue Shopping
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column Wrapper */}
                                <div className="flex flex-col gap-6 lg:sticky lg:top-24 h-fit">
                                    {/* Order Summary */}
                                    <div className="bg-white border border-[#E8DDD4] rounded-lg p-6 sm:p-8 shadow-sm">
                                        <h3 className="text-[22px] font-medium text-[#0f5132] mb-6">Order Summary</h3>

                                        <div className="space-y-4 mb-6 text-[14px]">
                                            <div className="flex justify-between items-center text-gray-600">
                                                <span>Total Price</span>
                                                <span className="font-semibold text-[#1f2937]">{formatPrice(totalActualAmount, 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-600">
                                                <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                                                <span className="font-semibold text-[#1f2937]">{formatPrice(subtotalPrice, 0)}</span>
                                            </div>
                                            {totalSavings > 0 && (
                                                <div className="flex justify-between items-center text-[#047857] font-semibold text-[13px]">
                                                    <span>Total Savings</span>
                                                    <span className="text-[#3b82f6]">-{formatPrice(totalSavings, 0)}</span>
                                                </div>
                                            )}
                                            
                                            {storeSettings?.gstPercentage > 0 && (
                                                <div className="flex justify-between items-center text-[13px] text-gray-400">
                                                    <span>GST ({storeSettings.gstPercentage}% — incl. in prices)</span>
                                                    <span>Inclusive</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center text-[15px]">
                                                <span>Shipping Estimate</span>
                                                {shippingCost === 0 ? (
                                                    <span className="text-green-600 font-semibold tracking-wide">FREE</span>
                                                ) : (
                                                    <span className="font-medium text-[#1f2937]">{formatPrice(shippingCost, 0)}</span>
                                                )}
                                            </div>

                                            {shippingCost > 0 && shippingThreshold > 0 && (
                                                <div className="text-xs text-[#6b7280]">
                                                    Add {formatPrice(shippingThreshold - subtotalPrice, 0)} more for FREE shipping
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center text-gray-600">
                                                <span>Shipping</span>
                                                <span className="font-bold text-[#047857] text-[13px]">Calculated at checkout</span>
                                            </div>
                                        </div>

                                        <div className="pt-5 border-t border-[#E8DDD4] flex justify-between items-center mb-8 mt-2">
                                            <span className="text-[17px] font-bold text-[#1f2937]">Estimated Total</span>
                                            <span className="font-bold text-[#1f2937] text-2xl">{formatPrice(totalPrice, 0)}</span>
                                        </div>

                                        {checkoutStatus.message && (
                                            <div className={`mb-6 p-4 rounded flex items-start gap-3 animate-in fade-in duration-300 ${checkoutStatus.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                                <p className="text-[13px] font-medium leading-tight">{checkoutStatus.message}</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleCheckout}
                                            disabled={cartItems.length === 0}
                                            className="w-full py-3.5 bg-[#0f5132] text-white font-bold text-[14px] tracking-wide hover:bg-[#0c4128] transition-colors rounded uppercase shadow-sm active:scale-[0.98]"
                                        >
                                            Proceed to Checkout
                                        </button>
                                        <p className="text-center text-[11px] text-gray-400 mt-4">
                                            Taxes and shipping calculated at checkout
                                        </p>
                                    </div>

                                    {/* Payment Methods */}
                                    <div className="mt-2 flex items-center justify-center gap-3">
                                        <span className="text-[12px] text-gray-500 font-bold">We Accept:</span>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-0.5 bg-[#1434CB] text-white text-[10px] font-bold rounded flex items-center italic tracking-wider">VISA</span>
                                            <span className="px-2 py-0.5 bg-[#EB001B] text-white text-[10px] font-bold rounded flex items-center gap-0.5 relative overflow-hidden">
                                                <div className="w-3 h-3 rounded-full bg-[#FF5F00] mix-blend-screen relative -mr-1.5 z-10"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#F79E1B] mix-blend-screen relative -ml-1.5 z-20"></div>
                                            </span>
                                            <span className="px-2 py-0.5 border border-gray-200 bg-white font-bold text-[10px] rounded flex items-center tracking-widest">
                                                <span className="text-[#FF7F00]">U</span><span className="text-[#097939]">P</span><span className="text-[#E77817]">I</span>
                                            </span>
                                            <span className="px-2 py-0.5 bg-[#002E6E] text-white text-[10px] font-bold rounded flex items-center">Paytm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 bg-[#FCF9F6] border border-[#E8DDD4] rounded-md p-6 lg:p-8">
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className="text-[#135B42] opacity-80"><Heart size={28} className="fill-transparent" /></div>
                                    <div>
                                        <p className="text-[12px] font-bold text-[#303030] leading-tight">Premium Quality</p>
                                        <p className="text-[11px] text-gray-500">Handpicked Fabric</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center text-center gap-2 border-l border-[#F2EAE3]">
                                    <div className="text-[#135B42] opacity-80"><Award size={28} /></div>
                                    <div>
                                        <p className="text-[12px] font-bold text-[#303030] leading-tight">Handmade</p>
                                        <p className="text-[11px] text-gray-500">with Love</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center text-center gap-2 border-l border-[#F2EAE3]">
                                    <div className="text-[#135B42] opacity-80"><RefreshCcw size={28} /></div>
                                    <div>
                                        <p className="text-[12px] font-bold text-[#303030] leading-tight">Easy Returns</p>
                                        <p className="text-[11px] text-gray-500">7 Days Return</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center text-center gap-2 border-l border-[#F2EAE3]">
                                    <div className="text-[#135B42] opacity-80"><ShieldCheck size={28} /></div>
                                    <div>
                                        <p className="text-[12px] font-bold text-[#303030] leading-tight">Secure Payment</p>
                                        <p className="text-[11px] text-gray-500">100% Safe</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center text-center gap-2 border-l border-[#F2EAE3]">
                                    <div className="text-[#135B42] opacity-80"><Truck size={28} /></div>
                                    <div>
                                        <p className="text-[12px] font-bold text-[#303030] leading-tight">Fast & Safe</p>
                                        <p className="text-[11px] text-gray-500">Delivery</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <Footer />
        </main>
    );
}
