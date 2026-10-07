import { apiClient } from "./apiClient";

export const GUEST_CART_KEY = "shri_divyam_guest_cart";
export const CART_QUANTITIES_KEY = "shri_divyam_cart_quantities";
export const REMOVED_ITEMS_KEY = "shri_divyam_removed_cart_items";
export const GUEST_WISHLIST_KEY = "shri_divyam_guest_wishlist";

export const getGuestWishlistIds = () => {
    try {
        const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const addGuestWishlistItem = (productId) => {
    const ids = getGuestWishlistIds();
    const pId = String(productId);
    const nextIds = ids.includes(pId) ? ids : [...ids, pId];
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(nextIds));
    window.dispatchEvent(new Event("wishlistUpdated"));
    return { success: true };
};

export const removeGuestWishlistItem = (productId) => {
    const ids = getGuestWishlistIds();
    const filtered = ids.filter(id => String(id) !== String(productId));
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("wishlistUpdated"));
    return { success: true };
};

export const syncGuestWishlistToUser = async (token) => {
    try {
        if (!token) return { success: true };

        const guestWishlist = getGuestWishlistIds();
        if (!guestWishlist || guestWishlist.length === 0) {
            localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify([]));
            return { success: true };
        }

        const existing = await apiClient.get("/api/auth/wishlist").catch(() => ({ wishlist: [] }));
        const existingIds = (existing.wishlist || existing.data || existing || []).map(item => String(item.product?._id || item.productId || item._id || item.id || item.product_id));

        for (const productId of guestWishlist) {
            const pId = String(productId);
            if (!existingIds.includes(pId)) {
                try {
                    await apiClient.post("/api/auth/wishlist/add", { productId: pId });
                } catch (error) {
                    console.warn("Guest wishlist sync failed for product:", pId, error);
                }
            }
        }

        const serverWishlist = await apiClient.get("/api/auth/wishlist").catch(() => ({ wishlist: [] }));
        const mergedIds = (serverWishlist.wishlist || serverWishlist.data || serverWishlist || []).map(item => String(item.product?._id || item.productId || item._id || item.id || item.product_id));
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(mergedIds));
        window.dispatchEvent(new Event("wishlistUpdated"));
        return { success: true };
    } catch (error) {
        console.error("Sync Guest Wishlist Error:", error);
        return { success: false };
    }
};

/**
 * Syncs the guest cart to the logged-in user's cart upon login.
 */
export const syncGuestCartToUser = async (token, userIdStr) => {
    try {
        const guestCartStr = localStorage.getItem(GUEST_CART_KEY);
        if (!guestCartStr) return { success: true };

        const guestCart = JSON.parse(guestCartStr);
        if (!guestCart || guestCart.length === 0) return { success: true };

        // For each guest item, add it to the server cart
        for (const item of guestCart) {
            try {
                await apiClient.post("/api/cart/add", {
                    productId: item.productId,
                    variant: item.variant,
                    quantity: Number(item.quantity)
                });
            } catch (e) {
                console.error("Failed to sync guest item to server:", item, e);
            }
        }

        // Clear guest cart
        localStorage.removeItem(GUEST_CART_KEY);
        localStorage.removeItem(CART_QUANTITIES_KEY); // Will be rebuilt from server

        // Fetch latest cart to rebuild local quantities
        await refreshCartQuantities();

        window.dispatchEvent(new Event("cartUpdated"));
        return { success: true };
    } catch (error) {
        console.error("Sync Guest Cart Error:", error);
        return { success: false };
    }
};

/**
 * Helper to fetch cart from server and rebuild CART_QUANTITIES_KEY
 */
export const refreshCartQuantities = async () => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        if (!token) return;

        const res = await apiClient.get("/api/cart");
        const items = res.data?.items || res.cart?.items || res.items || [];

        const newQuantities = {};
        items.forEach(item => {
            const pId = String(item.product?._id || item.product?.id || item.productId || item.product || "");
            const vId = item.variant || item.variantDetails?.size || "";
            if (pId) {
                const key = `${pId}_${vId}`;
                newQuantities[key] = Number(item.quantity) || 1;
            }
        });
        localStorage.setItem(CART_QUANTITIES_KEY, JSON.stringify(newQuantities));
        window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
        console.error("Failed to refresh cart quantities:", error);
    }
};

