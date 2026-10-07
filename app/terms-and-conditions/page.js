"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TermsAndConditions() {
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
              <span className="text-white">Terms & Conditions</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold">Terms & Conditions</h1>
            <p className="mt-4 text-white/80 max-w-2xl text-sm sm:text-base">
              Please read these terms and conditions carefully before using our website.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="mx-auto max-w-[1000px] px-6 sm:px-10 md:px-16 lg:px-24 py-12 md:py-20">
          <div className="prose prose-lg max-w-none text-[#4B4B5C]">
            
            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                1. Introduction
              </h2>
              <p className="mb-4 leading-relaxed">
                Welcome to Sri Divyam. These terms and conditions outline the rules and regulations for the use of Sri Divyam's Website, located at sridivyam.com.
              </p>
              <p className="leading-relaxed">
                By accessing this website, we assume you accept these terms and conditions. Do not continue to use Sri Divyam if you do not agree to take all of the terms and conditions stated on this page.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                2. Use of Website
              </h2>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#DAC153]">
                <li>You must be at least 18 years of age to use this website and make a purchase.</li>
                <li>You agree to use this website only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website.</li>
                <li>Unauthorized use of this website may give rise to a claim for damages and/or be a criminal offense.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                3. Product Information
              </h2>
              <p className="mb-4 leading-relaxed">
                Sri Divyam specializes in handcrafted God dresses, including but not limited to Radha Krishna, Mata Rani, and Laddu Gopal attire. Because our items are meticulously handmade by artisans, slight variations in design, color, and embroidery may occur. These variations are a hallmark of handcrafted authenticity and are not considered defects.
              </p>
              <p className="leading-relaxed">
                We make every effort to display as accurately as possible the colors and images of our products. However, we cannot guarantee that your computer monitor's display of any color will be completely accurate.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                4. Pricing & Payment
              </h2>
              <p className="leading-relaxed mb-4">
                All prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue a product without notice at any time.
              </p>
              <p className="leading-relaxed">
                We accept various forms of secure payment methods. You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                5. Shipping & Delivery
              </h2>
              <p className="leading-relaxed mb-4">
                Since our premium dresses are often made-to-order and delicately crafted, processing times may vary. We strive to dispatch all orders within the stipulated time frame mentioned during checkout.
              </p>
              <p className="leading-relaxed">
                Sri Divyam is not liable for any delays caused by courier services, customs clearance, or unforeseen circumstances beyond our control.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                6. Returns & Refunds
              </h2>
              <p className="leading-relaxed">
                Due to the sacred and delicate nature of our deity dresses, returns and exchanges are only accepted in the rare case of a manufacturing defect or if the wrong item was shipped. You must notify us within 48 hours of receiving the product with photographic evidence to process a return or exchange.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                7. Governing Law
              </h2>
              <p className="leading-relaxed">
                These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India.
              </p>
            </section>

            <div className="mt-12 p-6 bg-[#FFF9F5] border-l-4 border-[#DAC153] rounded-r-md">
              <h3 className="text-[#135B42] font-bold text-lg mb-2">Contact Us</h3>
              <p className="text-sm text-[#4B4B5C]">
                If you have any questions about these Terms and Conditions, please contact us at <a href="mailto:sridivyamofficial@gmail.com" className="text-[#135B42] font-semibold underline">sridivyamofficial@gmail.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
