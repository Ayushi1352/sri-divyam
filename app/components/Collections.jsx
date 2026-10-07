"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrency } from '../context/CurrencyContext';
import { apiClient } from '../utils/apiClient';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel, FreeMode } from 'swiper/modules';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';

const IMAGE_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/uploads/`;

// Map slugs to their respective images
const categoryImages = {
  "laddu-gopal": "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774867814/laddu-Gopal.png",
  "radhe-rani": "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774867815/radha-krishna.png",
  "mata-rani": "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774867815/mata-rani.png"
};

const defaultImages = [
  "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774867814/laddu-Gopal.png",
  "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774867815/radha-krishna.png",
  "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774867815/mata-rani.png"
];

export default function Collections() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get("/api/categories");
        if (isMounted) {
          if (Array.isArray(data)) {
            setProducts(data);
          } else if (data.data && Array.isArray(data.data)) {
            setProducts(data.data);
          } else if (data.categories && Array.isArray(data.categories)) {
            setProducts(data.categories);
          } else {
            throw new Error("Invalid format");
          }
        }
      } catch (error) {
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-[#FFF6E8] w-full">
        <Loader2 className="animate-spin text-[#135B42]" size={40} />
      </div>
    );
  }

  if (products.length === 0) return null;

  const displayProducts = products;

  return (
    <section id="premium-collections" className="mx-auto max-w-[1720px] py-10 sm:py-16 md:py-20 bg-[#FFF6E8] w-full h-auto overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 md:px-16 lg:px-24">

        <div className="relative w-full flex items-center justify-between md:justify-center mb-8 md:mb-14">
          <h2 className="text-[20px] sm:text-[32px] md:text-[44px] font-playfair text-[#135B42] font-bold text-left md:text-center">
            Premium Collections
          </h2>

          <div className="relative md:absolute right-0 flex gap-2 sm:gap-3 shrink-0 z-30">
            <button className="pc-prev w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border border-[#135B42] text-[#135B42] rounded-full hover:bg-[#135B42] hover:text-white transition cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <button className="pc-next w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-[#135B42] border border-[#135B42] text-white rounded-full hover:bg-transparent hover:text-[#135B42] transition cursor-pointer">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <Swiper
          modules={[Navigation, Mousewheel, FreeMode]}
          navigation={{
            prevEl: ".pc-prev",
            nextEl: ".pc-next",
          }}
          mousewheel={{ forceToAxis: true }}
          freeMode={true}
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            480: { slidesPerView: 1.2, spaceBetween: 16 },
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 30 },
          }}
          className="w-full !pb-2"
        >
          {displayProducts.map((item, index) => {
            // Resolve the image robustly
            const rawImage = item.image || item.image_url || item.image_path || item.thumbnail || item.src;
            let imageStr = null;
            if (typeof rawImage === 'string') imageStr = rawImage;
            else if (rawImage && typeof rawImage === 'object' && rawImage.src) imageStr = rawImage.src;
            else if (rawImage && typeof rawImage === 'object' && rawImage.url) imageStr = rawImage.url;

            const imageUrl = imageStr
              ? (imageStr.startsWith('http') ? imageStr : `${IMAGE_BASE_URL}${imageStr.replace(/^\//, '')}`)
              : "";

            // Resolve the link (Point to shop page with category filter)
            const href = `/shop?category=${item._id || item.id || item.slug || encodeURIComponent(item.name)}`;

            return (
              <SwiperSlide key={`${item.id || item.slug}-${index}`}>
                <div
                  className="w-full aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] lg:h-[500px] overflow-hidden shrink-0 group relative flex flex-col mx-auto"
                >
                  <img 
                    src={imageUrl || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.currentTarget.style.backgroundColor = '#f3f4f6'; // Gray fallback
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="premium-overlay absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500 z-10 pointer-events-none" />
                  
                  {/* Text Container */}
                  <div className="premium-content pointer-events-none absolute inset-0 flex flex-col justify-end p-6 md:p-8 z-20 transition-all duration-500">
                    <h3 className="premium-title text-white text-[20px] sm:text-[22px] md:text-[26px] font-bold font-gt-walsheim mb-1 transition-transform duration-500">
                      {item.name}
                    </h3>
                    <p className="premium-desc text-white/90 text-[14px] sm:text-[15px] font-gt-walsheim mb-5 transition-transform duration-500 delay-75 line-clamp-1">
                      {item.description || item.short_description || `The Bal Roop Collection`}
                    </p>
                    
                    <div className="premium-btn pointer-events-auto transition-transform duration-500 delay-150 inline-block w-fit">
                      <Link href={href}>
                        <span className="inline-block text-white font-bold text-[14px] sm:text-[16px] font-playfair tracking-wider uppercase border-b-2 border-white pb-1 hover:text-gray-200 hover:border-gray-200 transition-colors cursor-pointer">
                          SHOP NOW
                        </span>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Custom CSS to handle Mobile Always-On & Desktop Hover reliably */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @media (min-width: 1024px) {
                      .group .premium-overlay { opacity: 1; }
                      .group .premium-content { opacity: 1; }
                      .group .premium-title { transform: translateY(0); }
                      .group .premium-desc { transform: translateY(0); }
                      .group .premium-btn { transform: translateY(0); }
                    }
                    @media (max-width: 1023px) {
                      .group .premium-overlay { opacity: 1; }
                      .group .premium-content { opacity: 1; }
                      .group .premium-title { transform: translateY(0); }
                      .group .premium-desc { transform: translateY(0); }
                      .group .premium-btn { transform: translateY(0); }
                    }
                  `}} />
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

      </div>
    </section>
  );
}