export const getRemovedItems = () => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(REMOVED_ITEMS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const isItemRemoved = (item) => {
    if (!item) return false;
    const removed = getRemovedItems();
    if (!removed || removed.length === 0) return false;

    const prodObj = item.product && typeof item.product === 'object' ? item.product : {};
    const possiblePIds = [
        item.productId,
        item.product_id,
        item.id,
        item._id,
        item.cart_item_id,
        item.row_id,
        item.cart_id,
        prodObj._id,
        prodObj.id,
        prodObj.productId,
        prodObj.product_id,
        item.slug,
        prodObj.slug
    ].filter(Boolean).map(String);

    const vId = String(item.variant_id || item.variation_id || item.variation?.id || item.variant?.id || item.variant || "");
    const size = String(item.size || item.variantDetails?.size || item.variant?.size || item.variation?.size || "");

    return removed.some(r => {
        const rPId = String(r.pId || r.productId || r.product_id || "");
        if (!rPId) return false;

        const pIdMatches = possiblePIds.includes(rPId);
        if (!pIdMatches) return false;

        const rVId = String(r.vId || r.variant || "");

        // If variant matches, or if it was removed without a variant, consider it removed.
        // Ignore strict size checking because checkout cart items might not have size populated yet.
        if (rVId && vId && rVId !== "undefined" && vId !== "undefined") {
            if (rVId !== vId) return false;
        }

        return true;
    });
};

export const clearRemovedItem = (productId) => {
    try {
        if (typeof window === 'undefined') return;
        // The delete API is fixed now, so we can just wipe the entire blacklist 
        // whenever a user adds an item, preventing any stale cartItemId ghosting.
        localStorage.removeItem(REMOVED_ITEMS_KEY);
    } catch (e) { }
};

/**
 * Resolves exact effective selling price and MRP for an item (matching per-size price)
 */
export const resolveItemPricing = (item) => {
    if (!item) return { salePrice: 0, actualPrice: 0 };

    const prod = item.product || item.product_details || {};
    const size = String(item.size || item.variantDetails?.size || item.variant?.size || item.variation?.size || "").trim();
    const color = String(item.color || item.variantDetails?.color || item.variant?.color || item.variation?.color || "").trim();

    let matchedSale = null;
    let matchedActual = null;

    // 1. Direct variantDetails saved with item
    if (item.variantDetails) {
        if (item.variantDetails.salePrice !== undefined && item.variantDetails.salePrice !== null && Number(item.variantDetails.salePrice) > 0) {
            matchedSale = Number(item.variantDetails.salePrice);
        } else if (item.variantDetails.sellingPrice !== undefined && item.variantDetails.sellingPrice !== null && Number(item.variantDetails.sellingPrice) > 0) {
            matchedSale = Number(item.variantDetails.sellingPrice);
        }

        if (item.variantDetails.actualPrice !== undefined && item.variantDetails.actualPrice !== null && Number(item.variantDetails.actualPrice) > 0) {
            matchedActual = Number(item.variantDetails.actualPrice);
        } else if (item.variantDetails.price !== undefined && item.variantDetails.price !== null && Number(item.variantDetails.price) > 0) {
            const pVal = Number(item.variantDetails.price);
            if (matchedSale === null) matchedSale = pVal;
            else if (pVal > matchedSale) matchedActual = pVal;
        }
    }

    // 2. If size is present, match in product.sizes / product.rawSizes / product.variations
    if (size) {
        // Check product.rawSizes / product.sizes array
        const rawSizes = Array.isArray(prod.sizes) ? prod.sizes : (Array.isArray(item.rawSizes) ? item.rawSizes : (Array.isArray(prod.rawSizes) ? prod.rawSizes : []));
        const sizeEntry = rawSizes.find(s => typeof s === 'object' && s !== null && s.size && s.size.trim().toLowerCase() === size.toLowerCase());
        if (sizeEntry) {
            const sSale = sizeEntry.sale_price ?? sizeEntry.salePrice ?? sizeEntry.discount_price ?? null;
            const sActual = sizeEntry.actual_price ?? sizeEntry.actualPrice ?? sizeEntry.regular_price ?? sizeEntry.mrp ?? null;
            const sPrice = sizeEntry.price;

            if (sSale !== null && Number(sSale) > 0) matchedSale = Number(sSale);
            if (sActual !== null && Number(sActual) > 0) matchedActual = Number(sActual);

            if (sPrice !== undefined && sPrice !== null && Number(sPrice) > 0) {
                const sPriceNum = Number(sPrice);
                if (matchedSale === null) matchedSale = sPriceNum;
                else if (sPriceNum > matchedSale && matchedActual === null) matchedActual = sPriceNum;
            }
        }

        // Check product.variations array
        const variations = Array.isArray(prod.variations) ? prod.variations : (Array.isArray(prod.variants) ? prod.variants : []);
        if (variations.length > 0) {
            const matchedVar = variations.find(v =>
                v.size && v.size.trim().toLowerCase() === size.toLowerCase() &&
                (!color || !v.color || v.color.trim().toLowerCase() === color.toLowerCase())
            ) || variations.find(v => v.size && v.size.trim().toLowerCase() === size.toLowerCase());

            if (matchedVar) {
                const vSale = matchedVar.sale_price ?? matchedVar.salePrice ?? matchedVar.discount_price ?? null;
                const vActual = matchedVar.actual_price ?? matchedVar.actualPrice ?? matchedVar.regular_price ?? matchedVar.mrp ?? null;
                const vPrice = matchedVar.price;

                if (vSale !== null && Number(vSale) > 0) matchedSale = Number(vSale);
                if (vActual !== null && Number(vActual) > 0) matchedActual = Number(vActual);

                if (vPrice !== undefined && vPrice !== null && Number(vPrice) > 0) {
                    const vPriceNum = Number(vPrice);
                    if (matchedSale === null) matchedSale = vPriceNum;
                    else if (vPriceNum > matchedSale && matchedActual === null) matchedActual = vPriceNum;
                }
            }
        }
    }

    // 3. Item-level sale_price / selling_price / actual_price / mrp
    if (matchedSale === null) {
        const itemSale = item.sale_price ?? item.salePrice ?? item.selling_price ?? null;
        if (itemSale !== null && Number(itemSale) > 0) {
            matchedSale = Number(itemSale);
        }
    }
    if (matchedActual === null) {
        const itemActual = item.actual_price ?? item.actualPrice ?? item.regular_price ?? item.original_price ?? item.mrp ?? null;
        if (itemActual !== null && Number(itemActual) > 0) {
            matchedActual = Number(itemActual);
        }
    }

    // 4. Product-level fallback (standard base prices)
    const baseActual = Number(prod.actual_price || prod.actualPrice || prod.regular_price || prod.mrp || prod.price || prod.basePrice || item.price || 0);
    const baseSale = (prod.sale_price !== null && prod.sale_price !== undefined) ? Number(prod.sale_price) : ((prod.salePrice !== null && prod.salePrice !== undefined) ? Number(prod.salePrice) : null);

    // If matchedActual is missing or <= matchedSale, fall back to baseActual if baseActual > matchedSale
    let finalActual = matchedActual;
    if (finalActual === null || finalActual <= (matchedSale || 0)) {
        if (baseActual > 0 && (matchedSale === null || baseActual > matchedSale)) {
            finalActual = baseActual;
        }
    }

    const finalSale = matchedSale !== null ? matchedSale : ((baseSale !== null && baseSale > 0 && baseSale < baseActual) ? baseSale : (finalActual || baseActual));

    if (!finalActual || finalActual < finalSale) {
        finalActual = finalSale;
    }

    return {
        salePrice: Number(finalSale) || 0,
        actualPrice: Number(finalActual) || Number(finalSale) || 0
    };
};

/**
 * Adds a product to the cart (guest or logged-in)
 */
export const addToCart = async (product, quantity = 1, forcedVariantId = null, variantDetails = null) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        const productId = String(product._id || product.id || product.product_id || product.productId || "");
        let variantId = forcedVariantId ? String(forcedVariantId) : "";

        // Auto-select first variant if none provided to prevent backend rejection
        if (!variantId && (product.variations?.length > 0 || product.variants?.length > 0)) {
            const v = product.variations?.[0] || product.variants?.[0];
            variantId = String(v.id || v._id || "");
        }

        // Un-blacklist product so it is always visible when added
        clearRemovedItem(productId);

        // If forcedVariantId looks like a size label (not a numeric/ObjectId), use it as the size too
        const isSizeLabel = forcedVariantId && isNaN(Number(forcedVariantId)) && !(/^[a-f0-9]{24}$/i.test(forcedVariantId));
        const chosenSize = variantDetails?.size || (isSizeLabel ? forcedVariantId : "") || product.size || "";
        const chosenColor = variantDetails?.color || product.color || "";
        const effectivePrice = Number(variantDetails?.actualPrice || variantDetails?.price || product.actualPrice || product.price || product.basePrice || 0);
        const effectiveSalePrice = Number(variantDetails?.salePrice || variantDetails?.sellingPrice || product.salePrice || product.price || effectivePrice);
        const addQty = Math.max(1, Number(quantity) || 1);

        // Check stock availability locally
        let availableStock = null;
        const cleanChosenSize = chosenSize ? chosenSize.trim().toLowerCase() : "";

        if (variantDetails && variantDetails.inventory !== undefined && variantDetails.inventory !== null) {
            availableStock = Number(variantDetails.inventory);
        } else if (product.variations && product.variations.length > 0) {
            const v = product.variations.find(v => String(v.id || v._id) === variantId || (cleanChosenSize && v.size && v.size.trim().toLowerCase() === cleanChosenSize));
            if (v && v.inventory !== undefined && v.inventory !== null) availableStock = Number(v.inventory);
            else if (v && v.stock !== undefined && v.stock !== null) availableStock = Number(v.stock);
        } else if (product.variants && product.variants.length > 0) {
            const v = product.variants.find(v => String(v.id || v._id) === variantId || (cleanChosenSize && v.size && v.size.trim().toLowerCase() === cleanChosenSize));
            if (v && v.inventory !== undefined && v.inventory !== null) availableStock = Number(v.inventory);
            else if (v && v.stock !== undefined && v.stock !== null) availableStock = Number(v.stock);
        }

        if (availableStock === null && cleanChosenSize) {
            const allSizes = [...(Array.isArray(product.sizes) ? product.sizes : []), ...(Array.isArray(product.rawSizes) ? product.rawSizes : [])];
            if (allSizes.length > 0) {
                const s = allSizes.find(s => typeof s === 'object' && s !== null && s.size && s.size.trim().toLowerCase() === cleanChosenSize);
                if (s) {
                    const sStock = s.inventory ?? s.stock ?? s.quantity ?? null;
                    if (sStock !== null) availableStock = Number(sStock);
                }
            }
        }

        if (availableStock === null) {
            availableStock = Number(product.inventory ?? product.totalInventory ?? product.stock ?? 0);
        }

        const currentCartQty = getCartItemQuantity(product, variantId || chosenSize).quantity || 0;
        if (currentCartQty + addQty > availableStock) {
            return { success: false, message: `Only ${availableStock} units available in stock.` };
        }

        if (!token) {
            // --- GUEST MODE ---
            const guestCartStr = localStorage.getItem(GUEST_CART_KEY);
            let guestCart = guestCartStr ? JSON.parse(guestCartStr) : [];

            const existingIndex = guestCart.findIndex(it =>
                String(it.productId || it.product_id || it.id || it._id || "") === productId &&
                (String(it.variant || it.variant_id || "") === variantId || (chosenSize && (it.size === chosenSize || it.variantDetails?.size === chosenSize)))
            );

            if (existingIndex > -1) {
                guestCart[existingIndex].quantity = Number(guestCart[existingIndex].quantity) + addQty;
                guestCart[existingIndex].price = effectivePrice;
                guestCart[existingIndex].actual_price = effectivePrice;
                guestCart[existingIndex].sale_price = effectiveSalePrice;
                guestCart[existingIndex].selling_price = effectiveSalePrice;
                if (variantDetails) guestCart[existingIndex].variantDetails = variantDetails;
                if (chosenSize) guestCart[existingIndex].size = chosenSize;
                if (chosenColor) guestCart[existingIndex].color = chosenColor;
            } else {
                guestCart.push({
                    productId,
                    product_id: productId,
                    id: productId,
                    _id: productId,
                    variant: variantId || chosenSize,
                    variant_id: variantId || chosenSize,
                    size: chosenSize,
                    color: chosenColor,
                    quantity: addQty,
                    product_name: product.title || product.name || product.product_name || "Divine Product",
                    title: product.title || product.name || "Divine Product",
                    name: product.name || product.title || "Divine Product",
                    price: effectivePrice,
                    actual_price: effectivePrice,
                    sale_price: effectiveSalePrice,
                    selling_price: effectiveSalePrice,
                    image_path: product.image || product.image_path || product.mainImage || (product.images && product.images[0]) || "/logo.png",
                    image: product.image || product.image_path || product.mainImage || (product.images && product.images[0]) || "/logo.png",
                    slug: product.slug || "",
                    category: product.category || "",
                    product: product,
                    ...(variantDetails && { variantDetails })
                });
            }

            localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));

            // Update quantities map
            const quantities = JSON.parse(localStorage.getItem(CART_QUANTITIES_KEY) || "{}");
            const key = `${productId}_${variantId || chosenSize}`;
            quantities[key] = (quantities[key] || 0) + addQty;
            localStorage.setItem(CART_QUANTITIES_KEY, JSON.stringify(quantities));

            window.dispatchEvent(new Event("cartUpdated"));
            return { success: true, message: "Added to Bag!" };
        } else {
            // --- LOGGED-IN MODE ---
            const finalVariant = (variantId || chosenSize);
            await apiClient.post("/api/cart/add", {
                productId,
                product_id: productId,
                variant: finalVariant,
                variant_id: finalVariant,
                size: chosenSize,
                color: chosenColor,
                price: effectiveSalePrice,
                sale_price: effectiveSalePrice,
                actual_price: effectivePrice,
                quantity: addQty,
                ...(variantDetails && { variantDetails })
            });

            await refreshCartQuantities();
            window.dispatchEvent(new Event("cartUpdated"));
            return { success: true, message: "Added to Bag!" };
        }
    } catch (error) {
        console.error("Add to Cart Error:", error);
        let errMsg = error?.response?.data?.message || error.message || "An error occurred.";
        if (errMsg.includes("Cannot add more") || errMsg.includes("Limit is")) {
            errMsg = `Maximum stock limit reached! Only ${availableStock} units available for this product.`;
        }
        return { success: false, message: errMsg };
    }
};

