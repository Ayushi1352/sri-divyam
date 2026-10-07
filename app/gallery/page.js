"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { FaInstagram as Instagram } from "react-icons/fa6";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState("All Dresses");

  const tabs = [
    "All Dresses",
    "Laddu Gopal Dresses",
    "Radha Krishna Dresses",
    "Festival Collection",
    "Daily Wear",
    "Seasonal Collection",
  ];

  const galleryImages = [
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774873666/Red%20Rose%20Laddu%20Gopal%20Dress.png", featured: true },
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774875063/red%20and%20light%20pink%20Dress.png", featured: false },
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774941466/Cream%20color%20embroidery%20dress.png", featured: false },
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774875064/Purple%20color%20embroidery%20dress.png", featured: false },
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774941452/Cream%20and%20light%20pink%20Dres.png", featured: false },
    
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774875064/Purple%20color%20embroidery%20dress.png", featured: false },
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774875063/red%20and%20light%20pink%20Dress.png", featured: false },
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774941466/Cream%20color%20embroidery%20dress.png", featured: false },
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774941452/Cream%20and%20light%20pink%20Dres.png", featured: false },
    
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774941452/Cream%20and%20light%20pink%20Dres.png", featured: false },
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774875064/Purple%20color%20embroidery%20dress.png", featured: false },
    { src: "https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774941466/Cream%20color%20embroidery%20dress.png", featured: false },
  ];

  return (
    <main className="bg-white min-h-screen font-poppins text-gray-800">
      <Header />

      {/* 1. Hero Section */}
      <section className="mx-auto max-w-[1720px] relative w-full h-auto bg-[#FFFDF9] overflow-hidden pt-6 pb-8 md:pt-8 md:pb-10 lg:pt-10 lg:pb-12 border-b border-gray-100">
        {/* Subtle Background Pattern (Mandala-like) */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none"></div>
        <div
          className="hidden md:block absolute right-0 top-0 bottom-0 w-[450px] lg:w-[600px] bg-contain bg-no-repeat bg-right z-0 opacity-40 pointer-events-none"
          style={{ backgroundImage: 'url("https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774856924/Where%20Devotion%20Meets%20Royal%20Elegance.png")' }}
        />

        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 md:px-12 lg:px-24 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-playfair text-[#135B42] text-4xl md:text-5xl lg:text-[56px] font-bold leading-tight mb-4">
              Our Divine Gallery
            </h1>
            <div className="h-[2px] w-16 bg-[#C0A062] mx-auto md:mx-0 mb-6"></div>
            <p className="text-gray-600 text-sm md:text-base lg:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed">
              Explore our beautiful collection of Laddu Gopal dresses made with love, devotion and premium craftsmanship.
            </p>
          </div>
          
          <div className="flex-1 flex justify-center md:justify-end relative">
            <div className="absolute top-1/2 left-1/2 md:left-[60%] -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 md:w-80 h-48 sm:h-64 md:h-80 bg-[#fbd1a2] rounded-full blur-3xl opacity-40 pointer-events-none"></div>
            <img 
              src="https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774873666/Red%20Rose%20Laddu%20Gopal%20Dress.png" 
              alt="Divine Gallery" 
              className="h-48 sm:h-64 md:h-80 lg:h-96 w-auto object-contain relative z-10 drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* 2. Gallery Tabs */}
      <section className="py-8 border-b border-gray-100">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 md:px-12 lg:px-24">
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded border text-sm font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-[#135B42] border-[#135B42] text-white shadow-md"
                    : "bg-white border-gray-200 text-gray-600 hover:border-[#135B42] hover:text-[#135B42]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Masonry/Grid Layout */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 md:px-12 lg:px-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-5 auto-rows-[150px] md:auto-rows-[180px] lg:auto-rows-[220px]">
            {galleryImages.map((img, idx) => (
              <div 
                key={idx} 
                className={`relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100 bg-[#F9F9F9] ${img.featured ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}`}
              >
                <img 
                  src={img.src} 
                  alt={`Gallery Item ${idx}`} 
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Banner Sections */}
      <section className="pb-16 pt-4">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 md:px-12 lg:px-24">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            
            {/* Festival Collection Banner */}
            <div className="flex-1 bg-[#FDF5F2] rounded-3xl overflow-hidden relative flex items-center p-6 sm:p-8 md:p-10 shadow-sm border border-[#F9E5E0] group">
              <div className="relative z-10 w-[60%] sm:w-[65%] md:w-[60%]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="text-[#135B42] bg-white p-2 rounded-full shadow-sm w-9 h-9 flex items-center justify-center shrink-0"><img src="https://cdn-icons-png.flaticon.com/512/3284/3284566.png" className="w-5 h-5 opacity-70" alt="icon"/></div>
                  <h3 className="font-playfair font-bold text-[17px] sm:text-xl md:text-2xl text-gray-900 leading-tight whitespace-nowrap">Festival Collection</h3>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-5 sm:mb-6 max-w-[250px]">
                  Special dresses for every festival and auspicious occasion.
                </p>
                <button className="bg-[#135B42] text-white px-4 sm:px-5 py-2.5 sm:py-2 rounded text-xs sm:text-sm font-medium hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-colors shadow-md whitespace-nowrap w-fit">
                  Explore Now →
                </button>
              </div>
              <div className="absolute right-0 bottom-0 w-[45%] sm:w-[40%] h-[90%] sm:h-full flex items-end justify-end pointer-events-none pr-2 sm:pr-0 pb-2 sm:pb-0">
                <img 
                  src="https://res.cloudinary.com/dlzxiy0tl/image/upload/v1774875063/red%20and%20light%20pink%20Dress.png" 
                  alt="Festival" 
                  className="w-full h-full object-contain object-bottom sm:object-right-bottom group-hover:scale-105 transition-transform duration-500 origin-bottom-right"
                />
              </div>
            </div>

            {/* Custom Orders Banner */}
            <div className="flex-1 bg-[#FAF6F0] rounded-3xl overflow-hidden relative flex items-center p-6 sm:p-8 md:p-10 shadow-sm border border-[#EBE3D5] group">
              <div className="relative z-10 w-[60%] sm:w-[65%] md:w-[60%] flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="text-[#135B42] bg-white p-2 rounded-full shadow-sm w-9 h-9 flex items-center justify-center shrink-0"><img src="https://cdn-icons-png.flaticon.com/512/6122/6122557.png" className="w-5 h-5 opacity-70" alt="icon"/></div>
                  <h3 className="font-playfair font-bold text-[17px] sm:text-xl md:text-2xl text-gray-900 leading-tight whitespace-nowrap">Custom Orders</h3>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-5 sm:mb-6 max-w-[250px]">
                  Want something unique? We create custom dresses as per your preference.
                </p>
                <button className="bg-[#135B42] text-white px-4 sm:px-5 py-2.5 sm:py-2 rounded text-xs sm:text-sm font-medium hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-colors shadow-md whitespace-nowrap w-fit">
                  Order Custom Dress →
                </button>
              </div>
              <div className="absolute right-0 top-0 w-[45%] sm:w-[45%] h-full pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6F0] via-[#FAF6F0]/80 to-transparent z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=600&auto=format&fit=crop" 
                  alt="Custom Embroidery" 
                  className="w-full h-full object-cover object-left group-hover:scale-105 transition-transform duration-500 rounded-l-full sm:rounded-none"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Instagram Feed */}
      <section className="py-12 border-t border-gray-100 overflow-hidden">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 md:px-12 lg:px-24">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 h-px bg-gray-200"></div>
            <h3 className="font-playfair text-[#135B42] text-2xl md:text-3xl font-bold px-6">Instagram Feed</h3>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className="hidden md:flex absolute right-4 sm:right-8 md:right-12 lg:right-24 items-center gap-2 text-[#135B42] font-medium hover:underline cursor-pointer bg-white px-4">
              <Instagram size={18} /> Follow Us @sridivyam
            </div>
          </div>
          
          <div className="flex md:hidden items-center justify-center gap-2 text-[#135B42] font-medium hover:underline cursor-pointer mb-8">
              <Instagram size={18} /> Follow Us @sridivyam
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer bg-[#FDFDFD] border border-gray-100">
                <img 
                  src={galleryImages[i].src} 
                  alt={`Insta ${i}`} 
                  className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Instagram className="text-white w-6 h-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Newsletter Subscription Bar */}
      <section className="bg-[#135B42] text-white py-6">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 md:px-12 lg:px-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-[#C0A062]" />
              <span className="font-medium text-sm md:text-base">Subscribe to get special offers and updates.</span>
            </div>
            
            <form className="flex w-full md:w-auto bg-white rounded overflow-hidden h-10 shadow-inner">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="px-4 py-2 text-gray-800 text-sm outline-none w-full md:w-[300px]"
                required
              />
              <button 
                type="submit" 
                className="bg-[#0F4A35] text-white px-6 text-sm font-medium hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
