"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { products as staticProducts } from "../data/products";
import { useCurrency } from "../context/CurrencyContext";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import DirectAddToCart from "./DirectAddToCart";
import WishlistButton from "./WishlistButton";
import ProductCard from "./ProductCard";
import { apiClient } from "../utils/apiClient";
import { getImageUrl } from "../utils/imageUtils";


export default function LatestCollection() {
  const router = useRouter();
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  const firstProduct = latestProducts?.[0];
  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        // First, fetch categories to find the exact slug for "Latest Collection"
        const catsRes = await apiClient.get("/api/categories");
        const categories = Array.isArray(catsRes) ? catsRes : (catsRes.categories || catsRes.data || []);
        const latestCat = categories.find(c => c.name && c.name.toLowerCase().includes("latest collection"));

        let productsArray = [];
        
        if (latestCat && (latestCat._id || latestCat.id)) {
          // Fetch products for that specific category using its MongoDB _id
          const catId = latestCat._id || latestCat.id;
          const data = await apiClient.get(`/api/products/category/${catId}`);
          if (data && (data.success || data.products || Array.isArray(data))) {
            productsArray = data.products || data.data || (Array.isArray(data) ? data : []);
          }
        } else {
          // Fallback to featured if category not found
          const data = await apiClient.get("/api/products/featured");
          if (data && (data.success || data.products || Array.isArray(data))) {
            productsArray = data.products || data.data || (Array.isArray(data) ? data : []);
          }
        }
        
        if (productsArray.length > 0) {
          setLatestProducts(productsArray.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching latest products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-[#F5F5F7]">
        <Loader2 className="animate-spin text-[#135B42]" size={40} />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[1720px] bg-[#F5F5F7] pt-10 sm:pt-14 md:pt-16 lg:pt-[54px] pb-8 md:pb-12">
      <div className="max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <h2 className="text-[20px] sm:text-[32px] md:text-[36px] lg:text-[40px] font-playfair font-semibold text-[#303030]">
            Latest Collection
          </h2>

          <div className="flex gap-2 sm:gap-3">
            <button className="swiper-button-prev-custom w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-[#135B42] text-[#135B42] rounded-full hover:bg-[#135B42] hover:text-white transition cursor-pointer">
              <ArrowLeft size={20} />
            </button>

            <button className="swiper-button-next-custom w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#135B42] border border-[#135B42] text-white rounded-full hover:bg-transparent hover:text-[#135B42] transition cursor-pointer">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-[584px_minmax(0,1fr)] gap-8 lg:gap-12 items-stretch">

          {/* LEFT BANNER */}
          <div className="relative w-full lg:w-[584px] h-[320px] sm:h-[400px] lg:h-full min-h-0 overflow-hidden group bg-white lg:bg-transparent ring-1 ring-gray-200 lg:ring-0 rounded-sm shadow-sm flex flex-col justify-center">
            <img
              src={"https://res.cloudinary.com/t4gae59t/image/upload/v1787656128/let_your_love.png"}
              alt={"Latest Collection Banner"}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40"></div>

            {/* Text */}
            <div className="relative z-10 flex flex-col justify-center px-8 sm:px-12 py-8">
              <h3 className="text-[20px] sm:text-[28px] lg:text-[38px] xl:text-[40px] leading-tight font-serif text-white mb-4 md:mb-8">
                Let Your Love <br className="hidden sm:block" /> Tick Forever
              </h3>

              <Link href="/shop">
                <button className="flex items-center gap-2 bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 w-fit text-[14px] sm:text-[15px] font-medium hover:bg-gray-100 transition cursor-pointer rounded-sm shadow-sm">
                  Shop Now <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          </div>

          {/* RIGHT CAROUSEL */}
          <div className="w-full min-w-0 overflow-hidden flex flex-col justify-center">
            <Swiper
              modules={[Navigation]}
              navigation={{
                prevEl: ".swiper-button-prev-custom",
                nextEl: ".swiper-button-next-custom",
              }}
              spaceBetween={12}
              slidesPerView={1}
              loop={true}
              breakpoints={{
                480: { slidesPerView: 1.3, spaceBetween: 16 },
                640: { slidesPerView: 1.7, spaceBetween: 20 },
                1024: { slidesPerView: 2.05, spaceBetween: 30 },
                1280: { slidesPerView: 2.1, spaceBetween: 40 },
              }}
              className="w-full h-full"
            >

              {latestProducts.map((product) => (
                <SwiperSlide key={product.id} className="!h-auto flex">
                  <div className="h-full w-full max-w-[550px] mx-auto">
                    <ProductCard product={product} />
                  </div>
                </SwiperSlide>
              ))}

            </Swiper>
          </div>

        </div>
      </div>
    </section>
  );
} 