/**
 * Gets the specific quantity of a product in the cart locally.
 */
export const getCartItemQuantity = (product, targetVariantId = null) => {
    try {
        const token = localStorage.getItem("token");
        const stored = localStorage.getItem(CART_QUANTITIES_KEY);
        const productId = String(product._id || product.id || product.product_id || product.productId);

        // In guest mode, the cart array is authoritative. The quantity map can
        // retain stale keys after an item is removed from the cart page.
        if (!token || token === "dummy-token-for-now") {
            const guestCart = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
            const matchingItems = guestCart.filter(item => {
                const itemProductId = String(item.productId || item.product_id || item.id || item._id || "");
                if (itemProductId !== productId) return false;

                if (targetVariantId !== null && targetVariantId !== undefined) {
                    const itemVariantId = String(item.variant || item.variant_id || item.size || "");
                    return itemVariantId === String(targetVariantId);
                }
                return true;
            });

            if (matchingItems.length === 0) return { quantity: 0, variantId: null };

            const matchedItem = matchingItems[0];
            return {
                quantity: matchingItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0),
                variantId: String(matchedItem.variant || matchedItem.variant_id || matchedItem.size || "")
            };
        }

        if (!stored) return { quantity: 0, variantId: null };
        const quantities = JSON.parse(stored);

        if (targetVariantId !== null && targetVariantId !== undefined) {
            const key = `${productId}_${targetVariantId}`;
            return { quantity: Number(quantities[key] || 0), variantId: targetVariantId };
        }

        // Fallback: Scan for any variant of this product
        let foundQty = 0;
        let foundVariant = null;

        Object.entries(quantities).forEach(([key, val]) => {
            if (Number(val) <= 0) return;
            if (key.startsWith(`${productId}_`)) {
                if (!foundVariant) {
                    foundQty = Number(val);
                    foundVariant = key.split('_')[1];
                }
            }
        });

        return { quantity: foundQty, variantId: foundVariant || "" };
    } catch (e) {
        return { quantity: 0, variantId: null };
    }
};

