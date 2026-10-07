"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
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

export default function MataRaniDresses() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const getProducts = (response) => {
          const data = response?.data || response;
          const items = data?.products || data?.data || data;
          return Array.isArray(items) ? items : [];
        };

        // Include the parent and subcategories because products may be assigned to either one.
        const catsRes = await apiClient.get("/api/categories");
        const categories = Array.isArray(catsRes) ? catsRes : (catsRes.categories || catsRes.data || []);
        const mataRaniCategories = categories.filter(c => {
          const categoryText = `${c?.name || ""} ${c?.slug || ""}`.toLowerCase();
          return categoryText.includes("mata") || categoryText.includes("rani");
        });

        const categoryProducts = await Promise.all(
          mataRaniCategories
            .map(category => category._id || category.id)
            .filter(Boolean)
            .map(categoryKey => apiClient.get(`/api/products/category/${categoryKey}`).catch(() => null))
        );
        let loadedProducts = categoryProducts.flatMap(getProducts);

        loadedProducts = loadedProducts.filter((product, index, allProducts) =>
          index === allProducts.findIndex(item => String(item._id || item.id) === String(product._id || product.id))
        );

        // Some products expose only their category object, so retain a name/category fallback.
        if (loadedProducts.length === 0) {
          const allProducts = getProducts(await apiClient.get("/api/products"));
          loadedProducts = allProducts.filter(product => {
            const categoryValues = [
              product.category?.name,
              product.category?.slug,
              typeof product.category === "string" ? product.category : "",
              ...(Array.isArray(product.categories) ? product.categories.flatMap(category => [category?.name, category?.slug, category]) : [])
            ].filter(Boolean).join(" ").toLowerCase();
            const productName = (product.name || product.title || "").toLowerCase();
            return categoryValues.includes("mata") || categoryValues.includes("rani") || productName.includes("mata") || productName.includes("rani");
          });
        }

        setProducts(loadedProducts);
      } catch (error) {
        console.error("Error fetching Mata Rani products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-[#FFF6E8]">
        <Loader2 className="animate-spin text-[#135B42]" size={40} />
      </div>
    );
  }

  return (
    <section id="mata-rani-section" className="mx-auto max-w-[1720px] w-full bg-[#F8F6F3] py-10 sm:py-14 md:py-16 lg:py-[54px]">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 md:px-16 lg:px-24">
        {/* Header */}
        <div className="mb-8 flex flex-row items-center justify-between gap-4 sm:mb-10 lg:mb-11">
          <h2 className="text-[20px] sm:text-[32px] md:text-[36px] lg:text-[40px] font-semibold font-playfair leading-tight text-[#303030]">
            Mata Rani ji Dresses
          </h2>

          <div className="flex gap-2 sm:gap-3 shrink-0">
            <button className="mr-prev flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[#135B42] text-[#135B42] bg-transparent transition-all hover:bg-[#135B42] hover:text-white cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <button className="mr-next flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#135B42] border border-[#135B42] text-white transition-all hover:bg-transparent hover:text-[#135B42] cursor-pointer">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_404px] lg:gap-8 items-stretch">
          {/* Product cards CAROUSEL */}
          <div className="overflow-hidden min-w-0 order-2 lg:order-1 flex flex-col justify-center">
            <Swiper
              modules={[Navigation, Autoplay]}
              navigation={{
                prevEl: ".mr-prev",
                nextEl: ".mr-next",
              }}
              spaceBetween={12}
              slidesPerView={1}
              loop={true}
              autoplay={{ delay: 4000 }}
              breakpoints={{
                480: { slidesPerView: 1.2, spaceBetween: 16 },
                640: { slidesPerView: 1.5, spaceBetween: 20 },
                768: { slidesPerView: 2, spaceBetween: 24 },
                1024: { slidesPerView: 2, spaceBetween: 24 },
                1280: { slidesPerView: 2, spaceBetween: 30 },
              }}
              className="w-full h-full"
            >

              {products.map((product) => (
                <SwiperSlide key={product.id} className="!h-auto flex">
                  <div className="h-full w-full max-w-[400px] mx-auto flex">
                    <div className="w-full flex-1">
                      <ProductCard product={product} />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Promo card */}
          <div className="relative w-full lg:w-[300px] xl:w-[404px] h-[320px] sm:h-[400px] lg:h-full min-h-0 overflow-hidden bg-white lg:bg-transparent ring-1 ring-[#EFEAE4] rounded-sm shadow-sm order-1 lg:order-2 flex flex-col justify-end">
            <img
              src={"https://res.cloudinary.com/t4gae59t/image/upload/v1787657441/mata_ranii.png"}
              alt="Premium dress collection"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.currentTarget.style.visibility = "hidden";
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />

            <div className="relative z-10 p-6 sm:p-7">
              <h3 className="max-w-[350px] font-playfair text-[24px] font-medium leading-tight text-white sm:text-[34px] lg:text-[28px] xl:text-[33px]">
                Get Premium Dress collection for Mata Rani ji
              </h3>

              <Link href="/shop?category=mata-rani">
                <button className="mt-4 inline-flex items-center gap-2 bg-white px-6 py-2.5 text-[14px] sm:text-[15px] font-medium text-[#000000] transition-all duration-300 cursor-pointer rounded-sm shadow-sm">
                  View All
                  <ArrowRight size={16} />

                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
