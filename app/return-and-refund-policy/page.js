"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const policySections = [
  {
    title: "1. Our Return Commitment",
    content: [
      "At Sri Divyam, every Radha Krishna, Mata Rani, and Laddu Gopal dress is carefully checked and packed before dispatch. Because our products are handcrafted and made for devotional use, we accept returns only in the cases covered by this policy.",
      "A return, replacement, or refund request is not guaranteed until our team has reviewed the order and the supporting photos or videos."
    ]
  },
  {
    title: "2. When a Return or Replacement Is Accepted",
    content: [
      "You may contact us if the product received is damaged in transit, has a manufacturing defect, or is different from the item ordered. The issue must be reported within 48 hours of delivery.",
      "The product must be unused, unwashed, unaltered, and returned with its original packaging, tags, accessories, and protective materials. Handmade variations in colour, embroidery, embellishment, or finish are not considered defects."
    ]
  },
  {
    title: "3. Items We Cannot Accept for Return",
    list: [
      "Products damaged after delivery because of improper handling, washing, storage, or use.",
      "Products that have been altered, stained, worn, or returned without the original packaging.",
      "Customised, personalised, made-to-order, or specially prepared products, unless they arrive damaged or incorrect.",
      "Returns requested after 48 hours of delivery or without the required order and product evidence."
    ]
  },
  {
    title: "4. How to Request a Return",
    content: [
      "Log in to your Sri Divyam account and open the Return/Refund section from your profile. Select the delivered order, choose the request type, select the reason, and upload clear photos or videos showing the issue.",
      "You can also contact our support team at sridivyamofficial@gmail.com with your order number, registered phone number, reason for the request, and supporting images. Our team may ask for additional information before approving the request."
    ]
  },
  {
    title: "5. Replacement Process",
    content: [
      "If the request is approved, we will arrange a replacement when the same product is available. The original item may need to be collected or returned before the replacement is dispatched.",
      "If the same item is unavailable, our support team will contact you to discuss an appropriate alternative or refund, depending on the order and payment method."
    ]
  },
  {
    title: "6. Refund Process",
    content: [
      "For an approved refund, the product must reach us and pass our quality check. After approval, the refund will be initiated to the original payment method or the payment details provided during the return process.",
      "Refund processing time depends on the payment provider or bank. Shipping charges, cash-on-delivery handling charges, and other non-refundable charges may not be included in the refund unless the issue was caused by an incorrect or defective product sent by us."
    ]
  },
  {
    title: "7. Cash on Delivery Orders",
    content: [
      "For Cash on Delivery orders, we currently offer a direct replacement for eligible damaged, defective, or incorrect products. Refund options may be limited for COD orders and will be confirmed by our support team after reviewing the request."
    ]
  },
  {
    title: "8. Shipping Damage and Delivery Issues",
    content: [
      "Please inspect the parcel at delivery whenever possible. If the outer package is visibly damaged, record it and notify the delivery partner. Share photos of the parcel, shipping label, packaging, and product with us within 48 hours.",
      "Sri Divyam is not responsible for delays caused by courier services, incorrect addresses, or circumstances outside our control, but our team will help coordinate with the courier wherever possible."
    ]
  },
  {
    title: "9. Contact Us",
    content: [
      "For questions about a return, replacement, or refund, contact us with your order details so we can assist you promptly."
    ]
  }
];

export default function ReturnAndRefundPolicy() {
  return (
    <main>
      <Header />
      <div className="bg-[#FDFDFD] min-h-screen font-poppins">
        <div className="bg-[#135B42] text-white py-12 md:py-16">
          <div className="mx-auto max-w-[1440px] px-6 sm:px-10 md:px-16 lg:px-24">
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/80 mb-4">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={14} />
              <span className="text-white">Return &amp; Refund Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold leading-tight">
              Return &amp; Refund Policy
            </h1>
            <p className="mt-4 text-white/80 max-w-2xl text-sm sm:text-base leading-relaxed">
              Our guidelines for returns, replacements, and refunds on handcrafted devotional dresses.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1000px] px-6 sm:px-10 md:px-16 lg:px-24 py-12 md:py-20">
          <div className="prose prose-lg max-w-none text-[#4B4B5C]">
            {policySections.map((section) => (
              <section key={section.title} className="mb-10">
                <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-start gap-3 leading-tight">
                  <span className="h-px w-8 bg-[#DAC153] shrink-0 mt-4" aria-hidden="true"></span>
                  <span>{section.title}</span>
                </h2>
                {section.content?.map((paragraph) => (
                  <p key={paragraph} className="mb-4 last:mb-0 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
                {section.list && (
                  <ul className="list-disc pl-6 space-y-2 marker:text-[#DAC153]">
                    {section.list.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
                {section.title === "9. Contact Us" && (
                  <div className="mt-6 p-5 sm:p-6 bg-[#FFF9F5] border-l-4 border-[#DAC153] rounded-r-md">
                    <p className="text-sm text-[#4B4B5C] leading-relaxed">
                      Email us at <a href="mailto:sridivyamofficial@gmail.com" className="text-[#135B42] font-semibold underline break-words">sridivyamofficial@gmail.com</a> or call <a href="tel:+918433081227" className="text-[#135B42] font-semibold underline whitespace-nowrap">+91 8433081227</a>.
                    </p>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