/**
 * Updates the quantity of a product in the cart
 */
export const updateCartItemQuantity = async (product, targetQuantity, forcedVariantId = "") => {
    try {
        if (targetQuantity < 1) return { success: false, message: "Quantity must be at least 1" };

        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        const realProductId = String(
            (typeof product.product === 'object' ? (product.product?._id || product.product?.id) : product.product) ||
            product.product_id ||
            product.productId ||
            product._id ||
            product.id ||
            ""
        );
        const cartItemId = String(product._id || product.id || product.cart_item_id || product.cartItemId || "");
        const variantId = forcedVariantId ? String(forcedVariantId) : String(product.variant_id || product.variation_id || product.variant || "");

        // 1. Instant local persistence for both guest and logged-in mode
        try {
            const guestCart = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
            const existingIndex = guestCart.findIndex(it =>
                (String(it.productId || it.product_id || it.id || it._id || "") === realProductId || (cartItemId && String(it.productId || it.product_id || it.id || "") === cartItemId)) &&
                String(it.variant || it.variant_id || "") === variantId
            );

            if (existingIndex > -1) {
                guestCart[existingIndex].quantity = Number(targetQuantity);
                localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
            }

            const quantities = JSON.parse(localStorage.getItem(CART_QUANTITIES_KEY) || "{}");
            quantities[`${realProductId}_${variantId}`] = Number(targetQuantity);
            if (cartItemId && cartItemId !== realProductId) {
                quantities[`${cartItemId}_${variantId}`] = Number(targetQuantity);
            }
            localStorage.setItem(CART_QUANTITIES_KEY, JSON.stringify(quantities));
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (localErr) {
            console.warn("Local cart quantity update error:", localErr);
        }

        // 2. If logged-in, sync with backend using fallback strategies
        if (token) {
            let userId = "";
            try {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                userId = user.id || user.user_id || user.userid || "";
            } catch (e) { }

            const payload = {
                user_id: userId,
                userId: userId,
                cart_item_id: cartItemId,
                id: cartItemId,
                itemId: cartItemId,
                productId: realProductId,
                product_id: realProductId,
                variant: variantId,
                variant_id: variantId,
                variation_id: variantId,
                quantity: Number(targetQuantity)
            };
            const strategies = [
                () => apiClient.put(`/api/cart/${cartItemId}`, payload),
                () => apiClient.post(`/api/cart/${cartItemId}`, payload),
                () => apiClient.put(`/api/cart/update/${cartItemId}`, payload),
                () => apiClient.post(`/api/cart/update/${cartItemId}`, payload),
                () => apiClient.put("/api/cart/update", payload),
                () => apiClient.post("/api/cart/update", payload),
                () => apiClient.put("/api/cart", payload),
                () => apiClient.post("/api/cart", payload)
            ];

            // 1. Remove from backend directly using safe POST strategies
            const delPayload = {
                productId: realProductId,
                product_id: realProductId,
                variant: variantId,
                variantDetails: product.variantDetails || { size: product.size, color: product.color },
                itemId: cartItemId,
                cart_item_id: cartItemId,
                id: cartItemId,
                removeAll: true
            };

            const updateDeleteStrategies = [
                () => apiClient.post("/api/cart/remove", delPayload),
                () => apiClient.post("/api/cart/delete", delPayload),
                ...(cartItemId ? [() => apiClient.delete(`/api/cart/item/${cartItemId}`)] : [])
            ];

            for (const strategy of updateDeleteStrategies) {
                try {
                    const res = await strategy();
                    if (res && res.success !== false) break;
                } catch (e) { }
            }

            // 2. Re-add to backend with the new exact quantity
            const variantDetails = product.variantDetails || product.variant_details || { size: String(product.size || ""), color: String(product.color || "") };
            await apiClient.post("/api/cart/add", {
                productId: realProductId,
                product_id: realProductId,
                variant: variantId || product.size,
                variant_id: variantId || product.size,
                size: product.size,
                color: product.color,
                price: product.price || product.salePrice || product.sale_price,
                quantity: Number(targetQuantity),
                ...(variantDetails && { variantDetails })
            }).catch(() => { });


            await refreshCartQuantities().catch(() => { });
        }

        return { success: true, message: "Cart updated" };
    } catch (error) {
        console.warn("Update Cart Notice:", error?.message || error);
        return { success: true, message: "Cart updated locally" };
    }
};

/**
 * Removes an item from the cart completely
 */
export const removeCartItem = async (product, forcedVariantId = "") => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

        // Extract real product ID (underlying product MongoDB _id) vs cart row ID
        const realProductId = String(
            (typeof product.product === 'object' ? (product.product?._id || product.product?.id) : product.product) ||
            product.product_id ||
            product.productId ||
            product._id ||
            product.id ||
            ""
        );
        const cartItemId = String(product._id || product.id || product.cart_item_id || product.cartItemId || "");
        const variantId = forcedVariantId ? String(forcedVariantId) : String(product.variant_id || product.variation_id || product.variant || product.size || product.variantDetails?.size || "");
        const size = String(product.size || product.variantDetails?.size || "");

        // 1. Clean up ALL traces in localStorage
        try {
            // Remove from guest cart array
            const guestCart = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
            const updatedGuestCart = guestCart.filter(it => {
                const itPId = String(it.productId || it.product_id || it._id || it.id || "");
                const itVId = String(it.variant || it.variant_id || "");
                const itSize = String(it.size || it.variantDetails?.size || "");

                const matchProduct = (itPId === realProductId || (cartItemId && itPId === cartItemId));
                if (!matchProduct) return true;

                // If variant or size is specified, only remove that variant/size
                if (variantId && itVId && itVId !== variantId) {
                    if (size && itSize && itSize === size) return false;
                    return true;
                }
                if (size && itSize && itSize !== size) return true;
                return false;
            });
            localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedGuestCart));

            // Clean up from saved quantities map
            const quantities = JSON.parse(localStorage.getItem(CART_QUANTITIES_KEY) || "{}");
            const exactKey = variantId ? `${realProductId}_${variantId}` : realProductId;
            delete quantities[exactKey];
            if (cartItemId) delete quantities[cartItemId];
            localStorage.setItem(CART_QUANTITIES_KEY, JSON.stringify(quantities));

            // Record in removed items blacklist
            const removedItems = JSON.parse(localStorage.getItem(REMOVED_ITEMS_KEY) || "[]");
            if (realProductId && !removedItems.some(r => r.pId === realProductId && String(r.vId) === variantId)) {
                removedItems.push({ pId: realProductId, vId: variantId, time: Date.now() });
            }
            if (cartItemId && cartItemId !== realProductId && !removedItems.some(r => r.pId === cartItemId)) {
                removedItems.push({ pId: cartItemId, vId: variantId, time: Date.now() });
            }
            localStorage.setItem(REMOVED_ITEMS_KEY, JSON.stringify(removedItems));
        } catch (storageErr) {
            console.error("LocalStorage cart cleanup error:", storageErr);
        }

        // 2. If logged in, execute backend deletion strategies
        if (token) {
            const targetId = cartItemId || realProductId;

            const deleteStrategies = [
                () => apiClient.post("/api/cart/remove", { productId: realProductId, product_id: realProductId, variant: variantId, variantDetails: product.variantDetails || { size: size, color: product.color || "N/A" }, itemId: cartItemId, cart_item_id: cartItemId, removeAll: true }, { silent: true }),
                () => apiClient.post("/api/cart/delete", { productId: realProductId, product_id: realProductId, variant: variantId, variantDetails: product.variantDetails || { size: size, color: product.color || "N/A" }, id: cartItemId, cart_item_id: cartItemId }, { silent: true }),
                ...(cartItemId ? [() => apiClient.delete(`/api/cart/item/${cartItemId}`)] : [])
            ];

            for (const strategy of deleteStrategies) {
                try {
                    const res = await strategy();
                    if (res && res.success !== false) break;
                } catch (e) {
                    // Try next strategy
                }
            }

            await refreshCartQuantities().catch(() => { });
        }

        window.dispatchEvent(new Event("cartUpdated"));
        return { success: true, message: "Item removed" };
    } catch (error) {
        console.error("Remove from Cart Error:", error);
        return { success: false, message: "An error occurred." };
    }
};

