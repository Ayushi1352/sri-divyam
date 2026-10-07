"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CancellationPolicy() {
  return (
    <main>
      <Header />
      <div className="bg-[#FDFDFD] min-h-screen font-poppins">
        {/* Hero Section */}
        <div className="bg-[#135B42] text-white py-12 md:py-16">
          <div className="mx-auto max-w-[1440px] px-6 sm:px-10 md:px-16 lg:px-24">
            <div className="flex items-center gap-2 text-sm text-white/80 mb-4">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={14} />
              <span className="text-white">Cancellation Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold">Cancellation Policy</h1>
            <p className="mt-4 text-white/80 max-w-2xl text-sm sm:text-base">
              Learn about our rules and procedures for modifying or canceling your orders.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="mx-auto max-w-[1000px] px-6 sm:px-10 md:px-16 lg:px-24 py-12 md:py-20">
          <div className="prose prose-lg max-w-none text-[#4B4B5C]">
            
            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                1. Order Cancellation by Customer
              </h2>
              <p className="mb-4 leading-relaxed">
                At Sri Divyam, we begin processing your divine orders almost immediately to ensure timely delivery. You may request to cancel your order within <strong>24 hours</strong> of placing it, provided the order has not yet been processed or dispatched.
              </p>
              <p className="leading-relaxed">
                To request a cancellation, please email us immediately at <strong>sridivyamofficial@gmail.com</strong> with your Order ID. If the cancellation is approved, a full refund will be initiated to your original method of payment.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                2. Non-Cancellable Orders
              </h2>
              <p className="leading-relaxed mb-4">
                Because many of our premium God dresses and spiritual accessories are handcrafted and made-to-order, we cannot accept cancellations under the following conditions:
              </p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#DAC153] mb-4">
                <li>If the request is made after <strong>24 hours</strong> of placing the order.</li>
                <li>If the order has already been processed, packed, or handed over to our courier partner.</li>
                <li>If the order contains customized or personalized items crafted specifically for you.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                3. Order Cancellation by Sri Divyam
              </h2>
              <p className="leading-relaxed mb-4">
                Sri Divyam reserves the right to cancel any order under specific circumstances. If your order is canceled by us, you will be notified immediately and a full refund will be processed.
              </p>
              <p className="leading-relaxed">
                Reasons for cancellation by Sri Divyam may include, but are not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#DAC153] mb-4">
                <li>Non-availability of the product, raw materials, or specific fabrics.</li>
                <li>Inaccuracies or errors in pricing or product information.</li>
                <li>Issues identified by our fraud avoidance department regarding the payment.</li>
                <li>Delivery locations that our courier partners cannot service.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                4. Refund Process for Cancellations
              </h2>
              <p className="leading-relaxed mb-4">
                If your cancellation request is successfully approved before the order is dispatched, or if we cancel your order, your refund will be initiated within <strong>2 to 3 business days</strong>.
              </p>
              <p className="leading-relaxed">
                Depending on your bank or credit card issuer, it may take an additional <strong>5 to 7 business days</strong> for the refunded amount to reflect in your account. The refund will always be credited back to the original payment method used during the purchase.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                5. Modifications to Orders
              </h2>
              <p className="leading-relaxed mb-4">
                If you wish to modify your order (e.g., change the size of a dress or update the shipping address) rather than cancel it entirely, please contact us within <strong>12 hours</strong> of placing the order. 
              </p>
              <p className="leading-relaxed">
                Modifications are subject to availability and cannot be guaranteed once the production or packing process has commenced.
              </p>
            </section>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
