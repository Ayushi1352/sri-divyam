"use client";

import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useCurrency } from "../context/CurrencyContext";

// Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import ProductCard from "./ProductCard";
import { apiClient } from "../utils/apiClient";

export default function ProductGrid() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const getProducts = (response) => {
          const data = response?.data || response;
          const items = data?.products || data?.data || data;
          return Array.isArray(items) ? items : [];
        };

        const catsRes = await apiClient.get("/api/categories");
        const categories = Array.isArray(catsRes) ? catsRes : (catsRes.categories || catsRes.data || []);
        const radhaCategories = categories.filter(category => {
          const categoryText = `${category?.name || ""} ${category?.slug || ""}`.toLowerCase();
          return categoryText.includes("radha") || categoryText.includes("radhe") || categoryText.includes("krishna");
        });

        const categoryResponses = await Promise.all(
          radhaCategories.map(category => category._id || category.id)
            .filter(Boolean)
            .map(categoryKey => apiClient.get(`/api/products/category/${categoryKey}`).catch(() => null))
        );
        let productsArray = categoryResponses.flatMap(getProducts);

        if (productsArray.length === 0) {
          productsArray = getProducts(await apiClient.get("/api/products").catch(() => null));
        }

        productsArray = productsArray.filter(product => {
          const categoryText = [
            product.category?.name,
            product.category?.slug,
            typeof product.category === "string" ? product.category : "",
            ...(Array.isArray(product.categories) ? product.categories.flatMap(category => [category?.name, category?.slug, category]) : [])
          ].filter(Boolean).join(" ").toLowerCase();
          const productName = (product.name || product.title || "").toLowerCase();
          return categoryText.includes("radha") || categoryText.includes("radhe") || categoryText.includes("krishna") || productName.includes("radha") || productName.includes("krishna");
        });

        const uniqueProducts = new Map();
        productsArray.forEach(product => {
          const productKey = product._id || product.id || product.slug || `${product.sku || ""}-${product.name || product.title || ""}`;
          if (!uniqueProducts.has(String(productKey))) {
            uniqueProducts.set(String(productKey), product);
          }
        });
        productsArray = Array.from(uniqueProducts.values());

        if (productsArray.length > 0) {
          setProducts(productsArray);
        }
      } catch (error) {
        console.error("Error fetching Radha Rani products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-[#FDF8F3] w-full pt-6 sm:pt-10 md:pt-12 pb-10 sm:pb-16 md:pb-20">
        <Loader2 className="animate-spin text-[#135B42]" size={40} />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section id="radha-krishna-section" className="mx-auto max-w-[1720px] bg-[#FDF8F3] pt-6 sm:pt-10 md:pt-12 pb-10 sm:pb-16 md:pb-20">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24">

        {/* HEADER */}
        <div className="flex flex-row items-center justify-between gap-4 sm:gap-6 mb-8 md:mb-14">
          <h2 className="text-[20px] sm:text-[32px] md:text-[36px] font-playfair font-semibold text-[#303030]">
            Radha Krishna ji Dresses
          </h2>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              ref={prevRef}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border border-[#135B42] text-[#135B42] rounded-full hover:bg-[#135B42] hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              ref={nextRef}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-[#135B42] border border-[#135B42] text-white rounded-full hover:bg-transparent hover:text-[#135B42] transition cursor-pointer"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* CAROUSEL */}
        <Swiper
          modules={[Navigation]}
          onBeforeInit={(swiper) => {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          spaceBetween={12}
          slidesPerView={1}
          loop={true}
          breakpoints={{
            480: { slidesPerView: 1.2, spaceBetween: 16 },
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 30 },
          }}
          className="w-full"
        >
          {products.map((product, index) => (
            <SwiperSlide key={`${product.id}-${index}`} className="!h-auto flex">
              <div className="h-full w-full max-w-[400px] mx-auto flex">
                <div className="w-full flex-1">
                  <ProductCard product={product} />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* VIEW ALL BUTTON */}
        <div className="mt-8 md:mt-10 text-center">
          <Link
            href="/shop?category=radha-krishna"
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
