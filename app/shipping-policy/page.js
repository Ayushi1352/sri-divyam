"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ShippingPolicy() {
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
              <span className="text-white">Shipping Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold">Shipping Policy</h1>
            <p className="mt-4 text-white/80 max-w-2xl text-sm sm:text-base">
              Learn about our shipping methods, processing times, and delivery details for your divine orders.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="mx-auto max-w-[1000px] px-6 sm:px-10 md:px-16 lg:px-24 py-12 md:py-20">
          <div className="prose prose-lg max-w-none text-[#4B4B5C]">
            
            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                1. Order Processing Time
              </h2>
              <p className="mb-4 leading-relaxed">
                At Sri Divyam, every product is crafted with devotion and care. Standard orders are typically processed and dispatched within <strong>1 to 3 business days</strong>. 
              </p>
              <p className="leading-relaxed">
                Since our premium God dresses and spiritual items are meticulously handcrafted, some custom or intricate orders may require an additional <strong>3 to 5 business days</strong> for crafting before they are shipped. You will be notified if your order requires additional processing time.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                2. Shipping Methods & Delivery Timelines
              </h2>
              <p className="mb-4 leading-relaxed">
                We partner with reliable courier services to ensure your divine items reach you safely and promptly.
              </p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#DAC153] mb-4">
                <li><strong>Standard Shipping:</strong> Generally takes <strong>5 to 7 business days</strong> for delivery across most regions in India after dispatch.</li>
                <li><strong>Express Shipping:</strong> If available at checkout, express shipping usually delivers within <strong>2 to 4 business days</strong> after dispatch.</li>
              </ul>
              <p className="leading-relaxed">
                Please note that delivery timelines are estimates and may vary due to location, public holidays, or unforeseen logistical delays.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                3. Shipping Charges
              </h2>
              <p className="leading-relaxed mb-4">
                Shipping costs are calculated automatically at checkout based on the weight of your order, the dimensions of the packaging, and your delivery destination. 
              </p>
              <p className="leading-relaxed">
                We occasionally offer promotional free shipping on orders exceeding a certain value. If applicable, this will be automatically reflected during your checkout process.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                4. Order Tracking
              </h2>
              <p className="leading-relaxed mb-4">
                Once your order has been dispatched from our facility, you will receive a confirmation email and SMS containing your courier tracking number and a link to track your package.
              </p>
              <p className="leading-relaxed">
                You can also log in to your Sri Divyam account at any time to view the real-time status of your shipment.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                5. Undelivered or Returned Packages
              </h2>
              <p className="leading-relaxed mb-4">
                In the event that a package is returned to us due to an incorrect/incomplete address provided by the customer, or multiple failed delivery attempts by the courier, we will contact you to arrange a re-shipment.
              </p>
              <p className="leading-relaxed">
                Please note that re-shipping charges will be borne by the customer in such cases. We urge you to double-check your delivery address and contact number before placing an order.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                6. International Shipping
              </h2>
              <p className="leading-relaxed mb-4">
                Currently, Sri Divyam primarily serves customers within India. For international shipping requests for our premium handcrafted idols and dresses, please reach out to our support team directly.
              </p>
              <p className="leading-relaxed">
                International orders may be subject to customs duties, taxes, or import fees imposed by the destination country, which are the sole responsibility of the customer.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[#135B42] text-2xl font-bold mb-4 font-playfair flex items-center gap-3">
                <div className="h-px w-8 bg-[#DAC153]"></div>
                7. Damaged or Lost Shipments
              </h2>
              <p className="leading-relaxed mb-4">
                We take utmost care in securely packaging our divine items. However, if you receive a damaged parcel, please do not accept it from the courier. 
              </p>
              <p className="leading-relaxed">
                If you discover internal damage after opening, please contact our support team at <strong>sridivyamofficial@gmail.com</strong> within <strong>48 hours</strong> of delivery with clear photographs of the package and the damaged item. We will promptly assist you with a replacement or resolution.
              </p>
            </section>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