/**
 * Clears the entire cart
 */
export const clearCart = async () => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

        if (!token) {
            localStorage.removeItem(GUEST_CART_KEY);
            localStorage.removeItem(CART_QUANTITIES_KEY);
            window.dispatchEvent(new Event("cartUpdated"));
            return { success: true, message: "Cart cleared" };
        } else {
            await apiClient.delete("/api/cart");
            await refreshCartQuantities();
            return { success: true, message: "Cart cleared" };
        }
    } catch (error) {
        console.error("Clear Cart Error:", error);
        return { success: false, message: "An error occurred." };
    }
};

export const PENDING_ACTION_KEY = "shri_divyam_pending_action";

export const setPendingAction = (type, product, quantity = 1, variantId = null, variantDetails = null) => {
    if (typeof window === "undefined" || !product) return;
    try {
        const pending = {
            type,
            productId: String(product._id || product.id || product.productId || product.product_id),
            product: {
                ...product,
                _id: product._id || product.id,
                id: product.id || product._id,
                title: product.title || product.name,
                name: product.name || product.title,
                slug: product.slug || "",
                price: product.price || 0,
                salePrice: product.salePrice || product.price || 0,
                image: product.image || product.mainImage || "/logo.png",
                inventory: product.inventory ?? product.totalInventory ?? product.stock ?? 999,
                totalInventory: product.totalInventory ?? product.inventory ?? product.stock ?? 999,
                stock: product.stock ?? product.inventory ?? product.totalInventory ?? 999
            },
            quantity: Number(quantity) || 1,
            variantId,
            variantDetails,
            timestamp: Date.now()
        };
        localStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(pending));
    } catch (e) {
        console.error("Error setting pending action:", e);
    }
};

