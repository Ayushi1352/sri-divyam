"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Award,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Sparkles,
  Search,
  X,
  Check,
  Loader2
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { apiClient } from "../utils/apiClient";

const PRICE_RANGES = [
  { key: "under500", label: "Under ₹500", min: 0, max: 500 },
  { key: "500to1000", label: "₹500 - ₹1000", min: 500, max: 1000 },
  { key: "1000to2000", label: "₹1000 - ₹2000", min: 1000, max: 2000 },
  { key: "above2000", label: "Above ₹2000", min: 2000, max: Infinity },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const [displayProducts, setDisplayProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [highestPrice, setHighestPrice] = useState(0);
  const [maxSelectedPrice, setMaxSelectedPrice] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Close sort dropdown if clicked outside (optional but good practice)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.sort-dropdown-container')) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch products and categories concurrently
        const [productsRes, categoriesRes] = await Promise.all([
          apiClient.get("/api/products?limit=1000").catch(() => ({ data: [] })),
          apiClient.get("/api/categories").catch(() => ({ data: [] }))
        ]);

        // Process Products
        let rawProducts = productsRes.products || (productsRes.data && productsRes.data.products) || productsRes.data || [];
        if (!Array.isArray(rawProducts)) rawProducts = [];

        const formatted = rawProducts.map((p) => {
          let img = p.mainImage || (p.images && p.images[0]) || p.image || p.image_path;
          let imageUrl = img || null;

          return {
            id: p.id || p._id,
            _id: p._id || p.id,
            title: p.name || p.title || "Premium Dress",
            name: p.name || p.title || "Premium Dress",
            slug: p.slug,
            description: p.description || "Premium Handcrafted Devotional Dress",
            price: Number(p.price) || 0,
            salePrice: p.salePrice !== undefined && p.salePrice !== null ? Number(p.salePrice) : (p.sale_price !== undefined ? Number(p.sale_price) : null),
            actualPrice: p.actual_price || p.regular_price || p.price,
            usdPrice: p.usd_price || p.usdPrice,
            inventory: p.totalInventory ?? p.inventory ?? 10,
            category: p.category,
            categories: p.categories || [],
            image: imageUrl,
            sku: p.sku
          };
        });
        setDisplayProducts(formatted);

        const maxP = formatted.reduce((max, p) => {
          const effective = (p.salePrice !== undefined && p.salePrice !== null && p.salePrice > 0 && p.salePrice < p.price) ? p.salePrice : p.price;
          return Math.max(max, Number(effective) || 0);
        }, 0);
        setHighestPrice(maxP);
        setMaxSelectedPrice(maxP);

        // Process Categories & Subcategories
        let rawCats = categoriesRes.data || categoriesRes.categories || categoriesRes || [];
        if (!Array.isArray(rawCats)) rawCats = [];

        // Identify parent categories and subcategories
        const parents = [];
        const subcategoriesByParent = {};

        rawCats.forEach((cat) => {
          if (!cat) return;
          const parentId = cat.parentCategory?._id || (typeof cat.parentCategory === 'string' ? cat.parentCategory : null);

          if (!parentId) {
            parents.push({
              _id: cat._id || cat.id,
              name: cat.name,
              slug: cat.slug,
              image: cat.image,
              description: cat.description,
              subcategories: []
            });
          }
        });

        // Group subcategories under parents
        rawCats.forEach((cat) => {
          if (!cat) return;
          const parentId = cat.parentCategory?._id || (typeof cat.parentCategory === 'string' ? cat.parentCategory : null);
          if (parentId) {
            const parent = parents.find(p => String(p._id) === String(parentId));
            const subcatObj = {
              _id: cat._id || cat.id,
              name: cat.name,
              slug: cat.slug,
              parentId: parentId,
              parentName: cat.parentCategory?.name || parent?.name || ""
            };
            if (parent) {
              parent.subcategories.push(subcatObj);
            } else {
              // If parent was not listed in root, add as standalone parent with subcat
              parents.push({
                _id: parentId,
                name: cat.parentCategory?.name || "Other",
                slug: cat.parentCategory?.slug || "other",
                subcategories: [subcatObj]
              });
            }
          }
        });

        // Initialize expanded state for all parents
        const initialExpanded = {};
        parents.forEach(p => {
          initialExpanded[p._id] = true;
        });

        setExpandedParents(initialExpanded);
        setCategoriesList(parents);

      } catch (err) {
        console.error("Failed to load shop data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-select category whenever searchParams or categoriesList changes
  useEffect(() => {
    if (!categoriesList || categoriesList.length === 0) return;

    const urlCategory = searchParams ? searchParams.get("category") : null;
    if (!urlCategory) {
      setSelectedCategoryIds([]);
      setSelectedSubCategoryIds([]);
      setSearchQuery("");
      return;
    }

    const searchCat = urlCategory.toLowerCase().trim();
    const searchCatNormalized = searchCat.replace(/-/g, " ");
    const searchCatSingular = searchCat.endsWith("ss") ? searchCat : searchCat.replace(/s$/, "");

    const matchedParentIds = [];
    const matchedSubIds = [];

    const isRadhaSearch = searchCat.includes("radha") || searchCat.includes("radhe") || searchCat.includes("krishna");
    const isOrnamentSearch = searchCatSingular.includes("ornament") || searchCatSingular.includes("jewel");
    const isPujaSearch = searchCatSingular.includes("puja") || searchCatSingular.includes("pooja") || searchCatSingular.includes("essential");
    const isDressSearch = searchCatSingular.includes("dress") || searchCatSingular.includes("poshak") || searchCatSingular.includes("vastra");

    // 1. Check parent categories first
    categoriesList.forEach(p => {
      const pId = String(p._id);
      const pSlug = (p.slug || "").toLowerCase();
      const pName = (p.name || "").toLowerCase();
      const pNameNormalized = pName.replace(/-/g, " ");
      const pSlugNormalized = pSlug.replace(/-/g, " ");
      const pNameSingular = pName.replace(/s$/, "");

      const pMatches = (
        pId === searchCat ||
        pSlug === searchCat ||
        pName === searchCat ||
        pNameSingular === searchCatSingular ||
        pSlug.includes(searchCatSingular) ||
        pName.includes(searchCatSingular) ||
        pSlugNormalized.includes(searchCatNormalized) ||
        pNameNormalized.includes(searchCatNormalized) ||
        searchCatNormalized.includes(pNameNormalized) ||
        searchCatNormalized.includes(pSlugNormalized) ||
        (isRadhaSearch && (pName.includes("radha") || pSlug.includes("radha") || pName.includes("krishna") || pSlug.includes("krishna"))) ||
        (isDressSearch && (pName.includes("dress") || pSlug.includes("dress") || pName.includes("poshak") || pName.includes("vastra"))) ||
        (isOrnamentSearch && (pName.includes("ornament") || pSlug.includes("ornament") || pName.includes("jewel") || pName.includes("shringar"))) ||
        (isPujaSearch && (pName.includes("puja") || pName.includes("pooja") || pSlug.includes("puja") || pSlug.includes("pooja") || pName.includes("essential")))
      );

      if (pMatches) {
        matchedParentIds.push(p._id);
      }
    });

    if (matchedParentIds.length > 0) {
      setSelectedCategoryIds(matchedParentIds);
      setSelectedSubCategoryIds([]);
      setSearchQuery("");
    } else {
      categoriesList.forEach(p => {
        p.subcategories?.forEach(sub => {
          const sId = String(sub._id);
          const sSlug = (sub.slug || "").toLowerCase();
          const sName = (sub.name || "").toLowerCase();
          const sNameNormalized = sName.replace(/-/g, " ");
          const sSlugNormalized = sSlug.replace(/-/g, " ");
          const sNameSingular = sName.replace(/s$/, "");

          const subMatches = (
            sId === searchCat ||
            sSlug === searchCat ||
            sName === searchCat ||
            sNameSingular === searchCatSingular ||
            sSlug.includes(searchCatSingular) ||
            sName.includes(searchCatSingular) ||
            sSlugNormalized.includes(searchCatNormalized) ||
            sNameNormalized.includes(searchCatNormalized) ||
            searchCatNormalized.includes(sNameNormalized) ||
            searchCatNormalized.includes(sSlugNormalized) ||
            (isRadhaSearch && (sName.includes("radha") || sSlug.includes("radha") || sName.includes("krishna") || sSlug.includes("krishna"))) ||
            (isDressSearch && (sName.includes("dress") || sSlug.includes("dress") || sName.includes("poshak") || sName.includes("vastra"))) ||
            (isOrnamentSearch && (sName.includes("ornament") || sSlug.includes("ornament") || sName.includes("jewel") || sName.includes("shringar"))) ||
            (isPujaSearch && (sName.includes("puja") || sName.includes("pooja") || sSlug.includes("puja") || sSlug.includes("pooja") || sName.includes("essential")))
          );

          if (subMatches) {
            matchedSubIds.push(sub._id);
          }
        });
      });

      if (matchedSubIds.length > 0) {
        setSelectedSubCategoryIds(matchedSubIds);
        setSelectedCategoryIds([]);
        setSearchQuery("");
      } else {
        setSelectedCategoryIds([]);
        setSelectedSubCategoryIds([]);
        setSearchQuery(urlCategory);
      }
    }
  }, [searchParams, categoriesList]);

  const toggleParentCategory = (catId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleSubCategory = (subId) => {
    setSelectedSubCategoryIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const toggleExpand = (catId) => {
    setExpandedParents((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const togglePriceRange = (key) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    setSelectedCategoryIds([]);
    setSelectedSubCategoryIds([]);
    setSelectedPriceRanges([]);
    setSearchQuery("");
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryIds, selectedSubCategoryIds, selectedPriceRanges, sortBy]);

  // Helper to test if product matches a category or subcategory
  const productMatchesCategory = (product, catId) => {
    const pCatId = String(product.category?._id || product.category?.id || product.category || "");
    const pCatName = (product.category?.name || (typeof product.category === 'string' ? product.category : "") || "").toLowerCase();
    const pCatSlug = (product.category?.slug || "").toLowerCase();
    const productTitle = (product.title || product.name || "").toLowerCase();

    // Check product.category ID
    if (pCatId === String(catId)) return true;

    // Check product.categories array
    if (Array.isArray(product.categories)) {
      const matchInArray = product.categories.some(c =>
        String(c._id || c.id || c) === String(catId) ||
        (c.slug && c.slug.toLowerCase() === String(catId).toLowerCase()) ||
        (c.name && c.name.toLowerCase() === String(catId).toLowerCase())
      );
      if (matchInArray) return true;
    }

    // Also match by parent category object if it matches
    const parent = categoriesList.find(p => String(p._id) === String(catId));
    if (parent) {
      const pNameLower = (parent.name || "").toLowerCase();
      const pSlugLower = (parent.slug || "").toLowerCase();
      const pNameNormalized = pNameLower.replace(/-/g, " ");
      const pSlugNormalized = pSlugLower.replace(/-/g, " ");
      const pCatNameNormalized = pCatName.replace(/-/g, " ");
      const pNameSingular = pNameLower.replace(/s$/, "");

      const isRadhaCategory = pNameLower.includes("radha") || pSlugLower.includes("radha") || pNameLower.includes("krishna") || pSlugLower.includes("krishna");

      if (
        pCatName.includes(pNameLower) ||
        pCatName.includes(pSlugLower) ||
        pCatSlug.includes(pSlugLower) ||
        pCatNameNormalized.includes(pNameNormalized) ||
        pCatNameNormalized.includes(pSlugNormalized) ||
        (pNameSingular && pCatName.includes(pNameSingular)) ||
        (isRadhaCategory && (
          pCatName.includes("radha") || pCatName.includes("krishna") || pCatName.includes("radhe") ||
          productTitle.includes("radha") || productTitle.includes("krishna") || productTitle.includes("radhe")
        ))
      ) {
        return true;
      }
      // Check if product belongs to any of this parent's subcategories
      if (parent.subcategories?.length > 0) {
        return parent.subcategories.some(sub => productMatchesCategory(product, sub._id));
      }
    }

    return false;
  };

  const filteredProducts = useMemo(() => {
    let result = [...displayProducts];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const queryWords = searchQuery.trim().toLowerCase().split(/\s+/);

      result = result.filter((p) => {
        const title = (p.title || p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const sku = (p.sku || "").toLowerCase();
        const catName = typeof p.category === 'object' ? (p.category?.name || "").toLowerCase() : String(p.category || "").toLowerCase();
        const categoriesStr = Array.isArray(p.categories) ? p.categories.map(c => (c.name || c.slug || "").toLowerCase()).join(" ") : "";

        const searchPool = `${title} ${desc} ${sku} ${catName} ${categoriesStr}`;

        return queryWords.every(word => {
          // Synonym mapping for better UX
          if (word === 'dress' || word === 'dresses' || word === 'clothes' || word === 'clothing') {
            return searchPool.includes('dress') || searchPool.includes('poshak') || searchPool.includes('vastra') || searchPool.includes('lehenga') || searchPool.includes('suit');
          }
          if (word === 'poshak' || word === 'poshaks' || word === 'vastra') {
            return searchPool.includes('poshak') || searchPool.includes('vastra') || searchPool.includes('dress');
          }
          if (word === 'laddu' || word === 'ladoo' || word === 'laddoo') {
            return searchPool.includes('laddu') || searchPool.includes('ladoo') || searchPool.includes('laddoo');
          }
          if (word === 'kanha' || word === 'krishna' || word === 'thakurji' || word === 'thakur') {
            return searchPool.includes('kanha') || searchPool.includes('krishna') || searchPool.includes('thakur');
          }
          if (word === 'radha' || word === 'radhaji' || word === 'radhika' || word === 'kishori') {
            return searchPool.includes('radha') || searchPool.includes('kishori') || searchPool.includes('radhika');
          }

          return searchPool.includes(word);
        });
      });
    }

    // 2. Category Filter (Parent Categories & Subcategories)
    const hasCategoryFilter = selectedCategoryIds.length > 0 || selectedSubCategoryIds.length > 0;
    if (hasCategoryFilter) {
      result = result.filter((p) => {
        // Matches if it matches any selected parent category
        const parentMatch = selectedCategoryIds.some((catId) => productMatchesCategory(p, catId));
        // Matches if it matches any selected subcategory
        const subMatch = selectedSubCategoryIds.some((subId) => productMatchesCategory(p, subId));

        if (selectedCategoryIds.length > 0 && selectedSubCategoryIds.length > 0) {
          return parentMatch || subMatch;
        }
        if (selectedCategoryIds.length > 0) return parentMatch;
        if (selectedSubCategoryIds.length > 0) return subMatch;
        return true;
      });
    }

    // 3. Price Range Filter (Uses effective sale price if available)
    if (selectedPriceRanges.length > 0) {
      result = result.filter((p) => {
        const effectivePrice = (p.salePrice && p.salePrice < p.price) ? p.salePrice : p.price;
        const price = Number(effectivePrice) || 0;
        return selectedPriceRanges.some((rangeKey) => {
          const range = PRICE_RANGES.find((r) => r.key === rangeKey);
          return range && price >= range.min && price < range.max;
        });
      });
    }

    // 3.5 Dynamic Price Slider Filter
    if (highestPrice > 0 && maxSelectedPrice < highestPrice) {
      result = result.filter((p) => {
        const effectivePrice = (p.salePrice && p.salePrice < p.price) ? p.salePrice : p.price;
        return (Number(effectivePrice) || 0) <= maxSelectedPrice;
      });
    }

    // 4. Sorting
    if (sortBy === "price_low") {
      result.sort((a, b) => {
        const priceA = (a.salePrice && a.salePrice < a.price) ? a.salePrice : a.price;
        const priceB = (b.salePrice && b.salePrice < b.price) ? b.salePrice : b.price;
        return (Number(priceA) || 0) - (Number(priceB) || 0);
      });
    } else if (sortBy === "price_high") {
      result.sort((a, b) => {
        const priceA = (a.salePrice && a.salePrice < a.price) ? a.salePrice : a.price;
        const priceB = (b.salePrice && b.salePrice < b.price) ? b.salePrice : b.price;
        return (Number(priceB) || 0) - (Number(priceA) || 0);
      });
    }

    return result;
  }, [displayProducts, selectedCategoryIds, selectedSubCategoryIds, selectedPriceRanges, maxSelectedPrice, highestPrice, searchQuery, sortBy, categoriesList]);

  const activeFilterCount = selectedCategoryIds.length + selectedSubCategoryIds.length + selectedPriceRanges.length;

  const formatCategoryTitleHelper = (rawName) => {
    if (!rawName) return "All Devotional Collection";
    let cleaned = rawName.trim().replace(/-/g, " ");
    const lower = cleaned.toLowerCase();

    if (lower.includes("laddu") || lower.includes("ladoo") || lower.includes("gopal")) {
      return "Laddu Gopal ji Dresses";
    }
    if (lower.includes("radha") || lower.includes("radhe") || lower.includes("krishna") || lower.includes("kishori")) {
      return "Radha Krishna ji Dresses";
    }
    if (lower.includes("mata") || (lower.includes("rani") && !lower.includes("radha"))) {
      return "Mata Rani ji Dresses";
    }
    if (lower === "dress" || lower === "dresses" || lower === "god dresses") {
      return "Devotional Dresses";
    }
    if (lower.includes("ornament") || lower.includes("jewel") || lower.includes("shringar")) {
      return "Ornaments & Shringar";
    }
    if (lower.includes("puja") || lower.includes("pooja") || lower.includes("essential")) {
      return "Puja Essentials";
    }

    if (
      lower.includes("dress") ||
      lower.includes("poshak") ||
      lower.includes("ornament") ||
      lower.includes("jewel") ||
      lower.includes("puja") ||
      lower.includes("essential") ||
      lower.includes("collection") ||
      lower.includes("shringar")
    ) {
      return cleaned.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }

    const capitalized = cleaned.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    return `${capitalized} Dresses`;
  };

  // Active Category Name for Banner
  const bannerCategoryTitle = useMemo(() => {
    const urlCat = searchParams ? searchParams.get("category") : null;
    const urlCatLower = urlCat ? urlCat.toLowerCase().trim() : "";

    if (urlCatLower === "dress" || urlCatLower === "dresses" || urlCatLower === "god-dresses") {
      return "All Devotional Dresses";
    }

    if (selectedSubCategoryIds.length === 1) {
      for (const parent of categoriesList) {
        const sub = parent.subcategories?.find(s => s._id === selectedSubCategoryIds[0]);
        if (sub) return formatCategoryTitleHelper(sub.name);
      }
    }
    if (selectedCategoryIds.length === 1) {
      const parent = categoriesList.find(p => p._id === selectedCategoryIds[0]);
      if (parent) return formatCategoryTitleHelper(parent.name);
    }
    if (selectedCategoryIds.length > 1 || selectedSubCategoryIds.length > 1) {
      if (urlCatLower.includes("dress") || urlCatLower.includes("poshak")) {
        return "All Devotional Dresses";
      }
      return "Selected Categories Collection";
    }
    if (searchQuery && searchQuery.trim()) {
      return formatCategoryTitleHelper(searchQuery.trim());
    }
    if (urlCat) {
      return formatCategoryTitleHelper(urlCat);
    }
    return "All Devotional Collection";
  }, [selectedCategoryIds, selectedSubCategoryIds, categoriesList, searchQuery, searchParams]);

  return (
    <main className="bg-white min-h-screen font-poppins text-gray-800">
      <Header />

      {/* 1. Hero / Breadcrumb Section */}
      <section className="relative border-b border-gray-100 overflow-hidden flex items-center justify-center min-h-[50vh]">
        
        {/* Background Image - Replace this URL with your preferred banner image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://res.cloudinary.com/t4gae59t/image/upload/v1787726837/banner_image.png")' }}
        >
          {/* Elegant Dark Green Overlay for Text Readability & Brand Match */}
          <div className="absolute inset-0 bg-[#135B42]/75"></div>
          {/* Subtle pattern overlay for extra texture */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none"></div>
        </div>

        <div className="max-w-[1000px] mx-auto px-6 sm:px-8 relative z-10 text-center">
          <h1 className="font-playfair text-white text-3xl md:text-4xl lg:text-[46px] font-bold mb-4 md:mb-5 capitalize drop-shadow-md tracking-wide">
            {bannerCategoryTitle}
          </h1>
          <p className="text-white/90 text-sm md:text-base lg:text-[17px] leading-relaxed max-w-2xl mx-auto drop-shadow font-gt-walsheim font-light">
            Beautifully handcrafted divine poshaks and dresses, consecrated and tailored with supreme love and devotion.
          </p>
        </div>
      </section>

      {/* 2. Main Shop Layout */}
      <section className="py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 lg:px-24">

          {/* Search Bar */}
          <div className="flex justify-center mb-6">
            <div className="flex w-full max-w-2xl border border-[#E0D8CE] rounded-sm overflow-hidden shadow-xs h-12 bg-white focus-within:border-[#135B42] focus-within:ring-1 focus-within:ring-[#135B42] transition-all">
              <input
                type="text"
                placeholder="Search divine dresses, deity, or fabric..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-2 sm:px-4 py-3 outline-none text-gray-700 bg-white placeholder-gray-400 text-[11px] sm:text-[13px] md:text-base min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-2 sm:px-3 text-gray-400 hover:text-gray-600 flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
              <div className="bg-[#135B42] text-white px-4 sm:px-6 flex items-center justify-center">
                <Search size={18} className="sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* Green Filter Bar */}
          <div className="bg-[#0B4D36] text-white flex items-center justify-between px-4 sm:px-6 py-3 md:py-4 rounded-sm shadow-sm">
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className={`flex items-center gap-2 transition-all border px-3.5 py-1.5 rounded-sm cursor-pointer ${isFilterOpen
                  ? "bg-white text-[#0B4D36] border-white font-semibold shadow-xs"
                  : "border-white/30 hover:bg-white/10 text-white"
                  }`}
              >
                <SlidersHorizontal size={16} />
                <span className="font-medium text-sm">Filters</span>
                {activeFilterCount > 0 && (
                  <span className={`ml-1 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${isFilterOpen ? "bg-[#0B4D36] text-white" : "bg-white text-[#135B42]"
                    }`}>
                    {activeFilterCount}
                  </span>
                )}
                {isFilterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <div className="hidden sm:block relative sort-dropdown-container">
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className={`flex items-center gap-2 border px-3.5 py-1.5 rounded-sm transition-all cursor-pointer ${isSortOpen
                    ? "bg-white text-[#0B4D36] border-white font-semibold shadow-xs"
                    : "border-white/30 hover:bg-white/10 text-white"
                    }`}
                >
                  <span className={`text-xs md:text-sm ${isSortOpen ? "text-[#0B4D36]/80" : "text-white/80"}`}>Sort by:</span>
                  <span className={`text-xs md:text-sm font-medium ${isSortOpen ? "text-[#0B4D36]" : "text-white"}`}>
                    {sortBy === "newest" ? "Newest Arrivals" : sortBy === "price_low" ? "Price: Low to High" : "Price: High to Low"}
                  </span>
                  <ChevronDown size={14} className={`opacity-80 transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} />
                </button>

                {isSortOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-100 rounded-sm shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onClick={() => { setSortBy("newest"); setIsSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === "newest" ? "text-[#135B42] font-semibold bg-[#F5F9F7]" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Newest Arrivals
                    </button>
                    <button
                      onClick={() => { setSortBy("price_low"); setIsSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === "price_low" ? "text-[#135B42] font-semibold bg-[#F5F9F7]" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Price: Low to High
                    </button>
                    <button
                      onClick={() => { setSortBy("price_high"); setIsSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === "price_high" ? "text-[#135B42] font-semibold bg-[#F5F9F7]" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Price: High to Low
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs sm:text-sm font-medium">
              ({filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"})
            </div>
          </div>

          {/* Layout: Sidebar (on filter open) + Grid */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start mt-8">

            {/* Filter Sidebar */}
            {isFilterOpen && (
              <aside className="w-full lg:w-72 flex-shrink-0 bg-white border border-[#E8DDD4] rounded-sm shadow-md p-5 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD4] mb-4">
                  <h3 className="font-playfair text-base font-bold text-[#135B42]">Refine Selection</h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* 1. Dynamic Categories & Subcategories from Admin */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center justify-between">
                    <span>Category & Subcategory</span>
                  </h4>

                  <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                    {categoriesList.length === 0 ? (
                      <p className="text-xs text-gray-400">Loading categories...</p>
                    ) : (
                      categoriesList.map((cat) => {
                        const isParentSelected = selectedCategoryIds.includes(cat._id);
                        const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
                        const isExpanded = expandedParents[cat._id];

                        return (
                          <div key={cat._id} className="flex flex-col border-b border-gray-100 pb-2">
                            {/* Parent Category Row */}
                            <div className="flex items-center justify-between gap-2 py-1">
                              <label className="flex items-center gap-2.5 text-sm font-medium text-gray-800 cursor-pointer hover:text-[#135B42] flex-1">
                                <input
                                  type="checkbox"
                                  checked={isParentSelected}
                                  onChange={() => toggleParentCategory(cat._id)}
                                  className="accent-[#135B42] w-4 h-4 rounded cursor-pointer"
                                />
                                <span>{cat.name}</span>
                              </label>

                              {hasSubcategories && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(cat._id)}
                                  className="p-1 text-gray-400 hover:text-[#135B42] transition-colors cursor-pointer"
                                  aria-label="Toggle subcategories"
                                >
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              )}
                            </div>

                            {/* Subcategories Nested List */}
                            {hasSubcategories && isExpanded && (
                              <div className="ml-6 mt-1.5 flex flex-col gap-1.5 pl-2 border-l-2 border-[#E5F0EB]">
                                {cat.subcategories.map((sub) => {
                                  const isSubSelected = selectedSubCategoryIds.includes(sub._id);
                                  return (
                                    <label
                                      key={sub._id}
                                      className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-[#135B42] py-0.5"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSubSelected}
                                        onChange={() => toggleSubCategory(sub._id)}
                                        className="accent-[#135B42] w-3.5 h-3.5 rounded cursor-pointer"
                                      />
                                      <span>{sub.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. Price Range Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 text-sm mb-3">Price Range</h4>
                  <div className="flex flex-col gap-2">
                    {PRICE_RANGES.map((range) => (
                      <label
                        key={range.key}
                        className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-[#135B42]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPriceRanges.includes(range.key)}
                          onChange={() => togglePriceRange(range.key)}
                          className="accent-[#135B42] w-4 h-4 rounded cursor-pointer"
                        />
                        <span>{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 3. Dynamic Price Slider */}
                {highestPrice > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 text-sm mb-3">Custom Price Range</h4>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>₹0</span>
                        <span className="font-bold text-[#135B42]">Up to ₹{maxSelectedPrice}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={highestPrice}
                        step="50"
                        value={maxSelectedPrice}
                        onChange={(e) => setMaxSelectedPrice(Number(e.target.value))}
                        style={{
                          background: `linear-gradient(to right, #135B42 ${highestPrice > 0 ? (maxSelectedPrice / highestPrice) * 100 : 100}%, #e5e7eb ${highestPrice > 0 ? (maxSelectedPrice / highestPrice) * 100 : 100}%)`
                        }}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#135B42]"
                      />
                    </div>
                  </div>
                )}

                {/* Action Row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-gray-500 hover:text-[#135B42] underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="ml-auto bg-[#135B42] text-white px-5 py-2 rounded-sm text-xs font-semibold hover:bg-[#0f4a35] transition-colors cursor-pointer shadow-xs"
                  >
                    Apply Filters
                  </button>
                </div>
              </aside>
            )}

            {/* Product Grid */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-24">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#135B42] border-t-transparent mb-4"></div>
                  <p className="text-sm text-gray-500 font-medium">Loading divine collection...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-[#FAF8F5] rounded-md border border-[#E8DDD4] p-8">
                  <Sparkles size={36} className="text-[#DAC153] mb-3" />
                  <p className="text-gray-700 font-semibold text-base mb-1">No products match your selected filters</p>
                  <p className="text-gray-500 text-xs sm:text-sm mb-4">Try clearing some filters or searching for other divine terms.</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="bg-[#135B42] text-white px-6 py-2.5 text-xs font-semibold rounded-sm hover:bg-[#0e4834] transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 justify-items-center ${isFilterOpen ? "lg:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-3"}`}>
                    {filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product) => (
                      <div key={product.id} className="w-full h-full transition-transform duration-300 hover:-translate-y-1.5 sm:hover:-translate-y-2">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {Math.ceil(filteredProducts.length / itemsPerPage) > 1 && (() => {
                    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
                    const getPageNumbers = () => {
                      const pages = [];
                      if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        if (currentPage <= 4) {
                          pages.push(1, 2, 3, 4, 5, "...", totalPages);
                        } else if (currentPage >= totalPages - 3) {
                          pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                        } else {
                          pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
                        }
                      }
                      return pages;
                    };

                    return (
                      <div className="flex justify-center items-center gap-2 mt-12 pt-6 border-t border-gray-100 font-poppins">
                        <button
                          onClick={() => {
                            setCurrentPage(prev => Math.max(prev - 1, 1));
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 border border-gray-200 rounded-sm text-xs sm:text-sm font-medium text-gray-600 hover:bg-[#135B42] hover:text-white hover:border-[#135B42] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Previous
                        </button>

                        <div className="flex items-center gap-1">
                          {getPageNumbers().map((pg, idx) => (
                            pg === "..." ? (
                              <span key={`dots-${idx}`} className="px-2 text-gray-400 font-bold text-xs">...</span>
                            ) : (
                              <button
                                key={pg}
                                onClick={() => {
                                  setCurrentPage(pg);
                                  window.scrollTo({ top: 400, behavior: 'smooth' });
                                }}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-sm flex items-center justify-center text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${currentPage === pg ? "bg-[#135B42] text-white border border-[#135B42]" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                              >
                                {pg}
                              </button>
                            )
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            setCurrentPage(prev => Math.min(prev + 1, totalPages));
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 border border-gray-200 rounded-sm text-xs sm:text-sm font-medium text-gray-600 hover:bg-[#135B42] hover:text-white hover:border-[#135B42] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 3. Bottom Trust Bar */}
      <section className="bg-[#FFFDF9] border-t border-gray-100 py-10 mt-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 lg:px-24">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 divide-x-0 lg:divide-x lg:divide-gray-200">
            {[
              { icon: <Sparkles size={28} strokeWidth={1.5} />, title: "Handmade", subtitle: "with Love" },
              { icon: <Award size={28} strokeWidth={1.5} />, title: "Premium", subtitle: "Quality Fabric" },
              { icon: <ShieldCheck size={28} strokeWidth={1.5} />, title: "Secure", subtitle: "Payment" },
              { icon: <Truck size={28} strokeWidth={1.5} />, title: "Fast & Safe", subtitle: "Delivery" },
              { icon: <RefreshCcw size={28} strokeWidth={1.5} />, title: "Easy", subtitle: "Returns" },
            ].map((feature, idx) => (
              <div key={idx} className={`flex items-center gap-4 ${idx !== 0 ? 'lg:pl-8' : ''}`}>
                <div className="text-[#135B42]">
                  {feature.icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 text-sm">{feature.title}</span>
                  <span className="text-gray-600 text-xs md:text-sm">{feature.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F3] w-full">
        <Loader2 className="animate-spin text-[#135B42]" size={40} />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}