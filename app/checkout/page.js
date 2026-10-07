"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Loader2, ArrowLeft, ShieldCheck, Truck, CheckCircle, MapPin, Phone, User, Home, Globe, Landmark, Mail, Plus, CreditCard, PenSquare, Trash2, X } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { useCurrency } from "../context/CurrencyContext";
// Removed static products import
import { apiClient } from "../utils/apiClient";
import { resolveItemPricing } from "../utils/cartUtils";

export default function CheckoutPage() {
    const router = useRouter();
    const { formatPrice, currency } = useCurrency();
    // --- localStorage helpers for persistent cart synchronization ---
    const REMOVED_ITEMS_KEY = "shri_divyam_removed_cart_items";
    const CART_QUANTITIES_KEY = "shri_divyam_cart_quantities";

    const getRemovedItems = () => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(REMOVED_ITEMS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) { return []; }
    };

    const isItemRemoved = (item) => {
        const removed = getRemovedItems();
        if (!removed || removed.length === 0) return false;

        // Check all possible ID fields to ensure we match what My Bag saved
        const possiblePIds = [
            item.product_id,
            item.id,
            item.cart_item_id,
            item.row_id,
            item.product?.id
        ].filter(Boolean).map(String);

        const vId = String(item.variant_id || item.variation_id || item.variation?.id || item.variant?.id || "");

        return removed.some(r => {
            // If the saved pId matches any of our possible IDs
            const pIdMatches = possiblePIds.includes(String(r.pId));
            if (!pIdMatches) return false;

            // If variant info exists in both, they must match. 
            // If only one has it, we assume it's a match by product.
            if (r.vId && vId && r.vId !== "undefined" && vId !== "undefined") {
                return String(r.vId) === vId;
            }
            return true;
        });
    };

    const getSavedQuantities = () => {
        try {
            const stored = localStorage.getItem(CART_QUANTITIES_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) { return {}; }
    };

    const getItemKey = (item) => {
        const productId = item.product_id || item.id;
        const variantId = item.variant_id || item.variation_id || item.variation?.id || item.variant?.id || '';
        return `${productId}_${variantId}`;
    };

    const [isLoading, setIsLoading] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [isFetchingCart, setIsFetchingCart] = useState(true);
    const [isFetchingAddresses, setIsFetchingAddresses] = useState(true);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [activeStep, setActiveStep] = useState(1); // 1: Shipping, 2: Payment
    const [isSyncing, setIsSyncing] = useState(false);
    const [storeSettings, setStoreSettings] = useState(null);

    // Coupon State
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponStatus, setCouponStatus] = useState({ type: "", message: "" });
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        country: "India",
        address1: "",
        address2: "",
        landmark: "",
        phone: "",
        city: "",
        state: "",
        zipcode: "",
        save_address: true
    });

    const [errors, setErrors] = useState({});
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [deleteAddressId, setDeleteAddressId] = useState(null);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const data = await apiClient.get("/api/coupons");
                if (data && Array.isArray(data.data)) {
                    setAvailableCoupons(data.data.filter(c => c.is_active !== false));
                } else if (Array.isArray(data)) {
                    setAvailableCoupons(data.filter(c => c.is_active !== false));
                }
            } catch (error) {
                console.error("Failed to fetch coupons:", error);
            }
        };
        fetchCoupons();

        const fetchSettings = async () => {
            try {
                const data = await apiClient.get("/api/settings");
                if (data) {
                    // API returns { data: { domestic: {...}, international: {...} } }
                    // Extract the correct regional settings based on currency
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

        const fetchCart = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const data = await apiClient.get("/api/cart");
                if (data) {
                    const rawItems = data.cart_items || data.cart || data.items || data.data || [];
                    let parsedItems = [];

                    if (Array.isArray(rawItems)) {
                        parsedItems = rawItems;
                    } else if (rawItems && typeof rawItems === 'object') {
                        // Support transformed response from proxy (_original_items)
                        parsedItems = rawItems._original_items || (Array.isArray(rawItems.items) ? rawItems.items : []);
                    }

                    // --- AGGRESSIVE AUTO-CLEANUP START ---
                    const ghostItems = parsedItems.filter(item => isItemRemoved(item));
                    if (ghostItems.length > 0) {
                        console.log(`🧹 Checkout Cleanup: Found ${ghostItems.length} ghost items on server.`);
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
                            const vId = item.variant_id || item.variation_id;

                            const strategies = [
                                () => apiClient.post(`/api/cart/remove`, { cart_item_id: itemId, id: itemId, product_id: pId, variation_id: vId, user_id: String(userId) }),
                                () => apiClient.delete(`/api/cart/remove/${itemId || pId}`),
                                () => apiClient.post(`/api/cart/delete`, { cart_item_id: itemId, product_id: pId, user_id: String(userId) })
                            ];

                            for (const strategy of strategies) {
                                try {
                                    await strategy();
                                    console.log(`✅ Checkout Cleanup: Successfully removed item ${pId} from server`); break;
                                } catch (e) { }
                            }
                        });
                    }
                    // --- AGGRESSIVE AUTO-CLEANUP END ---

                    // --- ENRICHMENT START (Optimized with local data) ---
                    const enrichItems = async (items) => {
                        try {
                            if (typeof staticProducts !== 'undefined' && staticProducts && staticProducts.length > 0) {
                                setCartItems(prev => {
                                    return prev.map(item => {
                                        const pId = item.product_id || item.id;
                                        const found = staticProducts.find(p => String(p.id) === String(pId));
                                        if (found) {
                                            return {
                                                ...item,
                                                product_id: item.product_id || found.id,
                                                product_name: item.product_name || found.title || found.name,
                                                price: item.price || found.price,
                                                image_path: item.image_path || found.image
                                            };
                                        }
                                        return item;
                                    });
                                });
                            }

                            // Fetch dynamic products for missing items
                            setCartItems(prev => {
                                const missing = prev.filter(it => !it.product_name && !it.name);
                                if (missing.length > 0) {
                                    Promise.all([
                                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`).then(r => r.ok ? r.json() : null).catch(() => null),
                                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/premium/products`).then(r => r.ok ? r.json() : null).catch(() => null)
                                    ]).then(([allProds, premiumProds]) => {
                                        let pool = [];
                                        if (allProds && Array.isArray(allProds.data)) pool = [...pool, ...allProds.data];
                                        else if (allProds && Array.isArray(allProds.products)) pool = [...pool, ...allProds.products];
                                        else if (Array.isArray(allProds)) pool = [...pool, ...allProds];

                                        if (premiumProds && Array.isArray(premiumProds.data)) pool = [...pool, ...premiumProds.data];
                                        else if (premiumProds && Array.isArray(premiumProds.products)) pool = [...pool, ...premiumProds.products];
                                        else if (Array.isArray(premiumProds)) pool = [...pool, ...premiumProds];

                                        if (pool.length > 0) {
                                            setCartItems(curr => curr.map(item => {
                                                if (item.product_name || item.name) return item;
                                                const pId = item.product_id || item.id;
                                                const f = pool.find(p => String(p.id) === String(pId));
                                                if (f) {
                                                    return {
                                                        ...item,
                                                        product_name: item.product_name || item.name || f.name || f.title,
                                                        image_path: item.image_path || item.image || f.image_path || f.image,
                                                        price: item.price || f.price
                                                    };
                                                }
                                                return item;
                                            }));
                                        }
                                    }).catch(e => console.error(e));
                                }
                                return prev;
                            });
                        } catch (e) { console.error("Checkout enrichment error:", e); }
                    };
                    enrichItems(parsedItems);
                    // --- ENRICHMENT END ---

                    // TODO: Server-side cart cleanup will be added when remove API endpoint is provided

                    // Filter for UI
                    const filteredItems = parsedItems.filter(item => !isItemRemoved(item));
                    const savedQty = getSavedQuantities();
                    const itemsWithCorrectQty = filteredItems.map(item => {
                        const exactKey = getItemKey(item);
                        const apiQty = Number(item.quantity);
                        const pId = String(item.product_id || item.id || '');

                        // Find any saved quantity for this product (handles case where API drops variant ID)
                        const matchingKey = Object.keys(savedQty).find(k => k === exactKey || k.startsWith(`${pId}_`));

                        // 1. Priority: User's manual overrides
                        if (matchingKey && savedQty[matchingKey] !== undefined) {
                            return { ...item, quantity: savedQty[matchingKey] };
                        }

                        // 2. Trust the API if valid
                        if (!isNaN(apiQty) && apiQty > 0) {
                            return { ...item, quantity: apiQty };
                        }

                        // 3. Fallback
                        return { ...item, quantity: 1 };
                    });

                    setCartItems(itemsWithCorrectQty);
                }
            } catch (err) {
                console.error("Cart fetch error:", err);
            } finally {
                setIsFetchingCart(false);
            }
        };


        const fetchSavedAddresses = async () => {
            try {
                const data = await apiClient.get("/api/auth/addresses");
                const list = data.addresses || data.data || (Array.isArray(data) ? data : []);
                setSavedAddresses(list);

                if (list.length > 0) {
                    const defaultAddr = list.find(a => a.isDefault || a.is_default) || list[0];
                    setSelectedAddressId(defaultAddr._id || defaultAddr.id);
                    setIsAddingNewAddress(false);
                } else {
                    setIsAddingNewAddress(true);
                }
            } catch (err) {
                console.error("Address fetch error:", err);
                setIsAddingNewAddress(true);
            } finally {
                setIsFetchingAddresses(false);
            }
        };

        const loadUserData = () => {
            try {
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user.first_name || user.name) {
                        setFormData(prev => ({
                            ...prev,
                            first_name: user.first_name || user.name.split(' ')[0] || "",
                            last_name: user.last_name || user.name.split(' ').slice(1).join(' ') || "",
                            email: user.email || ""
                        }));
                    }
                }
            } catch (e) { }
        };

        fetchCart();
        fetchSavedAddresses();
        loadUserData();
    }, [router]);

    const validateField = (name, value) => {
        let error = "";
        const stringValue = value ? String(value).trim() : "";
        const optionalFields = ["address2", "landmark", "save_address"];

        // Required Check
        if (!stringValue && !optionalFields.includes(name)) {
            const fieldLabel = name.replace(/_/g, ' ').replace(/\d/g, '').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return `${fieldLabel} is required`;
        }

        if (stringValue) {
            if (name === "first_name" || name === "last_name" || name === "city" || name === "state") {
                if (stringValue.length < 2) {
                    error = "Must be at least 2 characters";
                } else if (!/^[A-Za-z\s.]+$/.test(stringValue)) {
                    error = "Only alphabets are allowed";
                }
            } else if (name === "phone") {
                // Simplified 10-digit phone number validation
                if (!/^\d{10}$/.test(stringValue)) {
                    error = "Please enter a valid 10-digit mobile number";
                }
            } else if (name === "zipcode") {
                // Indian Pincode: 6 digits
                if (!/^\d{6}$/.test(stringValue)) {
                    error = "Valid 6-digit zipcode required";
                }
            } else if (name === "address1") {
                if (stringValue.length < 5) {
                    error = "Please provide a more complete address (min 5 chars)";
                }
            }
        }
        return error;
    };

    const validate = () => {
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();

        if (isAddingNewAddress) {
            if (!validate()) return;

            setIsLoading(true);
            try {
                const addressPayload = {
                    title: formData.first_name + " " + formData.last_name,
                    street: formData.address1 + (formData.address2 ? ", " + formData.address2 : "") + (formData.landmark ? ", " + formData.landmark : ""),
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipcode,
                    country: formData.country || "India",
                    mobile: formData.phone,
                    isDefault: formData.save_address || false
                };

                let addressData;
                let newAddrId = null;

                if (isEditingAddress && selectedAddressId) {
                    addressData = await apiClient.put(`/api/auth/addresses/${selectedAddressId}`, addressPayload);
                    newAddrId = selectedAddressId;
                    setStatus({ type: "success", message: "Address updated successfully." });
                } else {
                    addressData = await apiClient.post("/api/auth/addresses", addressPayload);
                    if (addressData) {
                        newAddrId = addressData.address?._id || addressData.data?._id || addressData._id || addressData.id;
                    }
                    setStatus({ type: "success", message: "Address saved successfully." });
                }

                // Refresh addresses
                const fetchList = await apiClient.get("/api/auth/addresses");
                const list = fetchList.addresses || fetchList.data || (Array.isArray(fetchList) ? fetchList : []);
                setSavedAddresses(list);

                if (!newAddrId && list.length > 0) {
                    const matched = list.find(a => a.street === addressPayload.street) || list[list.length - 1];
                    newAddrId = matched?._id || matched?.id;
                }

                if (newAddrId) setSelectedAddressId(newAddrId);
                setIsAddingNewAddress(false);
                setIsEditingAddress(false);

                // Clear status after 3 seconds
                setTimeout(() => setStatus({ type: "", message: "" }), 3000);
            } catch (err) {
                console.error("Address API error:", err);
                setStatus({ type: "error", message: err.message || "Failed to save address." });
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (!isAddingNewAddress && !selectedAddressId) {
            setStatus({ type: "error", message: "Please select a shipping address." });
            return;
        }

        setActiveStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditAddress = (e, addr) => {
        e.stopPropagation();
        setFormData({
            first_name: addr.title ? addr.title.split(' ')[0] : (addr.first_name || ""),
            last_name: addr.title ? addr.title.split(' ').slice(1).join(' ') : (addr.last_name || ""),
            country: addr.country || "India",
            address1: addr.street || addr.address1 || "",
            address2: addr.address2 || "",
            landmark: addr.landmark || "",
            phone: addr.mobile || addr.phone || "",
            city: addr.city || "",
            state: addr.state || "",
            zipcode: addr.zipCode || addr.zipcode || "",
            save_address: addr.isDefault || false
        });
        setSelectedAddressId(addr._id || addr.id);
        setIsEditingAddress(true);
        setIsAddingNewAddress(true);
    };

    const handleDeleteAddress = (e, id) => {
        e.stopPropagation();
        setDeleteAddressId(id);
    };

    const confirmDeleteAddress = async () => {
        if (!deleteAddressId) return;
        try {
            await apiClient.delete(`/api/auth/addresses/${deleteAddressId}`);
            setSavedAddresses(prev => prev.filter(a => String(a._id || a.id) !== String(deleteAddressId)));
            if (String(selectedAddressId) === String(deleteAddressId)) {
                setSelectedAddressId(null);
            }
            setDeleteAddressId(null);
        } catch (error) {
            console.error("Failed to delete address:", error);
            setStatus({ type: "error", message: error.message || "Failed to delete address" });
        }
    };

    const handlePlaceOrder = async () => {
        setIsLoading(true);
        setStatus({ type: "", message: "" });

        try {
            let finalAddressId = selectedAddressId;

            // --- EXTREME PRE-ORDER CLEANUP ---
            console.log("🚀 Starting Extreme Pre-Order Cleanup...");

            let userId = "1";
            try {
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    const userData = JSON.parse(userStr);
                    userId = userData.id || userData.user_id || userData.userid || "1";
                }
            } catch (e) { }

            // --- DEEP AUDIT CLEANUP & SYNC ---
            try {
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    const userData = JSON.parse(userStr);
                    userId = userData.id || userData.user_id || userData.userid || userData.ID || "";
                }
            } catch (e) { }

            console.log("🔍 Deep Audit: User ID detected as:", userId);

            try {
                // 1. Fetch current server state to identify exactly what to purge
                const cartData = await apiClient.get("/api/cart");
                const serverItems = cartData.cart_items || cartData.cart?.items || cartData.items || [];

                // Identify items that are NOT in our current bag to purge them
                const itemsToPurge = serverItems.filter(sItem => {
                    const sPId = String(sItem.product_id || sItem.id || "");
                    return !cartItems.some(cItem => String(cItem.product_id || cItem.id) === sPId);
                });

                if (itemsToPurge.length > 0) {
                    console.log(`🗑️ Purging ${itemsToPurge.length} unauthorized items from server...`);
                    await Promise.all(itemsToPurge.map(it => {
                        const itemId = it.id || it.cart_item_id || it.row_id || it.cart_id;
                        return apiClient.post(`/api/cart/remove`, { cart_item_id: itemId, product_id: it.product_id, user_id: String(userId) }).catch(() => null);
                    }));
                }
            } catch (e) { }

            // 2. Sync Bag items with backend-validated IDs
            const syncedItems = [];
            for (const item of cartItems) {
                const pId = Number(item.product_id || item.id);
                const slug = item.slug || item.product?.slug;
                let vId = Number(item.variant_id || item.variation_id || item._matchedVariation?.id || pId);
                const qty = Number(item.quantity) || 1;

                // Try to get real variant ID, if not found, use null (better than "1" for some backends)
                if (!vId || vId === 1 || vId === "1") {
                    if (slug) {
                        try {
                            const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${slug}`);
                            if (pRes.ok) {
                                const pData = await pRes.json();
                                const variants = pData?.product?.variations || pData?.product?.variants || [];
                                vId = variants.length > 0 ? Number(variants[0].id) : null;
                            }
                        } catch (e) { vId = null; }
                    }
                }

                syncedItems.push({ product_id: pId, variant_id: vId, quantity: qty });

                try {
                    await apiClient.post("/api/cart/update", { product_id: pId, variant_id: vId, variation_id: vId, quantity: qty, user_id: String(userId) }, { silent: true }).catch(() => null);
                } catch (e) { }
            }

            // Extract the FULL address object to send to the backend
            let fullAddressObj = null;
            if (isAddingNewAddress) {
                fullAddressObj = {
                    title: formData.first_name + " " + formData.last_name,
                    street: formData.address1 + (formData.address2 ? ", " + formData.address2 : "") + (formData.landmark ? ", " + formData.landmark : ""),
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipcode,
                    country: formData.country || "India",
                    mobile: formData.phone
                };
            } else {
                const foundAddress = savedAddresses.find(a => String(a._id || a.id) === String(finalAddressId));
                if (foundAddress) {
                    fullAddressObj = { ...foundAddress };
                    // Clean up mongo specific fields just in case backend expects a clean object
                    delete fullAddressObj._id;
                    delete fullAddressObj.id;
                    delete fullAddressObj.createdAt;
                    delete fullAddressObj.updatedAt;
                    delete fullAddressObj.__v;
                    delete fullAddressObj.user;
                }
            }

            if (!fullAddressObj) {
                setStatus({ type: "error", message: "Shipping Address is missing or invalid. Please add a valid address." });
                setIsLoading(false);
                return;
            }

            const finalPaymentMethod = (paymentMethod === 'online' && totalPrice > 0) ? "Razorpay" : "COD";
            const checkoutPayload = {
                shippingAddress: fullAddressObj,
                paymentMethod: finalPaymentMethod,
                totalAmount: totalPrice,
                discountAmount: discountAmount,
                subtotal: subtotalPrice,
                currency: currency
            };

            if (appliedCoupon && appliedCoupon.code) {
                checkoutPayload.couponCode = appliedCoupon.code;
            }

            console.log("📦 Sending FINAL Injection Payload:", checkoutPayload);

            // Both COD and Razorpay now start by calling the checkout endpoint
            let orderData;
            orderData = await apiClient.post("/api/orders/checkout", checkoutPayload);

            console.log("Checkout API Response:", orderData);

            if (!orderData) {
                throw new Error("Checkout failed. No response from server.");
            }

            let backendTotal = orderData.totalAmount || orderData.total_amount || orderData.total || orderData.amount || orderData.totalPrice || orderData.total_price;
            let parsedBackendTotal = 0;
            if (backendTotal) {
                parsedBackendTotal = Number(backendTotal);
                // If backend total is extremely large compared to frontend, it's likely in paise
                if (parsedBackendTotal > totalPrice * 50) {
                    parsedBackendTotal = parsedBackendTotal / 100;
                }

                // Log mismatch for debugging but don't block checkout
                // Backend is the authoritative source for final amount
                if (parsedBackendTotal > totalPrice + 50) {
                    console.warn(`[Price Notice] Frontend estimated ₹${totalPrice}, Backend charged ₹${parsedBackendTotal}. Proceeding with backend amount.`);
                }
            }

            if (finalPaymentMethod === "Razorpay") {
                // Online Payment Flow (Razorpay)
                try {
                    // Extract MongoDB 24-character Hex ObjectId
                    const isMongoId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
                    let mongoOrderId = null;

                    const findMongoId = (obj) => {
                        if (!obj || typeof obj !== 'object') return null;
                        for (const key of Object.keys(obj)) {
                            const val = obj[key];
                            if (isMongoId(val) && (key === '_id' || key === 'id' || key === 'orderId' || key === 'order_id')) return val;
                            if (typeof val === 'object' && val !== null) {
                                const found = findMongoId(val);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    mongoOrderId = findMongoId(orderData);

                    // Extract Razorpay Order ID (starts with order_)
                    const isRzpId = (val) => typeof val === 'string' && val.startsWith('order_');
                    let rzpOrderId = null;

                    if (!mongoOrderId) {
                        throw new Error(`Failed to create order: Missing order ID from server. Response: ${JSON.stringify(orderData)}`);
                    }

                    // ALWAYS call initiate endpoint to create Razorpay Order
                    console.log("Initiating payment for Order ID:", mongoOrderId);
                    const initiateData = await apiClient.post("/api/payments/initiate", {
                        orderId: mongoOrderId
                    });

                    console.log("Initiate Payment Response:", initiateData);

                    // Find Razorpay ID from initiateData
                    const findRzpId = (obj) => {
                        if (!obj) return null;
                        if (typeof obj === 'string' && obj.startsWith('order_')) return obj;
                        if (typeof obj === 'object') {
                            if (obj.gatewayOrderId && String(obj.gatewayOrderId).startsWith('order_')) return obj.gatewayOrderId;
                            if (obj.razorpayOrderId) return obj.razorpayOrderId;
                            if (obj.id && typeof obj.id === 'string' && obj.id.startsWith('order_')) return obj.id;
                            if (obj.razorpay_order_id) return obj.razorpay_order_id;
                            if (obj.order_id && String(obj.order_id).startsWith('order_')) return obj.order_id;
                            for (let key in obj) {
                                if (typeof obj[key] === 'object' || (typeof obj[key] === 'string' && obj[key].startsWith('order_'))) {
                                    const found = findRzpId(obj[key]);
                                    if (found) return found;
                                }
                            }
                        }
                        return null;
                    };

                    rzpOrderId = findRzpId(initiateData);

                    if (!rzpOrderId) {
                        throw new Error(`Failed to initiate payment. Missing Razorpay order_id. Server returned: ${JSON.stringify(orderData)}`);
                    }

                    // Extract Razorpay Key — backend returns it inside initiateData.data.key
                    let rzpKey = initiateData?.data?.key
                        || orderData.key || orderData.razorpayKey || orderData.keyId || orderData.key_id || orderData.razorpay_key;

                    if (!rzpKey || typeof rzpKey !== 'string' || (!rzpKey.startsWith('rzp_test_') && !rzpKey.startsWith('rzp_live_'))) {
                        try {
                            const keyRes = await apiClient.get("/api/payments/key").catch(() => null);
                            if (keyRes) {
                                let fetchedKey = keyRes.key || keyRes.razorpayKey || keyRes.keyId || keyRes.data?.key || (typeof keyRes === 'string' ? keyRes : null);
                                if (typeof fetchedKey === 'string' && (fetchedKey.startsWith('rzp_test_') || fetchedKey.startsWith('rzp_live_'))) {
                                    rzpKey = fetchedKey;
                                }
                            }
                        } catch (e) { }
                    }

                    if (!rzpKey || typeof rzpKey !== 'string' || (!rzpKey.startsWith('rzp_test_') && !rzpKey.startsWith('rzp_live_'))) {
                        rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TMoncYmRmLC6OP";
                    }

                    // Strict amount parsing: Use backend total if available to avoid Razorpay amount mismatch, fallback to frontend
                    let rzpAmount = Math.round((parsedBackendTotal || totalPrice) * 100);

                    // Clean Prefill data
                    const prefillObj = {};
                    const fullName = (formData.first_name + " " + formData.last_name).trim();
                    if (fullName) prefillObj.name = fullName;
                    if (formData.email && formData.email.includes("@")) prefillObj.email = formData.email.trim();
                    if (formData.phone) prefillObj.contact = String(formData.phone).replace(/[^\d]/g, '').slice(-10);

                    // 2. Open Razorpay Modal
                    const options = {
                        key: rzpKey,
                        amount: rzpAmount,
                        currency: orderData.currency || orderData.order?.currency || currency,
                        name: "Sri Divyam",
                        description: "Divine Devotional Order",
                        image: "/logo.png",
                        order_id: rzpOrderId,
                        handler: async function (response) {
                            try {
                                // 3. Verify Payment with exact payload structure requested
                                const verifyData = await apiClient.post("/api/payments/verify", {
                                    orderId: mongoOrderId,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature
                                });

                                if (verifyData && (verifyData.success !== false)) {
                                    onCheckoutSuccess();
                                } else {
                                    throw new Error(verifyData?.message || "Payment verification failed on server");
                                }
                            } catch (verifyErr) {
                                console.error("Verification error:", verifyErr);
                                setStatus({ type: "error", message: verifyErr.message || "Payment successful but verification failed. Please contact support." });
                                setIsLoading(false);
                            }
                        },
                        prefill: prefillObj,
                        theme: {
                            color: "#135B42"
                        },
                        modal: {
                            ondismiss: function () {
                                setIsLoading(false);
                            }
                        }
                    };

                    // Ensure Razorpay SDK script is loaded
                    if (typeof window !== "undefined" && !window.Razorpay) {
                        await new Promise((resolve) => {
                            const script = document.createElement("script");
                            script.src = "https://checkout.razorpay.com/v1/checkout.js";
                            script.async = true;
                            script.onload = () => resolve(true);
                            script.onerror = () => resolve(false);
                            document.body.appendChild(script);
                        });
                    }

                    if (typeof window === "undefined" || !window.Razorpay) {
                        throw new Error("Razorpay payment gateway failed to load. Please check your connection and retry.");
                    }

                    const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', function (response) {
                        console.error("Payment failed:", response.error);
                        setStatus({ type: "error", message: response.error?.description || "Payment failed. Please try again." });
                        setIsLoading(false);
                    });

                    rzp.open();

                } catch (paymentErr) {
                    throw paymentErr;
                }
            } else {
                // COD Flow
                if (orderData) {
                    onCheckoutSuccess();
                } else {
                    throw new Error(orderData?.message || orderData?.error || "Checkout failed");
                }
            }
        } catch (error) {
            console.error("Checkout process error:", error);
            setStatus({ type: "error", message: error.message || "An unexpected error occurred during checkout." });
        } finally {
            setIsLoading(false);
        }
    };

    const onCheckoutSuccess = () => {
        console.log("🎊 Order Success! Executing Nuclear Cart Purge...");

        // 1. CLEAR LOCAL STORAGE
        localStorage.removeItem("shri_divyam_cart_quantities");

        // 2. BLACKLIST PURCHASED ITEMS (Frontend Guard)
        try {
            const removedStr = localStorage.getItem("shri_divyam_removed_items") || "[]";
            const removedItems = JSON.parse(removedStr);
            cartItems.forEach(it => {
                const pId = it.product_id || it.id;
                const vId = it.variant_id || it.variation_id || "";
                const key = `${pId}-${vId}`;
                if (!removedItems.includes(key)) removedItems.push(key);
            });
            localStorage.setItem("shri_divyam_removed_items", JSON.stringify(removedItems));
        } catch (e) { }

        // 3. FORCE PURGE SERVER CART (Using DELETE /api/cart/{id})
        const purgeTasks = cartItems.map(async (it) => {
            const itemId = it.id || it.cart_item_id || it.row_id || it.cart_id;
            if (!itemId) return;
            try {
                await apiClient.delete(`/api/cart/${itemId}`, { silent: true }).catch(() => null);
            } catch (e) { }
        });

        Promise.all(purgeTasks.slice(0, 5));

        setStatus({ type: "success", message: "Order placed successfully!" });
        setTimeout(() => router.push("/order-success"), 1500);
    };

    // Get raw effective selling price (charged price)
    const getRawPrice = (item) => resolveItemPricing(item).salePrice;
    const getRawActualPrice = (item) => resolveItemPricing(item).actualPrice;

    const totalItems = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const subtotalPrice = cartItems.reduce((sum, item) => sum + (getRawPrice(item) * (Number(item.quantity) || 1)), 0);
    const totalActualAmount = cartItems.reduce((sum, item) => sum + (getRawActualPrice(item) * (Number(item.quantity) || 1)), 0);
    const totalSavings = Math.max(0, totalActualAmount - subtotalPrice);
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount || 0 : 0;
    const baseTotal = Math.max(0, subtotalPrice - discountAmount);

    // Dynamic settings values (already fetched as regional: domestic/international)
    const shippingThreshold = storeSettings?.freeShippingThreshold ?? 399;
    const shippingChargeAmt = storeSettings?.shippingCharge ?? 150;
    const codChargeAmt = storeSettings?.codCharge ?? 100;
    // GST is already baked into product prices (inclusive) — backend extracts it, not adds it
    // DO NOT add GST again on top of price
    const onlineDiscountPct = storeSettings?.onlineDiscountPercentage ?? 5;

    const onlineDiscountAmount = paymentMethod === 'online' ? Math.round((baseTotal * onlineDiscountPct / 100) * 100) / 100 : 0;
    const codCharge = paymentMethod === 'cod' ? codChargeAmt : 0;
    const shippingCost = baseTotal - onlineDiscountAmount + codCharge >= shippingThreshold ? 0 : shippingChargeAmt;

    const totalPrice = Math.round((baseTotal - onlineDiscountAmount + codCharge + shippingCost) * 100) / 100;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponStatus({ type: "error", message: "Please enter a coupon code." });
            return;
        }

        // Frontend min-purchase validation
        const knownCpn = availableCoupons.find(c => String(c.code).toLowerCase() === String(couponCode).toLowerCase());
        if (knownCpn) {
            // Try to find the minimum purchase amount from all possible field names
            const minPurchase = Number(
                knownCpn.min_purchase || knownCpn.minPurchase ||
                knownCpn.min_amount || knownCpn.minAmount ||
                knownCpn.minimum_purchase || knownCpn.minimumPurchase ||
                knownCpn.minimum_amount || knownCpn.minimumAmount ||
                knownCpn.min_order_amount || knownCpn.minOrderAmount ||
                knownCpn.min_cart_value || knownCpn.minCartValue ||
                knownCpn.minOrderValue || knownCpn.min_order_value ||
                knownCpn.min_spend || knownCpn.minSpend || 0
            );

            if (minPurchase > 0 && subtotalPrice < minPurchase) {
                setCouponStatus({ type: "error", message: `Please add items worth ₹${minPurchase - subtotalPrice} more to apply this coupon (Minimum order: ₹${minPurchase}).` });
                return;
            }

            // Also check for expiry if frontend has it
            const expiryDate = knownCpn.expiry_date || knownCpn.expiryDate || knownCpn.expires_at || knownCpn.expiresAt || knownCpn.valid_until || knownCpn.validUntil;
            if (expiryDate && new Date(expiryDate) < new Date()) {
                setCouponStatus({ type: "error", message: "This coupon has expired." });
                return;
            }
        }

        setIsApplyingCoupon(true);
        setCouponStatus({ type: "", message: "" });

        try {
            const data = await apiClient.post("/api/coupons/apply", {
                code: couponCode,
                orderAmount: subtotalPrice
            });

            if (data && (data.success !== false)) {
                let calcDiscount = 0;
                const cpn = data.coupon || data.data || data;

                // 1. If API explicitly provides the calculated discount amount
                if (data.discount_amount !== undefined) {
                    calcDiscount = Number(data.discount_amount);
                } else if (data.discountAmount !== undefined) {
                    calcDiscount = Number(data.discountAmount);
                }
                // 2. Try to calculate from coupon object
                else if (cpn) {
                    const type = String(cpn.discount_type || cpn.discountType || cpn.type || '').toLowerCase();
                    const val = Number(cpn.discount_value || cpn.discountValue || cpn.discount || cpn.amount || 0);

                    if (type.includes('percent') || type === 'pct') {
                        calcDiscount = (subtotalPrice * val) / 100;
                    } else if (val > 0) {
                        // flat amount
                        calcDiscount = val;
                    }
                }

                // Fallback: if somehow it's still 0 but we know the user clicked apply on a known coupon
                if (calcDiscount === 0 && knownCpn) {
                    const type = String(knownCpn.discount_type || knownCpn.discountType || '').toLowerCase();
                    const val = Number(knownCpn.discount_value || knownCpn.discountValue || 0);
                    if (type.includes('percent') || type === 'pct') {
                        calcDiscount = (subtotalPrice * val) / 100;
                    } else if (val > 0) {
                        calcDiscount = val;
                    }
                }

                // Prevent discount from exceeding the subtotal
                if (calcDiscount > subtotalPrice) {
                    calcDiscount = subtotalPrice;
                }

                if (calcDiscount > 0) {
                    setAppliedCoupon({
                        code: couponCode,
                        discountAmount: Number(calcDiscount)
                    });
                    setCouponStatus({ type: "success", message: `Coupon applied successfully!` });
                } else {
                    setCouponStatus({ type: "error", message: "This coupon is not valid for the current order amount." });
                    setAppliedCoupon(null);
                }
            } else {
                setCouponStatus({ type: "error", message: data.message || data.error || "Invalid coupon code." });
                setAppliedCoupon(null);
            }
        } catch (error) {
            let errMsg = error.message || "Failed to apply coupon. Please try again.";

            // Clean up the ugly backend error message
            if (errMsg.includes("Coupon is either expired, inactive, or your cart total is below the minimum limit")) {
                errMsg = "Your cart total is below the minimum amount required for this coupon, or the coupon has expired.";
            }

            setCouponStatus({ type: "error", message: errMsg });
            setAppliedCoupon(null);
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
        setCouponStatus({ type: "", message: "" });
    };

    return (
        <main className="bg-white min-h-screen flex flex-col font-primary">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <Header />

            <div className="flex-1 bg-[#F9F7F5] py-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-[1240px] mx-auto">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gray-400 mb-8">
                        <Link href="/cart" className="hover:text-[#7A1F3D] transition">Cart</Link>
                        <span>/</span>
                        <span className="text-[#303030] font-bold">Checkout</span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-12 items-start w-full max-w-full">

                        {/* LEFT COLUMN */}
                        <div className="w-full min-w-0 max-w-full overflow-hidden">
                            {activeStep === 1 && (
                                <div className="bg-white border border-[#E8DDD4] rounded-lg shadow-sm overflow-hidden">
                                    {/* Stepper */}
                                    <div className="px-6 py-6 sm:px-8 sm:py-6 border-b border-[#E8DDD4]">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-4 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
                                            <div className="flex justify-between items-center sm:inline-flex w-full sm:w-auto">
                                                <span className="font-bold text-[#0f5132] text-[20px] sm:text-[14px]">1. Delivery Address</span>
                                                <span className="text-gray-300 sm:ml-4 text-[20px] sm:text-[14px]">&rarr;</span>
                                            </div>
                                            <div className="flex justify-between items-center sm:inline-flex w-full sm:w-auto">
                                                <span className="text-[#9ca3af] text-[20px] sm:text-[14px]">2. Payment & Promos</span>
                                                <span className="text-gray-300 sm:ml-4 text-[20px] sm:text-[14px]">&rarr;</span>
                                            </div>
                                            <div className="flex justify-between items-center sm:inline-flex w-full sm:w-auto">
                                                <span className="text-[#9ca3af] text-[20px] sm:text-[14px]">3. Payment Capture</span>
                                                <span className="text-gray-300 sm:ml-4 text-[20px] sm:text-[14px]">&rarr;</span>
                                            </div>
                                            <div className="flex justify-between items-center sm:inline-flex w-full sm:w-auto">
                                                <span className="text-[#9ca3af] text-[20px] sm:text-[14px]">4. Confirmation</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 sm:p-8">
                                        <h2 className="text-[28px] sm:text-[24px] font-medium text-[#0f5132] mb-6 leading-[1.2]">Select Shipping Address</h2>

                                        {isFetchingAddresses ? (
                                            <div className="flex justify-center items-center py-12">
                                                <Loader2 className="animate-spin text-[#0f5132]" size={32} />
                                            </div>
                                        ) : (
                                            <form onSubmit={handleAddressSubmit} className="space-y-6">
                                                {!isAddingNewAddress ? (
                                                    <div className="space-y-4">
                                                        {savedAddresses.map((addr) => {
                                                            const addrId = addr._id || addr.id;
                                                            const isSelected = selectedAddressId === addrId;
                                                            return (
                                                                <div
                                                                    key={addrId}
                                                                    onClick={() => setSelectedAddressId(addrId)}
                                                                    className={`p-5 rounded-sm cursor-pointer transition-all border ${isSelected ? "border-[#0f5132] bg-[#f0fdf4]" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                                                                >
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="mt-1 shrink-0">
                                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-[#0f5132]" : "border-gray-400"}`}>
                                                                                {isSelected && <div className="w-2 h-2 rounded-full bg-[#0f5132]"></div>}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="flex items-center gap-1.5 font-bold text-[#1f2937] text-sm">
                                                                                        <MapPin size={14} /> {addr.title || `${addr.first_name || ''} ${addr.last_name || ''}`.trim()}
                                                                                    </div>
                                                                                    {addr.isDefault || addr.is_default ? (
                                                                                        <span className="px-2 py-0.5 bg-[#0f5132] text-white text-[10px] font-bold tracking-wide rounded">PRIMARY</span>
                                                                                    ) : null}
                                                                                </div>
                                                                                <div className="flex items-center gap-3">
                                                                                    <button type="button" onClick={(e) => handleEditAddress(e, addr)} className="text-gray-400 hover:text-[#135B42] transition">
                                                                                        <PenSquare size={14} />
                                                                                    </button>
                                                                                    <button type="button" onClick={(e) => handleDeleteAddress(e, addr._id || addr.id)} className="text-gray-400 hover:text-red-500 transition">
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <p className="text-[13px] text-gray-500 leading-relaxed ml-[22px]">
                                                                                {addr.street || addr.address1} <br />
                                                                                {addr.city}, {addr.state} - {addr.zipCode || addr.zipcode} <br />
                                                                                {addr.country || "India"} <br />
                                                                                <span className="mt-1 block">Phone: {addr.mobile || addr.phone}</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Add New Address Button */}
                                                        <div
                                                            onClick={() => {
                                                                setFormData({
                                                                    first_name: "", last_name: "", country: "India", address1: "", address2: "", landmark: "", phone: "", city: "", state: "", zipcode: "", save_address: true
                                                                });
                                                                setIsEditingAddress(false);
                                                                setIsAddingNewAddress(true);
                                                            }}
                                                            className="p-5 border border-dashed border-[#0f5132] rounded-sm cursor-pointer hover:bg-[#f0fdf4] transition-colors flex items-center justify-center gap-2 text-[#0f5132] font-bold text-[14px]"
                                                        >
                                                            <Plus size={16} strokeWidth={3} /> Add New Shipping Address
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                                            <h3 className="text-lg font-medium text-[#0f5132]">{isEditingAddress ? "Edit Shipping Address" : "Add New Shipping Address"}</h3>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setIsAddingNewAddress(false); setIsEditingAddress(false); }}
                                                                className="flex items-center gap-2 text-[12px] font-bold text-gray-500 hover:text-[#0f5132]"
                                                            >
                                                                <ArrowLeft size={14} /> Back to saved
                                                            </button>
                                                        </div>

                                                        {/* Form Fields (Kept same as original, just updating wrapper) */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">First Name <span className="text-red-500">*</span></label>
                                                                <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className={`w-full border p-3 rounded text-[14px] outline-none transition ${errors.first_name ? 'border-red-500 bg-red-50 focus:border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#0f5132]'}`} placeholder="Enter first name" />
                                                                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Last Name <span className="text-red-500">*</span></label>
                                                                <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className={`w-full border p-3 rounded text-[14px] outline-none transition ${errors.last_name ? 'border-red-500 bg-red-50 focus:border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#0f5132]'}`} placeholder="Enter last name" />
                                                                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Address Line 1 <span className="text-red-500">*</span></label>
                                                                <input type="text" value={formData.address1} onChange={(e) => setFormData({ ...formData, address1: e.target.value })} className={`w-full border p-3 rounded text-[14px] outline-none transition ${errors.address1 ? 'border-red-500 bg-red-50 focus:border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#0f5132]'}`} placeholder="House No, Building Name, Street" />
                                                                {errors.address1 && <p className="text-red-500 text-xs mt-1">{errors.address1}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Town / City <span className="text-red-500">*</span></label>
                                                                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className={`w-full border p-3 rounded text-[14px] outline-none transition ${errors.city ? 'border-red-500 bg-red-50 focus:border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#0f5132]'}`} placeholder="Enter city" />
                                                                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">State <span className="text-red-500">*</span></label>
                                                                <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className={`w-full border p-3 rounded text-[14px] outline-none transition ${errors.state ? 'border-red-500 bg-red-50 focus:border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#0f5132]'}`} placeholder="Enter state" />
                                                                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Pincode <span className="text-red-500">*</span></label>
                                                                <input type="text" value={formData.zipcode} onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })} className={`w-full border p-3 rounded text-[14px] outline-none transition ${errors.zipcode ? 'border-red-500 bg-red-50 focus:border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#0f5132]'}`} placeholder="6 digit pincode" maxLength={6} />
                                                                {errors.zipcode && <p className="text-red-500 text-xs mt-1">{errors.zipcode}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Phone Number <span className="text-red-500">*</span></label>
                                                                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`w-full border p-3 rounded text-[14px] outline-none transition ${errors.phone ? 'border-red-500 bg-red-50 focus:border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#0f5132]'}`} placeholder="10 digit mobile number" maxLength={10} />
                                                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Footer Actions */}
                                                <div className="pt-8 mt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                                                    <button type="button" onClick={() => router.push("/cart")} className="flex items-center gap-2 text-gray-500 hover:text-[#0f5132] text-[14px] font-medium transition-colors">
                                                        <ArrowLeft size={16} /> Back to Cart
                                                    </button>

                                                    <button type="submit" disabled={isLoading} className="w-full sm:w-auto px-8 py-3.5 bg-[#0f5132] text-white text-[14px] font-bold tracking-wide rounded hover:bg-[#0c4128] transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center gap-2">
                                                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                                                        {isAddingNewAddress ? (isEditingAddress ? "Update Address" : "Save Address") : "Continue to Payment"}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeStep === 2 && (
                                <div className="bg-white border border-[#E8DDD4] p-6 sm:p-8 shadow-sm rounded-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E8DDD4]">
                                        <CreditCard className="text-[#135B42]" size={24} />
                                        <h2 className="text-xl font-playfair font-bold text-[#135B42]">Payment Method</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <label className={`block border rounded-md p-4 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-[#135B42] bg-[#FDF8F3] ring-1 ring-[#135B42]' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-[#135B42] accent-[#135B42]" />
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-[#303030] text-sm">Pay Online (Razorpay)</h3>
                                                    <p className="text-xs text-gray-500 mt-1">Pay securely via UPI, Credit/Debit Card, or Netbanking.</p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`block border rounded-md p-4 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#135B42] bg-[#FDF8F3] ring-1 ring-[#135B42]' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-[#135B42] accent-[#135B42]" />
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-[#303030] text-sm">Cash on Delivery (COD)</h3>
                                                    <p className="text-xs text-gray-500 mt-1">Pay with cash upon delivery.</p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="pt-8 flex justify-between items-center">
                                        <button onClick={() => setActiveStep(1)} className="text-sm font-semibold text-gray-500 hover:text-[#135B42] transition-colors flex items-center gap-2">
                                            <ArrowLeft size={16} /> Back to Shipping
                                        </button>
                                        <button onClick={handlePlaceOrder} disabled={isLoading} className="px-8 py-3 bg-[#135B42] text-white text-[13px] font-semibold rounded-sm hover:bg-[#0c402d] transition-colors shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                            {isLoading ? "Processing..." : (paymentMethod === 'online' ? "Pay Securely" : "Place Order")}
                                        </button>
                                    </div>

                                    {status.message && (
                                        <div className={`mt-4 p-3 rounded-md text-sm text-center ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                            {status.message}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* RIGHT: SUMMARY */}
                        <div className="xl:sticky xl:top-24 space-y-6">
                            <div className="bg-white border border-[#E8DDD4] rounded-lg p-6 sm:p-8 shadow-sm">
                                <h3 className="text-[22px] font-medium text-[#0f5132] mb-6">Order Summary</h3>

                                {/* Cart Items List */}
                                <div className="space-y-4 mb-6 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                    {cartItems.map((item, index) => {
                                        const pId = String(item.product_id || item.productId || item.product?._id || item.id || "");
                                        const productName = item.product_name || item.name || item.product?.name || item.product?.title || `Product ${pId}`;

                                        const unitSalePrice = getRawPrice(item);
                                        const unitActualPrice = getRawActualPrice(item);
                                        const quantity = Number(item.quantity || item.qty || 1);
                                        const rowSalePrice = unitSalePrice * quantity;
                                        const rowActualPrice = unitActualPrice * quantity;
                                        const size = item.size || item.variantDetails?.size || item.variant?.size || item.variation?.size || item.product_details?.size || (resolveItemPricing(item).salePrice !== resolveItemPricing(item).actualPrice ? "" : "Standard");

                                        // Try to find image
                                        let rawImage = item.image_path || item.image || item.product?.image || (item.product?.images?.[0]?.src) || (item.product?.images?.[0]) || item.image_url || item.featured_image || "/logo.png";
                                        let imageUrl = "/logo.png";

                                        if (typeof rawImage === 'string' && rawImage !== "null") {
                                            if (rawImage.startsWith("http") || rawImage.startsWith("//") || rawImage.startsWith("data:")) {
                                                imageUrl = rawImage;
                                            } else if (rawImage === '/logo.png' || rawImage === 'logo.png') {
                                                imageUrl = '/logo.png';
                                            } else {
                                                let cleanImg = rawImage.startsWith('/') ? rawImage.slice(1) : rawImage;
                                                const prefix = (cleanImg.startsWith('uploads/') || cleanImg.startsWith('storage/')) ? `${process.env.NEXT_PUBLIC_API_URL}/` : `${process.env.NEXT_PUBLIC_API_URL}/uploads/`;
                                                imageUrl = prefix + cleanImg;
                                            }
                                        }

                                        // calculate discount
                                        const hasDiscount = unitActualPrice > unitSalePrice && unitSalePrice > 0;
                                        const discountPercent = hasDiscount ? Math.round(((unitActualPrice - unitSalePrice) / unitActualPrice) * 100) : 0;

                                        return (
                                            <div key={index} className="flex gap-4 items-start pb-3 border-b border-gray-100 last:border-b-0">
                                                <div className="w-[60px] h-[60px] shrink-0 border border-gray-200 rounded overflow-hidden bg-[#FAF8F5]">
                                                    <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className="font-bold text-[#1f2937] text-[13px] line-clamp-1">{productName}</h4>
                                                        <div className="text-right shrink-0">
                                                            {/* Selling Price */}
                                                            <span className="font-bold text-[#1f2937] text-[13px] block">{formatPrice(rowSalePrice, 0)}</span>
                                                            {/* Actual MRP */}
                                                            {hasDiscount && (
                                                                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                                                                    <span className="text-[10px] text-gray-400 line-through">{formatPrice(rowActualPrice, 0)}</span>
                                                                    {discountPercent > 0 && <span className="text-[10px] font-bold text-[#047857] bg-[#E5F5ED] px-1 py-0.2 rounded">{discountPercent}% OFF</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 mt-1">
                                                        Qty: {quantity} {size && `| Size: ${size}`} {quantity > 1 && `(${formatPrice(unitSalePrice, 0)} each)`}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100 text-[13px]">
                                    {/* COUPON INPUT */}
                                    {/* COUPON INPUT */}
                                    <div className="pb-4">
                                        {availableCoupons.length > 0 && !appliedCoupon && (
                                            <div className="mb-3">
                                                <select
                                                    value={availableCoupons.some(c => c.code === couponCode) ? couponCode : ""}
                                                    onChange={(e) => setCouponCode(e.target.value)}
                                                    className="w-full border border-gray-300 rounded p-2.5 text-[13px] outline-none focus:border-[#0f5132] bg-white cursor-pointer"
                                                >
                                                    <option value="">-- Choose an available coupon --</option>
                                                    {availableCoupons.map((coupon) => {
                                                        const cpnType = String(coupon.discount_type || coupon.discountType || coupon.type || '').toLowerCase();
                                                        const cpnVal = coupon.discount_value || coupon.discountValue || coupon.discount || coupon.amount || 0;
                                                        const displayVal = (cpnType.includes('percent') || cpnType === 'pct') ? cpnVal + '%' : '₹' + cpnVal;
                                                        return (
                                                            <option key={coupon.id || coupon._id || coupon.code} value={coupon.code}>
                                                                {coupon.code} - {coupon.description || `Get ${displayVal} OFF`}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                placeholder={availableCoupons.length > 0 ? "Or enter a custom code" : "Enter coupon code"}
                                                disabled={appliedCoupon !== null}
                                                className="flex-1 border border-gray-300 rounded p-2.5 text-[13px] outline-none focus:border-[#0f5132] disabled:bg-gray-50 disabled:text-gray-400"
                                            />
                                            {appliedCoupon ? (
                                                <button onClick={handleRemoveCoupon} type="button" className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded hover:bg-gray-200 transition-colors">
                                                    Remove
                                                </button>
                                            ) : (
                                                <button id="apply-coupon-btn" onClick={handleApplyCoupon} type="button" disabled={isApplyingCoupon || !couponCode.trim()} className="px-4 py-2 bg-[#0f5132] text-white text-sm font-bold rounded hover:bg-[#0c4128] transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                                                    {isApplyingCoupon ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                                                </button>
                                            )}
                                        </div>
                                        {couponStatus.message && (
                                            <p className={`mt-2 text-xs font-medium ${couponStatus.type === "success" ? "text-[#0f5132]" : "text-red-500"}`}>
                                                {couponStatus.message}
                                            </p>
                                        )}
                                    </div>

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
                                            <span>Product Discount Savings</span>
                                            <span>-{formatPrice(totalSavings, 0)}</span>
                                        </div>
                                    )}

                                    {appliedCoupon && (
                                        <div className="flex justify-between items-center text-[#047857] font-semibold">
                                            <span>Coupon Discount ({appliedCoupon.code})</span>
                                            <span>-{formatPrice(appliedCoupon.discountAmount, 0)}</span>
                                        </div>
                                    )}

                                    {paymentMethod === 'online' && onlineDiscountAmount > 0 && (
                                        <div className="flex justify-between items-center text-[#047857] font-semibold">
                                            <span>Prepaid Online Discount ({storeSettings?.onlineDiscountPercentage ?? 5}%)</span>
                                            <span>~ -{formatPrice(onlineDiscountAmount, 0)}</span>
                                        </div>
                                    )}

                                    {storeSettings?.gstPercentage > 0 && (
                                        <div className="flex justify-between items-center text-gray-500 text-[12px]">
                                            <span>GST ({storeSettings?.gstPercentage}% — incl. in prices)</span>
                                            <span>Inclusive</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>Shipping {shippingCost === 0 ? `(Free above ${formatPrice(shippingThreshold, 0)})` : ""}</span>
                                        <span className="font-semibold text-[#1f2937]">{shippingCost === 0 ? <span className="text-[#047857] font-bold">FREE</span> : formatPrice(shippingCost, 0)}</span>
                                    </div>

                                    {paymentMethod === 'cod' && codCharge > 0 && (
                                        <div className="flex justify-between items-center text-gray-600">
                                            <span>COD Charge</span>
                                            <span className="font-semibold text-[#1f2937]">{formatPrice(codCharge, 0)}</span>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <span className="font-bold text-[#1f2937] text-[15px]">Estimated Grand Total</span>
                                        <span className="font-bold text-[#1f2937] text-2xl tracking-tight">{formatPrice(totalPrice, 0)}</span>
                                    </div>
                                </div>

                                {status.message && (
                                    <div className={`mt-6 p-4 rounded text-[13px] font-medium leading-tight flex items-start gap-3 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                        <CheckCircle size={18} className="shrink-0 mt-0.5" />
                                        <p>{status.message}</p>
                                    </div>
                                )}

                                {/* Safe Checkout Covenant */}
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-3">
                                        <ShieldCheck size={16} className="text-gray-400" />
                                        <span>Safe Checkout Covenant</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="h-6 px-2 bg-[#1434CB] text-white text-[10px] font-bold rounded flex items-center italic tracking-wider">VISA</div>
                                        <div className="h-6 px-2 bg-[#EB001B] text-white text-[10px] font-bold rounded flex items-center gap-0.5 relative overflow-hidden">
                                            <div className="w-3 h-3 rounded-full bg-[#FF5F00] mix-blend-screen relative -mr-1.5 z-10"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#F79E1B] mix-blend-screen relative -ml-1.5 z-20"></div>
                                        </div>
                                        <div className="h-6 px-2 bg-[#0079C1] text-white text-[10px] font-bold rounded flex items-center tracking-wide">AMEX</div>
                                        <div className="h-6 px-2 bg-[#003087] text-white text-[10px] font-bold rounded flex items-center italic tracking-wide">PayPal</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Delete Address Modal */}
            {deleteAddressId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-[450px] overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-[#fff1f2] px-6 py-4 flex items-center justify-between border-b border-[#ffe4e6]">
                            <h3 className="text-[#be123c] text-[17px] font-bold">Confirm Removal</h3>
                            <button onClick={() => setDeleteAddressId(null)} className="text-[#e11d48] hover:text-[#9f1239]">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 pb-8">
                            <p className="text-[#303030] text-[15px] leading-relaxed font-medium">
                                Are you sure you want to delete this address?
                            </p>
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setDeleteAddressId(null)}
                                className="px-5 py-2.5 rounded-md bg-white border border-gray-300 text-[14px] font-bold text-[#1F2937] hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteAddress}
                                className="px-5 py-2.5 rounded-md bg-[#e00000] hover:bg-[#be0000] text-white text-[14px] font-bold transition-colors shadow-sm flex items-center gap-2"
                            >
                                Delete Address
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </main>
    );
}
