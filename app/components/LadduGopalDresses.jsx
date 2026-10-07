"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { products as staticProducts } from "../data/products";
import { useCurrency } from "../context/CurrencyContext";

// Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import DirectAddToCart from "./DirectAddToCart";
import WishlistButton from "./WishlistButton";
import ProductCard from "./ProductCard";
import { apiClient } from "../utils/apiClient";
import { getImageUrl } from "../utils/imageUtils";

export default function LadduGopalDresses() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let prods = [];
        const getProducts = (response) => {
          const data = response?.data || response;
          const items = data?.products || data?.data || data;
          return Array.isArray(items) ? items : [];
        };

        // Use the category slug as well as its ID because the API supports both forms.
        const catsRes = await apiClient.get("/api/categories").catch(() => null);
        const categories = catsRes ? (Array.isArray(catsRes) ? catsRes : (catsRes.categories || catsRes.data || [])) : [];
        const ladduCategories = categories.filter(c => {
          const categoryText = `${c?.name || ""} ${c?.slug || ""}`.toLowerCase();
          return categoryText.includes("laddu") || categoryText.includes("gopal") || categoryText.includes("poshak");
        });

        const categoryResponses = await Promise.all(
          ladduCategories.map(category => category._id || category.id)
            .filter(Boolean)
            .map(categoryKey => apiClient.get(`/api/products/category/${categoryKey}`).catch(() => null))
        );
        prods = categoryResponses.flatMap(getProducts);

        // Fall back to the complete list when category endpoints return no products.
        if (prods.length === 0) {
          prods = getProducts(await apiClient.get("/api/products").catch(() => null));
        }

        // Filter products matching Laddu Gopal / Krishna / Poshak
        const filtered = prods.filter(p => {
          const catName = [
            p.category?.name,
            p.category?.slug,
            typeof p.category === "string" ? p.category : "",
            ...(Array.isArray(p.categories) ? p.categories.flatMap(category => [category?.name, category?.slug, category]) : [])
          ].filter(Boolean).join(" ").toLowerCase();
          const title = (p.title || p.name || '').toLowerCase();
          return catName.includes('laddu') || catName.includes('gopal') || catName.includes('krishan') || catName.includes('poshak') || title.includes('laddu') || title.includes('gopal') || title.includes('poshak') || title.includes('krishna');
        });

        if (filtered.length > 0) {
          setProducts(filtered);
        } else if (prods.length > 0) {
          setProducts(prods);
        }
      } catch (error) {
        console.error("Error fetching laddu gopal products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-[#FEF5E6]">
        <Loader2 className="animate-spin text-[#135B42]" size={40} />
      </div>
    );
  }

  const displayProducts = products;

  return (
    <section id="laddu-gopal-section" className="mx-auto max-w-[1720px] bg-[#FEF5E6] py-10 sm:py-16 md:py-20">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 md:px-16 lg:px-24">

        {/* HEADER */}
        <div className="flex flex-row items-center justify-between gap-4 sm:gap-6 mb-8 md:mb-14">
          <h2 className="text-[20px] sm:text-[32px] md:text-[36px] lg:text-[40px] font-playfair font-semibold text-[#303030]">
            Laddu Gopal ji Dresses
          </h2>

          <div className="flex gap-2 sm:gap-3 shrink-0">
            <button className="lg-prev w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border border-[#135B42] text-[#135B42] rounded-full hover:bg-[#135B42] hover:text-white transition cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <button className="lg-next w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-[#135B42] border border-[#135B42] text-white rounded-full hover:bg-transparent hover:text-[#135B42] transition cursor-pointer">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* CAROUSEL */}
        <Swiper
          modules={[Navigation]}
          navigation={{
            prevEl: ".lg-prev",
            nextEl: ".lg-next",
          }}
          spaceBetween={12}
          slidesPerView={1}
          loop={true}
          breakpoints={{
            480: { slidesPerView: 1.2, spaceBetween: 16 },
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 30 },
          }}
          className="w-full !pb-2"
        >

          {displayProducts.map((dress, index) => (
            <SwiperSlide key={`${dress.id}-${index}`}>
              <div className="h-full w-full max-w-[400px] mx-auto flex">
                <div className="w-full flex-1">
                  <ProductCard product={dress} />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* VIEW ALL */}
        <div className="mt-8 md:mt-10 text-center">
          <Link
            href="/shop?category=laddu-gopal"
            className="inline-flex"
          >
            <button className="bg-white border border-[#135B42] text-[#135B42] px-8 py-2.5 text-[15px] font-medium font-playfair hover:bg-[#135B42] hover:text-white transition-all duration-300 cursor-pointer rounded-sm shadow-sm">
              View All
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

