"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PrivacyPolicy() {
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
              <span className="text-white">Privacy Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold">Privacy Policy</h1>
            <p className="mt-4 text-white/80 max-w-2xl text-sm sm:text-base">
              Your privacy isss important to us. Learn how we collect, use, and protect your information.
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
                At Sri Divyam, accessible from sridivyam.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Sri Divyam and how we use it.
              </p>
              <p className="leading-relaxed">
                If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                2. Information We Collect
              </h2>
              <p className="mb-4 leading-relaxed">
                We collect personal information that you voluntarily provide to us when you register on the Website, express an interest in obtaining information about us or our products, when you participate in activities on the Website, or otherwise when you contact us.
              </p>
              <p className="leading-relaxed">
                The personal information that we collect depends on the context of your interactions with us and the Website, the choices you make, and the products and features you use. The personal information we collect may include the following:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4 marker:text-[#DAC153]">
                <li><strong>Personal Data:</strong> Name, phone numbers, email addresses, mailing addresses, billing addresses, and other similar information.</li>
                <li><strong>Payment Data:</strong> We may collect data necessary to process your payment if you make purchases, such as your payment instrument number and the security code associated with your payment instrument.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                3. How We Use Your Information
              </h2>
              <p className="leading-relaxed mb-4">
                We use the information we collect in various ways, including to:
              </p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#DAC153]">
                <li>Provide, operate, and maintain our website</li>
                <li>Improve, personalize, and expand our website</li>
                <li>Understand and analyze how you use our website</li>
                <li>Process your orders, manage your account, and deliver the handcrafted products you purchased</li>
                <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
                <li>Find and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                4. Data Sharing and Disclosure
              </h2>
              <p className="leading-relaxed mb-4">
                We respect your privacy and will never sell, rent, or trade your personal information to third parties for their marketing purposes.
              </p>
              <p className="leading-relaxed">
                We may share your information with trusted third-party service providers who assist us in operating our website, conducting our business, securely processing your payments, or servicing you, so long as those parties agree to keep this information confidential.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                5. Data Security
              </h2>
              <p className="leading-relaxed">
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of personal information to and from our Website is at your own risk. You should only access the website within a secure environment.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                6. Your Privacy Rights
              </h2>
              <p className="leading-relaxed">
                Depending on your location, you may have certain rights regarding your personal information, such as the right to request access to the data we collect from you, change that information, or delete it in some circumstances. To request to review, update, or delete your personal information, please contact us using the details below.
              </p>
            </section>

            <div className="mt-12 p-6 bg-[#FFF9F5] border-l-4 border-[#DAC153] rounded-r-md">
              <h3 className="text-[#135B42] font-bold text-lg mb-2">Contact Us</h3>
              <p className="text-sm text-[#4B4B5C]">
                If you have any questions or comments about this policy, you may email us at <a href="mailto:sridivyamofficial@gmail.com" className="text-[#135B42] font-semibold underline">sridivyamofficial@gmail.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