export const executePendingAction = async (authToken) => {
    if (typeof window === "undefined") return;
    try {
        const stored = localStorage.getItem(PENDING_ACTION_KEY);
        if (!stored) return;
        const pending = JSON.parse(stored);
        localStorage.removeItem(PENDING_ACTION_KEY);

        if (Date.now() - (pending.timestamp || 0) > 2 * 60 * 60 * 1000) return;

        const pName = pending.product?.title || pending.product?.name || "Product";

        if (pending.type === "ADD_TO_CART") {
            try {
                const res = await addToCart(
                    pending.product,
                    pending.quantity || 1,
                    pending.variantId || "Standard Size",
                    pending.variantDetails || null
                );
                if (res && res.success !== false) {
                    window.dispatchEvent(new CustomEvent("showGlobalToast", {
                        detail: { message: `${pName} added to your cart!`, type: "success" }
                    }));
                } else {
                    console.warn("Auto add to cart warning:", res?.message);
                }
            } catch (cartErr) {
                console.error("Failed auto add to cart:", cartErr);
            }
        } else if (pending.type === "ADD_TO_WISHLIST") {
            try {
                await apiClient.post("/api/auth/wishlist/add", {
                    productId: pending.productId
                }, { silent: true }).catch(() => null);

                let wishlistIds = [];
                try {
                    const storedWish = localStorage.getItem("shri_divyam_wishlist_items");
                    if (storedWish) wishlistIds = JSON.parse(storedWish);
                } catch (e) {}
                if (!wishlistIds.includes(pending.productId)) wishlistIds.push(pending.productId);
                localStorage.setItem("shri_divyam_wishlist_items", JSON.stringify(wishlistIds));

                window.dispatchEvent(new Event("wishlistUpdated"));
                window.dispatchEvent(new CustomEvent("showGlobalToast", {
                    detail: { message: `${pName} saved to your wishlist!`, type: "success" }
                }));
            } catch (wishErr) {
                console.error("Failed auto add to wishlist:", wishErr);
            }
        }
    } catch (err) {
        console.error("Failed to execute pending action:", err);
    }
};
