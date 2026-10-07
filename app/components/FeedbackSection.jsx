"use client";

import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { Star, Loader2 } from "lucide-react";
import { apiClient } from "../utils/apiClient";
import "swiper/css";
import "swiper/css/navigation";

// Static fallback reviews shown if API returns no data
const FALLBACK_REVIEWS = [
  {
    _id: "1",
    rating: 5,
    comment: "Supporting Sri Divyam has been a truly uplifting experience. Knowing that my purchase helps spread devotion and quality poshaks brings deep satisfaction to my heart.",
    user: { name: "Rajesh Verma" },
    title: "Wonderful Experience",
  },
  {
    _id: "2",
    rating: 5,
    comment: "The poshaks from Sri Divyam empower countless devotees. The fabric quality and embroidery are divine. Thank you for spreading divine love across every corner.",
    user: { name: "Ananya Patel" },
    title: "Truly Inspiring",
  },
  {
    _id: "3",
    rating: 5,
    comment: "Every dress spreads love and devotion. I am very grateful for this divine store. The colors and finishing of Laddu Gopal dresses are absolutely top notch.",
    user: { name: "Rohit Kumar" },
    title: "Amazing Community",
  },
  {
    _id: "4",
    rating: 5,
    comment: "The quality of the poshaks is absolutely divine. Each stitch reflects pure love and devotion. My Laddu Gopal ji looks so beautiful in these dresses. Highly recommended!",
    user: { name: "Priya Sharma" },
    title: "Beautiful Craftsmanship",
  },
  {
    _id: "5",
    rating: 5,
    comment: "I ordered a Radha Krishna dress set and was amazed by the quality. The fabric is soft and the embroidery is intricate. Delivery was also super quick.",
    user: { name: "Suresh Mehta" },
    title: "Great Quality",
  },
  {
    _id: "6",
    rating: 5,
    comment: "I have been purchasing from Sri Divyam for over a year. Every product is crafted with pure devotion. The Mata Rani dress I ordered was perfect. Jai Mata Di!",
    user: { name: "Kavita Devi" },
    title: "Pure Devotion",
  },
];

function QuoteIcon() {
  return (
    <svg
      viewBox="0 0 42 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-[28px] sm:h-[32px] w-auto opacity-80"
      aria-hidden="true"
    >
      <path
        d="M15.099 2.246C11.166 4.064 8.728 7.01 7.787 11.084c-.213.92-.319 1.822-.319 2.707 0 3.575 1.728 5.363 5.186 5.363 1.552 0 2.84-.46 3.861-1.382 1.022-.92 1.533-2.105 1.533-3.55 0-1.304-.45-2.406-1.348-3.31-.878-.92-1.935-1.418-3.17-1.488.249-1.694 1.286-3.336 3.117-4.925l1.772-1.542L15.099 2.246ZM31.677 2.246c-3.95 1.818-6.387 4.764-7.31 8.838a12.64 12.64 0 0 0-.32 2.707c0 3.575 1.72 5.363 5.16 5.363 1.57 0 2.866-.46 3.888-1.382 1.022-.92 1.533-2.105 1.533-3.55 0-1.304-.45-2.406-1.347-3.31-.88-.92-1.936-1.418-3.171-1.488.248-1.694 1.286-3.336 3.117-4.925l1.773-1.542-3.323-.711Z"
        stroke="#DAC153"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5 mt-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rating ? "fill-[#DAC153] text-[#DAC153]" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  );
}

export default function FeedbackSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const endpoints = ["/api/reviews", "/api/reviews/all", "/api/testimonials"];
        let fetched = [];
        for (const endpoint of endpoints) {
          try {
            const data = await apiClient.get(endpoint);
            const arr = data?.reviews || data?.data || data?.testimonials || (Array.isArray(data) ? data : []);
            if (arr.length > 0) {
              fetched = arr;
              break;
            }
          } catch {
            continue;
          }
        }
        setReviews(fetched.length >= 3 ? fetched : FALLBACK_REVIEWS);
      } catch {
        setReviews(FALLBACK_REVIEWS);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const displayReviews = reviews.length > 0 ? reviews : FALLBACK_REVIEWS;

  return (
    <section className="mx-auto max-w-[1720px] bg-[#FFFFFF] pt-10 sm:pt-16 md:pt-20 lg:pt-[88px] pb-8 sm:pb-10 md:pb-12 lg:pb-[56px] overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 md:px-16 lg:px-16 xl:px-24">
        <div className="mb-8 text-center sm:mb-12 md:mb-14">
          <h2 className="font-serif text-[20px] sm:text-[34px] md:text-[40px] lg:text-[46px] font-playfair font-semibold leading-tight text-[#303030]">
            Customer Feedback
          </h2>
          <p className="mt-2 text-[14px] sm:text-[15px] text-gray-500 font-gt-walsheim">
            What our devotees say about us
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#135B42]" size={36} />
          </div>
        ) : (
          <Swiper
            modules={[Autoplay, Navigation]}
            spaceBetween={24}
            slidesPerView={1}
            loop={true}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
            }}
            className="w-full !pb-4"
          >
            {displayReviews.map((item, index) => {
              const name = item?.user?.name || item?.name || item?.reviewer || "Customer";
              const comment = item?.comment || item?.message || item?.review || item?.quote || "";
              const rating = item?.rating ?? 5;

              return (
                <SwiperSlide key={item._id || item.id || index} className="!h-auto flex">
                  <article className="rounded-[20px] sm:rounded-[28px] border border-[#EDEDED] bg-white px-5 py-6 sm:px-6 sm:py-7 md:px-7 md:py-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between w-full h-full min-h-[290px]">
                    <div>
                      <div className="mb-4 shrink-0">
                        <QuoteIcon />
                      </div>

                      <p className="w-full text-[14px] sm:text-[15px] leading-relaxed font-medium font-gt-walsheim text-gray-700 line-clamp-4 min-h-[96px] flex items-center">
                        {comment}
                      </p>
                    </div>

                    <div className="mt-4 shrink-0">
                      <div className="mb-5 h-px w-full bg-[#F0F0F0]" />
                      <div className="flex flex-col">
                        <h3 className="text-[17px] sm:text-[18px] font-semibold leading-none text-[#1E1E2D]">
                          {name}
                        </h3>
                        <StarRating rating={rating} />
                      </div>
                    </div>
                  </article>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </div>
    </section>
  );
}
