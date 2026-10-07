"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext();

// 1 USD = ~94 INR (approximate fixed rate)
export const USD_TO_INR = 94;

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState("INR"); // default INR
  const [isCurrencyLoading, setIsCurrencyLoading] = useState(true);

  useEffect(() => {
    // Detect IP location to set currency
    const detectCurrency = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        
        if (data.country_code === "IN") {
          setCurrency("INR");
        } else {
          setCurrency("USD");
        }
      } catch (error) {
        console.error("Failed to detect IP for currency. Defaulting to INR.", error);
        setCurrency("INR"); // fallback
      } finally {
        setIsCurrencyLoading(false);
      }
    };
    
    detectCurrency();
  }, []);

  const toggleCurrency = (val) => setCurrency(val);

  const formatPrice = (inrPrice, usdPrice) => {
    if (currency === "USD") {
      if (usdPrice) return `$ ${usdPrice}`;

      const price = parseFloat(inrPrice);
      if (isNaN(price)) return inrPrice;
      return `$ ${(price / USD_TO_INR).toFixed(2)}`;
    }
    // INR formatting
    const price = parseFloat(inrPrice);
    if (isNaN(price)) return `₹ ${inrPrice}`;
    
    // Format to max 1 decimal place
    const rounded = Math.round(price * 10) / 10;
    return `₹ ${rounded}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatPrice, isCurrencyLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
