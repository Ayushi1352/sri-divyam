"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Star, CheckCircle, MessageSquare } from "lucide-react";
import { apiClient } from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";

export default function ProductReviews({ productId, product, initialReviews = [], variant = "full" }) {
  const { isLoggedIn } = useAuth();
  const [reviews, setReviews] = useState(initialReviews || product?.reviews || []);
  const [loading, setLoading] = useState(!initialReviews?.length && !product?.reviews?.length);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    comment: "",
  });

  useEffect(() => {
    if (variant === "summary" || !isLoggedIn || !productId) {
      setHasPurchased(false);
      return;
    }

    const productIdentifiers = new Set(
      [productId, product?.id, product?._id, product?.slug]
        .filter(Boolean)
        .map((value) => String(value))
    );

    const hasMatchingProduct = (item) => {
      const identifiers = [
        item?.product_id,
        item?.productId,
        item?.product?.id,
        item?.product?._id,
        item?.product?.product_id,
        item?.product?.productId,
        item?.product?.slug,
        item?.slug,
      ].filter(Boolean);

      return identifiers.some((value) => productIdentifiers.has(String(value)));
    };

    const fetchPurchaseStatus = async () => {
      setPurchaseLoading(true);
      try {
        const data = await apiClient.get("/api/orders");
        const orders = data?.orders || data?.data || (Array.isArray(data) ? data : []);
        const purchased = Array.isArray(orders) && orders.some((order) => {
          const items = order?.items || order?.order_items || order?.orderItems || [];
          return Array.isArray(items) && items.some(hasMatchingProduct);
        });
        setHasPurchased(purchased);
      } catch {
        setHasPurchased(false);
      } finally {
        setPurchaseLoading(false);
      }
    };

    fetchPurchaseStatus();
  }, [isLoggedIn, productId, product?.id, product?._id, product?.slug]);

  useEffect(() => {
    if (initialReviews && initialReviews.length > 0) {
      setReviews(initialReviews);
      setLoading(false);
      return;
    }
    if (product?.reviews && product.reviews.length > 0) {
      setReviews(product.reviews);
      setLoading(false);
      return;
    }
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      try {
        const res = await apiClient.get(`/api/products/${productId}/reviews`).catch(() => null);
        if (res) {
          const reviewList = res.reviews || res.data || (Array.isArray(res) ? res : []);
          if (Array.isArray(reviewList) && reviewList.length > 0) {
            setReviews(reviewList);
          }
        }
      } catch (err) {
        // Silently fall back to empty reviews
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [productId, initialReviews, product?.reviews]);

  // Dynamic calculations
  const totalCount = reviews.length;
  const avgRating = useMemo(() => {
    if (totalCount === 0) {
      return product?.rating > 0 ? Number(product.rating).toFixed(1) : "5.0";
    }
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
    return (sum / totalCount).toFixed(1);
  }, [reviews, totalCount, product?.rating]);

  const ratingBreakdown = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => Math.round(Number(r.rating || 5)) === star).length;
      const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      return { stars: star, count, percent: `${percent}%` };
    });
  }, [reviews, totalCount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setMessage({ type: "error", text: "Please log in to review this product." });
      return;
    }
    if (!hasPurchased) {
      setMessage({ type: "error", text: "You can review this product after purchasing it." });
      return;
    }
    if (!formData.title || !formData.comment) {
      setMessage({ type: "error", text: "Please fill in all review fields." });
      return;
    }

    setSubmitLoading(true);
    setMessage(null);

    const newReview = {
      ...formData,
      id: Date.now(),
      _id: `rev_${Date.now()}`,
      user: { name: "Devotee" },
      reviewer: "Devotee",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      created_at: new Date().toISOString()
    };

    try {
      if (productId) {
        await apiClient.post(`/api/products/${productId}/reviews`, formData);
      }
      setMessage({ type: "success", text: "Thank you! Your devotional review was submitted successfully." });
      setReviews(prev => [newReview, ...prev]);
      setFormData({ rating: 5, title: "", comment: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Unable to submit your review. Please try again." });
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderStars = (rating, size = 15) => (
    <div className="flex gap-0.5 text-[#F5A623]">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={rating >= star ? "fill-[#F5A623] text-[#F5A623]" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  );

  /* ---- Compact rating summary — rendered in the left column, below Buy Now ---- */
  if (variant === "summary") {
    return (
      <div className="w-full font-sans flex flex-col gap-4">
        <div className="bg-[#F5F5F5] p-4 rounded-lg border border-[#E8E0D5] flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-[#135B42] font-playfair">
            {totalCount > 0 ? avgRating : "5.0"}
          </span>
          <div className="mt-1.5 mb-1">{renderStars(Math.round(Number(totalCount > 0 ? avgRating : 5)), 16)}</div>
          <span className="text-xs text-gray-500 font-medium">
            {totalCount > 0 ? `Based on ${totalCount} Devotee Review${totalCount === 1 ? '' : 's'}` : "No reviews submitted yet"}
          </span>
          <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#8C5D36] bg-[#F1E8DC] px-2.5 py-0.5 rounded-full">
            100% Verified Devotional Purchases
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {ratingBreakdown.map((item) => (
            <div key={item.stars} className="flex items-center gap-2.5 text-xs text-gray-600">
              <span className="w-10 font-medium flex items-center gap-1">
                {item.stars} <Star size={11} className="fill-[#F5A623] text-[#F5A623]" />
              </span>
              <div className="flex-1 h-2 bg-[#EFEAE3] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#135B42] rounded-full transition-all duration-500"
                  style={{ width: totalCount > 0 ? item.percent : "0%" }}
                />
              </div>
              <span className="w-10 text-right font-medium text-gray-400">
                {totalCount > 0 ? item.percent : "0%"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans">

      {/* 1. Header & Rating Summary */}
      {variant !== "list" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-[#EBE4DA]">

          {/* Average Score Box */}
          <div className="bg-[#F5F5F5] p-5 rounded-lg border border-[#E8E0D5] flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold text-[#135B42] font-playfair">
              {totalCount > 0 ? avgRating : "5.0"}
            </span>
            <div className="mt-1.5 mb-1">{renderStars(Math.round(Number(avgRating)), 18)}</div>
            <span className="text-xs text-gray-500 font-medium">
              {totalCount > 0 ? `Based on ${totalCount} Devotee Review${totalCount === 1 ? '' : 's'}` : "No reviews submitted yet"}
            </span>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#8C5D36] bg-[#F1E8DC] px-2.5 py-0.5 rounded-full">
              100% Verified Devotional Purchases
            </span>
          </div>

          {/* Rating Breakdown */}
          <div className="md:col-span-2 flex flex-col justify-center gap-2">
            {ratingBreakdown.map((item) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs text-gray-600">
                <span className="w-12 font-medium flex items-center gap-1">
                  {item.stars} <Star size={11} className="fill-[#F5A623] text-[#F5A623]" />
                </span>
                <div className="flex-1 h-2 bg-[#EFEAE3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#135B42] rounded-full transition-all duration-500"
                    style={{ width: item.percent }}
                  />
                </div>
                <span className="w-12 text-right font-medium text-gray-400">
                  {totalCount > 0 ? item.percent : "0%"}
                </span>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 2. Reviews List */}
      <div className={`space-y-3 ${variant === "list" ? "pb-3" : "py-6"}`}>
        <h3 className="font-playfair text-xl font-bold text-[#2A2421] flex items-center gap-2">
          <MessageSquare size={18} className="text-[#135B42]" />
          Devotee Experiences {totalCount > 0 && `(${totalCount})`}
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#135B42]" size={28} />
          </div>
        ) : totalCount === 0 ? (
          <div className="bg-[#F5F5F5] p-4 rounded-lg border border-[#EBE4DA] text-center">
            <p className="text-sm text-gray-600 mb-1">Be the first devotee to review this sacred poshak!</p>
            <p className="text-xs text-gray-400">Share your devotion and experience with our sacred craftsmanship.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <div key={review.id || review._id || idx} className="p-4 sm:p-5 rounded-lg border border-[#EFEAE3] bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#F3EDE3] text-[#135B42] font-bold text-xs flex items-center justify-center border border-[#E5DDD2]">
                      {(review.user?.name || review.name || review.reviewer || "D").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#2C2623] text-sm">
                          {review.user?.name || review.name || review.reviewer || "Devotee"}
                        </span>
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          <CheckCircle size={10} className="mr-0.5" /> Verified
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {review.date || (review.createdAt || review.created_at ? new Date(review.createdAt || review.created_at).toLocaleDateString('en-GB') : "Verified Purchase")}
                      </span>
                    </div>
                  </div>
                  <div>{renderStars(Number(review.rating || 5))}</div>
                </div>

                {review.title && <h4 className="font-semibold text-sm text-[#303030] mt-2 mb-1">{review.title}</h4>}
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Write a Review Form */}
      <div className="mt-3 border-t border-[#EBE4DA] pt-3">
        <h3 className="font-playfair text-xl font-bold text-[#2A2421] mb-2">Write a Review</h3>
        <p className="text-xs text-gray-500 mb-3">
          {!isLoggedIn
            ? "Log in and purchase this product to share your experience."
            : purchaseLoading
              ? "Checking your purchase history..."
              : hasPurchased
                ? "Your feedback helps fellow devotees make inspired choices."
                : "Only customers who have purchased this product can write a review."}
        </p>

        {isLoggedIn && hasPurchased && !purchaseLoading ? (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl bg-[#F5F5F5] p-5 sm:p-6 rounded-lg border border-[#EBE4DA]">
          {/* Star Selector */}
          <div>
            <label className="block text-xs font-bold text-[#303030] uppercase mb-2">Your Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    size={26}
                    className={formData.rating >= star ? "fill-[#F5A623] text-[#F5A623]" : "fill-gray-200 text-gray-300"}
                  />
                </button>
              ))}
              <span className="text-xs text-gray-500 font-medium ml-2">
                {formData.rating === 5 ? "Divine / Excellent" : formData.rating === 4 ? "Very Good" : formData.rating === 3 ? "Good" : formData.rating === 2 ? "Fair" : "Poor"}
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#303030] uppercase mb-1.5">Review Headline</label>
            <input
              type="text"
              required
              placeholder="e.g. Beautiful finishing and vibrant colors for Kanha Ji!"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-white border border-[#E0D8CE] rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#303030] focus:outline-none focus:border-[#135B42] focus:ring-1 focus:ring-[#135B42] transition-colors"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-[#303030] uppercase mb-1.5">Detailed Experience</label>
            <textarea
              required
              rows={4}
              placeholder="Describe the fabric quality, embroidery details, fit, and devotional satisfaction..."
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="w-full bg-white border border-[#E0D8CE] rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#303030] focus:outline-none focus:border-[#135B42] focus:ring-1 focus:ring-[#135B42] transition-colors resize-none"
            />
          </div>

          {/* Feedback Message */}
          {message && (
            <div className={`p-3 rounded-md text-xs font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitLoading}
            className="px-6 py-3 rounded-md bg-[#135B42] hover:bg-[#0E4935] text-white text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
          >
            {submitLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>Submit Devotional Review</span>
          </button>
          </form>
        ) : (
          <div className="max-w-2xl bg-[#F5F5F5] p-4 rounded-lg border border-[#EBE4DA] text-sm text-gray-600">
            {isLoggedIn ? "Purchase this product to unlock the review form." : "Log in to see whether you are eligible to review this product."}
          </div>
        )}
      </div>

    </div>
  );
}
