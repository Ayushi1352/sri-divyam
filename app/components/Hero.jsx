"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { apiClient } from '../utils/apiClient';

export default function Hero() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const IMAGE_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/uploads/`;

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const data = await apiClient.get("/api/hero-slides?activeOnly=true");
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          setSlides(data.data);
        } else if (data && data.slides && Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides);
        } else if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
        }
      } catch (error) {
        console.error("Failed to fetch hero slides:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  // Fallback static slide if API fails or returns no slides
  const defaultSlides = [
    {
      id: "default-1",
      title: "Where Devotion Meets",
      subtitle: "Royal Elegance",
      description: "Exquisite Dresses for Laddu Gopal,\nRadha Krishna & Mata Rani",
      linkUrl: "/shop",
      buttonText: "Shop Now",
      imageUrl: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774856926/krishna-image.png"
    }
  ];

  const activeSlides = slides.length > 0 ? slides : defaultSlides;

  return (
    <section className="relative w-full bg-[#FDF6ED] overflow-hidden">
      


      {loading ? (
        <div className="mx-auto max-w-[1720px] w-full md:h-[500px] lg:h-[580px] h-[400px] flex items-center justify-center">
          <div className="animate-pulse bg-[#fde9d2] w-full h-full rounded-sm"></div>
        </div>
      ) : (
        <Swiper
          modules={[Navigation, Autoplay, Pagination, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          spaceBetween={0}
          slidesPerView={1}
          speed={1}
          navigation
          loop={true}
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          className="mx-auto max-w-[1720px] w-full h-auto"
        >
          {activeSlides.map((slide) => {
            const isDefault = slide.id === "default-1";
            // Map API fields (e.g., title, subtitle, image_path)
            const title = slide.title !== undefined ? slide.title : "Where Devotion Meets";
            const subtitle = slide.subtitle !== undefined ? slide.subtitle : "Royal Elegance";
            const description = slide.description !== undefined ? slide.description : "";
            const linkUrl = slide.linkUrl || slide.link_url || slide.ctaLink || "/shop";
            const buttonText = slide.buttonText || slide.button_text || slide.ctaText || "Shop Now";
            const imagePath = slide.image || slide.image_path;
            const imageUrl = isDefault 
              ? slide.imageUrl 
              : imagePath?.startsWith('http') 
                ? imagePath 
                : `${IMAGE_BASE_URL}${imagePath}`;

            return (
              <SwiperSlide key={slide.id || slide._id}>
                <div className="w-full lg:h-[580px] h-auto flex flex-col lg:flex-row items-center justify-between pt-10 pb-0 lg:py-0 relative">
                  
                  {/* Background Image Layer (Feather Watermark) - Right Side Only */}
                  <div
                    className="hidden md:block absolute right-0 top-0 bottom-0 w-[500px] lg:w-[700px] xl:w-[800px] bg-contain bg-no-repeat bg-right z-0 opacity-80 pointer-events-none"
                    style={{ backgroundImage: 'url("https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774856924/Where%20Devotion%20Meets%20Royal%20Elegance.png")' }}
                  />

                  {/* Left Side: Text and CTA */}
                  <div className="w-full lg:w-1/2 pl-6 sm:pl-12 lg:pl-24 xl:pl-32 pr-4 lg:pr-10 text-center lg:text-left relative z-10 mx-auto">
                    
                    <h1 className="text-[28px] sm:text-[36px] md:text-[44px] lg:text-[50px] xl:text-[54px] font-playfair font-bold text-[#1A1A1A] leading-[1.15]">
                      {title}
                    </h1>
                    {subtitle && (
                      <h2 className="mt-2 text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] xl:text-[36px] font-playfair font-medium text-[#4A4A4A] leading-[1.2]">
                        {subtitle}
                      </h2>
                    )}

                    {description && (
                      <p className="mt-3 md:mt-4 text-[13px] sm:text-[14px] md:text-[16px] text-[#666666] font-poppins font-normal max-w-xl mx-auto lg:mx-0 whitespace-pre-line leading-relaxed">
                        {description}
                      </p>
                    )}

                    <Link href={linkUrl}>
                      <button className="mt-6 md:mt-8 rounded-[2px] bg-[#135B42] border border-[#135B42] px-8 md:px-10 py-2.5 sm:py-3 text-[14px] md:text-[15px] font-medium text-white hover:bg-white hover:text-[#135B42] transition-all duration-300 shadow-sm active:scale-95 cursor-pointer">
                        {buttonText}
                      </button>
                    </Link>
                  </div>

                  {/* Right Side: Image Container */}
                  <div className="mt-10 lg:mt-0 w-full lg:w-1/2 flex items-center justify-center relative z-10 h-full lg:pr-10 xl:pr-16">
                    <div className="w-full h-[350px] sm:h-[450px] lg:h-[550px] flex items-center justify-center py-4 lg:py-8">
                      <img
                        src={imageUrl}
                        alt={title}
                        className="relative w-full h-full object-contain object-center"
                      />
                    </div>
                  </div>
                  
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}

    </section>
  );
}
