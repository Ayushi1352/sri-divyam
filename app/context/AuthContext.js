"use client";

import { createContext, useContext, useState, useEffect } from "react";

import { syncGuestCartToUser } from "../utils/cartUtils";
import { apiClient, setUnauthorizedHandler } from "../utils/apiClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Clears auth state only — no cart-clearing side effects.
    // Used for silent session-expiry cleanup (bad/expired token),
    // as opposed to `logout()` below, which is the full user-initiated logout.
    const clearAuthState = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem("token");
            let storedUser = null;

            try {
                const userStr = localStorage.getItem("user");
                if (userStr) storedUser = JSON.parse(userStr);
            } catch (e) {
                console.error("Failed to parse stored user", e);
            }

            if (storedToken) {
                setToken(storedToken);
                if (storedUser) setUser(storedUser);

                // Fetch fresh profile data in background to sync
                try {
                    const profileData = await apiClient.get("/api/auth/profile");

                    // Depending on how backend wraps it (e.g., { user: {...} } or {...})
                    const freshUser = profileData.user || profileData.data || profileData;

                    if (freshUser && typeof freshUser === "object") {
                        // Merge the fresh data with id from stored user if missing
                        const mergedUser = { ...freshUser };
                        if (!mergedUser.id && storedUser?.id) mergedUser.id = storedUser.id;

                        setUser(mergedUser);
                        localStorage.setItem("user", JSON.stringify(mergedUser));
                    }
                } catch (error) {
                    if (error.response?.status === 401) {
                        // Stored token is stale/expired/invalid — clear it so
                        // isLoggedIn reflects reality instead of staying stuck true.
                        clearAuthState();
                    } else {
                        console.error("Failed to fetch fresh profile data:", error);
                    }
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    // Register a global handler so ANY apiClient call that gets a 401
    // (not just the initial profile check on load) logs the user out
    // and keeps isLoggedIn accurate throughout the session.
    useEffect(() => {
        setUnauthorizedHandler(() => {
            clearAuthState();
        });
    }, []);

    const login = async (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem("token", userToken);
        localStorage.setItem("user", JSON.stringify(userData));

        // Sync any guest cart items to the newly logged-in account
        const userId = userData.id || userData.user_id || userData.userid || "1";
        syncGuestCartToUser(userToken, String(userId)).catch(console.error);

        // Fetch fresh profile data immediately to ensure all details (like mobile number) are populated
        try {
            const profileData = await apiClient.get("/api/auth/profile");
            const freshUser = profileData.user || profileData.data || profileData;
            if (freshUser && typeof freshUser === "object") {
                const mergedUser = { ...freshUser };
                if (!mergedUser.id && userData?.id) mergedUser.id = userData.id;
                setUser(mergedUser);
                localStorage.setItem("user", JSON.stringify(mergedUser));
            }
        } catch (error) {
            console.error("Failed to fetch fresh profile during login:", error);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Clear cart & wishlist state so stale data doesn't pollute the next guest/login session
        localStorage.removeItem("shri_divyam_cart_quantities");
        localStorage.removeItem("shri_divyam_removed_cart_items");
        localStorage.removeItem("shri_divyam_guest_cart");
        localStorage.removeItem("shri_divyam_wishlist_items");
        localStorage.removeItem("shri_divyam_guest_wishlist");
        window.dispatchEvent(new Event("cartUpdated"));
        window.dispatchEvent(new Event("wishlistUpdated"));
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoggedIn: !!token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}