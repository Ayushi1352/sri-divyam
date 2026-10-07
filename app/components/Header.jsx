"use client";

import { Phone, Search, Menu, X, MapPin, Heart, User } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import { isItemRemoved } from "../utils/cartUtils";
import NotificationBell from "./NotificationBell";
import { apiClient } from "../utils/apiClient";


export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, isLoggedIn } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [wishlistCount, setWishlistCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [isHoveringCart, setIsHoveringCart] = useState(false);

  const syncQuantitiesFromServer = async () => {
    if (!isLoggedIn) return;
    try {
      const data = await apiClient.get("/api/cart");
      if (data) {
        const rawItems = data.cart_items || data.cart || data.items || data.data || [];
        let parsedItems = [];
        if (Array.isArray(rawItems)) {
          parsedItems = rawItems;
        } else if (rawItems && typeof rawItems === 'object') {
          parsedItems = rawItems._original_items || (Array.isArray(rawItems.items) ? rawItems.items : []);
        }

        let removedItems = [];
        try {
          const rStored = localStorage.getItem("shri_divyam_removed_cart_items");
          if (rStored) removedItems = JSON.parse(rStored);
        } catch (e) { }

        let existingQuantities = {};
        try {
          const stored = localStorage.getItem("shri_divyam_cart_quantities");
          if (stored) existingQuantities = JSON.parse(stored);
        } catch (e) { }

        let newQuantities = { ...existingQuantities };
        parsedItems.forEach(item => {
          const pId = String(item.product?._id || item.product?.id || item.productId || item.product_id || item.product || item.id || '');
          let vId = String(item.variant || item.variantDetails?.size || item.variant_id || item.variation_id || '');
          if (vId === "null" || vId === "undefined") vId = "";
          const key = `${pId}_${vId}`;
          const isRemoved = isItemRemoved(item);

          if (!isRemoved) {
            const hasLocalQty = Object.keys(existingQuantities).some(k => k.startsWith(`${pId}_`));
            if (!hasLocalQty) {
              newQuantities[key] = Number(item.quantity || 1);
            }
          }
        });
        localStorage.setItem("shri_divyam_cart_quantities", JSON.stringify(newQuantities));
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (e) {
      if (!e?.silent && e?.response?.status !== 401) {
        console.error("Header Sync Error:", e);
      }
    }
  };

  const fetchWishlistCount = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!isLoggedIn || !token) {
      try {
        const stored = localStorage.getItem("shri_divyam_guest_wishlist");
        const ids = stored ? JSON.parse(stored) : [];
        setWishlistCount(Array.isArray(ids) ? ids.length : 0);
      } catch (e) {
        setWishlistCount(0);
      }
      return;
    }
    try {
      const data = await apiClient.get("/api/auth/wishlist", { silent: true });
      if (data) {
        const items = data.wishlist || data.data || (Array.isArray(data) ? data : []);
        const count = Array.isArray(items) ? items.length : 0;
        setWishlistCount(count);
        
        // Sync items to localStorage for ProductCard / ProductInfo to read synchronously
        const productIds = Array.isArray(items) ? items.map(item => String(item.product?._id || item.productId || item._id || item.id || item.product_id)) : [];
        localStorage.setItem("shri_divyam_wishlist_items", JSON.stringify(productIds));
        localStorage.setItem("shri_divyam_guest_wishlist", JSON.stringify(productIds));
      }
    } catch (e) {
      // Fallback gracefully to local wishlist items on network error or unauthorized token
      try {
        const stored = localStorage.getItem("shri_divyam_guest_wishlist") || localStorage.getItem("shri_divyam_wishlist_items");
        const ids = stored ? JSON.parse(stored) : [];
        setWishlistCount(Array.isArray(ids) ? ids.length : 0);
      } catch (err) {
        setWishlistCount(0);
      }
    }
  };

  const fetchCartCount = () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

      if (!isLoggedIn || !token) {
        const guestCartStr = localStorage.getItem("shri_divyam_guest_cart");
        if (guestCartStr) {
          const guestCart = JSON.parse(guestCartStr);
          if (Array.isArray(guestCart)) {
            const count = guestCart.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
            setCartCount(count);
            return;
          }
        }
        setCartCount(0);
        return;
      }

      const removedItems = JSON.parse(localStorage.getItem("shri_divyam_removed_cart_items") || "[]");
      const storedQuantities = localStorage.getItem("shri_divyam_cart_quantities");
      if (storedQuantities) {
        const quantities = JSON.parse(storedQuantities);
        let totalItems = 0;
        
        Object.entries(quantities).forEach(([key, qty]) => {
          const qtyNum = Number(qty);
          if (qtyNum > 0) {
            const parts = key.split('_');
            const pId = parts[0];
            const vId = parts[1] || "";
            
            const isRemoved = isItemRemoved({ product_id: pId, variant_id: vId });
            
            if (!isRemoved) {
              totalItems += qtyNum;
            }
          }
        });
        setCartCount(totalItems);
        return;
      } else {
        setCartCount(0);
      }
    } catch (e) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();

    if (isLoggedIn) {
      syncQuantitiesFromServer();
    }
    fetchWishlistCount();

    const handleUpdate = () => fetchCartCount();
    const handleWishlistUpdate = () => fetchWishlistCount();
    const handleShowGlobalToast = (e) => {
      setToast({ message: e.detail.message, type: e.detail.type || 'success' });
      setTimeout(() => setToast(null), 3000);
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("cartUpdated", handleUpdate);
    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    window.addEventListener("showGlobalToast", handleShowGlobalToast);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("cartUpdated", handleUpdate);
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
      window.removeEventListener("showGlobalToast", handleShowGlobalToast);
    };
  }, [isLoggedIn]);


  const getInitials = (userObj) => {
    if (!userObj) return "U";
    if (typeof userObj === 'string') {
      const parts = userObj.trim().split(" ");
      if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return userObj.substring(0, 2).toUpperCase();
    }

    if (userObj.first_name && userObj.last_name) {
      return (userObj.first_name[0] + userObj.last_name[0]).toUpperCase();
    }

    const name = userObj.name || userObj.full_name || userObj.username || "User";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full font-poppins">


      {/* 🔴 Top Bar Wrapper */}
      <div className="w-full bg-[#135B42] relative z-20">
        <div className="w-full max-w-[1800px] mx-auto flex flex-row items-center justify-between gap-3 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-3 text-white text-sm">
          <div className="flex items-center gap-2 md:gap-6 w-auto">
            <a
              href="tel:+918433081227"
              className="flex items-center text-[14px] sm:text-[15px] md:text-[16px] gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Phone size={16} className="shrink-0" />
              <span className="whitespace-nowrap">+91 8433081227</span>
            </a>
          </div>

          <div className="flex flex-row items-center justify-end flex-wrap gap-4 md:gap-6 text-[15px] lg:text-[18px] font-semibold w-auto">
            <div className="flex items-center gap-4 sm:gap-6 md:gap-8 w-auto justify-end">
              {!isLoggedIn ? (
                <Link href="/login" className="flex items-center gap-1.5 md:gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <img src="https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774856036/Mask_group_3_mw7ria.png" alt="account" className="h-4 md:h-5 w-auto" />
                  <span className="hidden sm:inline">Account</span>
                </Link>
              ) : (
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 md:gap-2 cursor-pointer py-1 hover:opacity-80 transition-opacity"
                  title="My Account"
                >
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full border border-white/40 flex items-center justify-center bg-transparent uppercase font-bold text-[10px] md:text-[12px] overflow-hidden shrink-0">
                    {(user?.avatar && user.avatar !== "undefined" && user.avatar !== "null") ? (
                      <img src={user.avatar.startsWith('http') ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL}/${user.avatar.replace(/^\/+/, '')}`} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user)
                    )}
                  </div>
                  <span className="hidden sm:inline whitespace-nowrap font-semibold">
                    {typeof user === 'string' ? user : (user?.name || user?.username || user?.full_name || user?.first_name || "User")}
                  </span>
                </Link>
              )}

              {/* <NotificationBell /> */}

              <Link href="/wishlist" className="hidden lg:flex items-center gap-1.5 md:gap-2 cursor-pointer hover:opacity-80 transition-opacity group relative">
                <div className="relative flex items-center justify-center pt-0.5">
                  <Heart size={16} strokeWidth={2.5} className="md:w-[18px] md:h-[18px]" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#DAC153] text-[#135B42] text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-in zoom-in duration-300">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span>Wishlist</span>
              </Link>

              {/* Cart Icon & Flyout */}
              <div className="relative group"
                onMouseEnter={() => setIsHoveringCart(true)}
                onMouseLeave={() => setIsHoveringCart(false)}
              >
                <Link href="/cart" className="hidden lg:flex items-center gap-1.5 md:gap-2 cursor-pointer hover:opacity-80 transition-opacity group relative">
                  <div className="relative">
                    <img src="https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774855916/Mask_group_2_zcgcsh.png" alt="bag" className="h-4 md:h-5 w-auto" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#135B42] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border border-white animate-in zoom-in duration-300">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </div>
                  <span>Cart</span>
                </Link>
              </div>

              {/* 💱 Currency Toggle */}
              {/* <CurrencyToggle /> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar Wrapper */}
      <div className="w-full bg-[#FFF9F5] border-b border-[#F2E0D5] shadow-sm">
        <div className="w-full max-w-[1800px] mx-auto flex flex-row items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4">
          <Link href="/" className="cursor-pointer -ml-4 lg:ml-6 flex-shrink-0 w-[100px] lg:w-[160px]">
            <img src="https://res.cloudinary.com/w4kwyx1p/image/upload/v1786019226/sri_divyam_xy6keo.png" alt="shri-divyam" className="h-8 md:h-10 w-auto scale-[2.8] lg:scale-[3.9] origin-left lg:origin-center pointer-events-none" />
          </Link>

          <nav className="hidden lg:flex w-full justify-center flex-wrap items-center gap-6 lg:gap-10 text-[15px] lg:text-[18px] text-[#135B42] font-semibold">
            <Link href="/" className={`cursor-pointer transition-all duration-200 border-b-2 py-1 ${pathname === '/' ? 'border-[#135B42] text-[#135B42] font-bold' : 'border-transparent text-[#135B42] hover:opacity-80 hover:border-[#135B42]/50'}`}>Home</Link>
            <Link href="/about" className={`cursor-pointer transition-all duration-200 border-b-2 py-1 ${pathname === '/about' ? 'border-[#135B42] text-[#135B42] font-bold' : 'border-transparent text-[#135B42] hover:opacity-80 hover:border-[#135B42]/50'}`}>About</Link>
            <Link href="/shop" className={`cursor-pointer transition-all duration-200 border-b-2 py-1 ${pathname?.startsWith('/shop') ? 'border-[#135B42] text-[#135B42] font-bold' : 'border-transparent text-[#135B42] hover:opacity-80 hover:border-[#135B42]/50'}`}>Shop</Link>
            <Link href="/contact" className={`cursor-pointer transition-all duration-200 border-b-2 py-1 ${pathname === '/contact' ? 'border-[#135B42] text-[#135B42] font-bold' : 'border-transparent text-[#135B42] hover:opacity-80 hover:border-[#135B42]/50'}`}>Contact Us</Link>
          </nav>

          {/* 📱 Mobile Menu Toggle */}
          <div className="lg:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#135B42] hover:text-[#DAC153] cursor-pointer p-1 transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

        </div>

        {/* 📱 Mobile Menu Content */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-[#104731] text-white flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto">
            {/* Header of mobile menu */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 pb-4 pt-6 bg-[#FFF9F5]">
              <img src="https://res.cloudinary.com/w4kwyx1p/image/upload/v1786019226/sri_divyam_xy6keo.png" alt="shri-divyam" className="-ml-8 h-10 md:h-12 w-auto scale-[2.2] origin-left" />
              <button onClick={() => setIsMenuOpen(false)} className="text-[#135B42] hover:text-[#DAC153] mr-2">
                <X size={28} />
              </button>
            </div>

            {/* Nav Links */}
            <div className="flex flex-col px-6 pt-2">
              <Link href="/" className={`py-3 sm:py-4 text-[15px] sm:text-[16px] font-bold tracking-widest uppercase transition-colors border-b border-white/10 ${pathname === '/' ? 'text-[#DAC153]' : 'text-white hover:text-[#DAC153]'}`} onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link href="/about" className={`py-3 sm:py-4 text-[15px] sm:text-[16px] font-bold tracking-widest uppercase transition-colors border-b border-white/10 ${pathname === '/about' ? 'text-[#DAC153]' : 'text-white hover:text-[#DAC153]'}`} onClick={() => setIsMenuOpen(false)}>About Us</Link>
              <Link href="/shop" className={`py-3 sm:py-4 text-[15px] sm:text-[16px] font-bold tracking-widest uppercase transition-colors border-b border-white/10 ${pathname?.startsWith('/shop') ? 'text-[#DAC153]' : 'text-white hover:text-[#DAC153]'}`} onClick={() => setIsMenuOpen(false)}>Shop</Link>
              <Link href="/contact" className={`py-3 sm:py-4 text-[15px] sm:text-[16px] font-bold tracking-widest uppercase transition-colors border-b border-white/10 ${pathname === '/contact' ? 'text-[#DAC153]' : 'text-white hover:text-[#DAC153]'}`} onClick={() => setIsMenuOpen(false)}>Contact</Link>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col px-6 pt-5 pb-6 gap-5">
              {!isLoggedIn ? (
                <Link href="/login" className="flex items-center gap-4 text-[15px] sm:text-[16px] font-bold tracking-wide hover:text-[#DAC153] transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/30 flex items-center justify-center bg-white/10">
                    <User size={18} />
                  </div>
                  Sign In / Register
                </Link>
              ) : (
                <Link href="/profile" className="flex items-center gap-4 text-[15px] sm:text-[16px] font-bold tracking-wide hover:text-[#DAC153] transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/30 flex items-center justify-center bg-white/10 uppercase font-bold text-[13px] sm:text-[14px] overflow-hidden shrink-0">
                    {(user?.avatar && user.avatar !== "undefined" && user.avatar !== "null") ? (
                      <img src={user.avatar.startsWith('http') ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL}/${user.avatar.replace(/^\/+/, '')}`} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user)
                    )}
                  </div>
                  {typeof user === 'string' ? user : (user?.name || user?.username || user?.full_name || user?.first_name || "User")}
                </Link>
              )}

              <Link href="/wishlist" className="flex items-center gap-4 text-[15px] sm:text-[16px] font-bold tracking-wide hover:text-[#DAC153] transition-colors" onClick={() => setIsMenuOpen(false)}>
                <div className="relative">
                  <Heart size={24} fill="currentColor" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-[#DAC153] text-[#135B42] text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </div>
                Wishlist
              </Link>
              <Link href="/cart" className="flex items-center gap-4 text-[15px] sm:text-[16px] font-bold tracking-wide hover:text-[#DAC153] transition-colors relative" onClick={() => setIsMenuOpen(false)}>
                <div className="relative">
                  <img src="https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774855916/Mask_group_2_zcgcsh.png" alt="bag" className="h-6 w-auto filter brightness-0 invert" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-[#ff3b30] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                Cart
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed top-20 sm:top-24 right-4 sm:right-6 z-[9999] bg-white px-5 py-4 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.15)] text-[#1f2937] flex items-start sm:items-center gap-3 transition-all duration-300 animate-in slide-in-from-top-3 max-w-[400px] border border-gray-100">
          <div className="shrink-0 mt-0.5 sm:mt-0">
            {toast.type === 'error' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            )}
          </div>
          <span className="text-[15px] font-medium leading-snug flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2 -mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}

    </header>
  );
}

/* ─── Currency Toggle Component ─── */
function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="w-24 h-8 bg-white/20 rounded-full animate-pulse"></div>;

  return (
    <div className="flex items-center rounded-full border border-white/40 overflow-hidden text-[14px] font-semibold">
      <button
        id="currency-inr"
        onClick={() => toggleCurrency("INR")}
        className={`px-3 py-1 transition-all duration-200 cursor-pointer ${currency === "INR"
          ? "bg-white text-[#135B42]"
          : "bg-transparent text-white hover:bg-white/10"
          }`}
      >
        INR
      </button>
      <button
        id="currency-usd"
        onClick={() => toggleCurrency("USD")}
        className={`px-3 py-1 transition-all duration-200 cursor-pointer ${currency === "USD"
          ? "bg-white text-[#135B42]"
          : "bg-transparent text-white hover:bg-white/10"
          }`}
      >
        USD
      </button>
    </div>
  );
}