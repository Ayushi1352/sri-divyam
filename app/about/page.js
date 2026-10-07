"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  ArrowDown,
  Target, 
  Eye, 
  Layers, 
  Scissors, 
  SearchCheck, 
  Gift, 
  Truck, 
  Award, 
  HeartHandshake, 
  Diamond, 
  RefreshCcw, 
  ShieldCheck, 
  Heart,
  Home,
  Smile,
  Star
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";

const AnimatedCounter = ({ endValue, suffix = "", isFloat = false }) => {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    let startTimestamp = null;
    const duration = 2000;
    const pauseDuration = 1500;
    
    let animationFrameId;
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = timestamp - startTimestamp;
      
      if (progress < duration) {
        const easeOutQuart = 1 - Math.pow(1 - progress / duration, 4);
        setCount(endValue * easeOutQuart);
        animationFrameId = requestAnimationFrame(step);
      } else if (progress < duration + pauseDuration) {
        setCount(endValue);
        animationFrameId = requestAnimationFrame(step);
      } else {
        startTimestamp = null;
        setCount(0);
        animationFrameId = requestAnimationFrame(step);
      }
    };
    
    animationFrameId = requestAnimationFrame(step);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [endValue]);
  
  const displayValue = isFloat ? count.toFixed(1) : Math.floor(count);
  
  return <>{displayValue}{suffix}</>;
};

export default function AboutPage() {
  return (
    <main>
      <Header />
      <div className="bg-white min-h-screen font-poppins text-gray-800 overflow-hidden">
      {/* 1. Hero Section */}
      <section className="mx-auto max-w-[1720px] relative w-full h-auto bg-gradient-to-br from-[#FFF9F5] to-[#FDECE2] overflow-hidden pt-0 pb-8 md:py-0 border-b border-gray-100">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#135B42 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="mx-auto flex max-w-[1440px] h-full flex-col items-center justify-center px-4 sm:px-8 md:px-12 lg:px-10 xl:px-24 pt-6 pb-10 md:pt-8 md:pb-12 lg:py-16 md:flex-row md:items-center md:justify-between gap-12 lg:gap-12 xl:gap-20 relative z-10">
          <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="flex items-center justify-center md:justify-start gap-2 md:gap-2 lg:gap-4 mb-4 md:mb-3 lg:mb-6 w-full">
              <div className="h-px w-8 sm:w-10 md:w-10 lg:w-12 xl:w-16 bg-[#C0A062]"></div>
              <span className="text-[#C0A062] font-semibold tracking-wider text-sm md:text-[10px] lg:text-[13px] xl:text-base uppercase whitespace-nowrap">About Sri Divyam</span>
              <div className="h-px w-8 sm:w-10 md:w-10 lg:w-12 xl:w-16 bg-[#C0A062]"></div>
            </div>
            
            <h1 className="font-playfair text-[#135B42] text-3xl md:text-[22px] lg:text-[36px] xl:text-5xl font-bold leading-[1.2] mb-3 md:mb-3 lg:mb-5">
              Crafting Divine Elegance<br />With Love & Devotion
            </h1>
            
            <p className="text-gray-700 text-sm md:text-[12px] lg:text-[15px] xl:text-lg leading-relaxed mb-6 md:mb-5 lg:mb-8 max-w-2xl mx-auto md:mx-0">
              Sri Divyam is dedicated to creating exquisite handmade dresses and accessories for Laddu Gopal Ji, Radha Krishna, and other deities. Every piece is a blend of devotion, traditional craftsmanship, and premium quality.
            </p>
            
            <Link href="/shop" className="inline-flex items-center gap-2 bg-[#135B42] text-white px-8 md:px-4 lg:px-6 xl:px-8 py-3.5 md:py-2 lg:py-3 xl:py-3.5 rounded text-lg md:text-[13px] lg:text-base xl:text-lg font-medium hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-colors shadow-lg hover:shadow-xl">
              Shop Collection <ArrowRight size={20} className="md:w-[14px] md:h-[14px] lg:w-[18px] lg:h-[18px] xl:w-[20px] xl:h-[20px]" />
            </Link>
          </div>
          
          <div className="flex-1 relative w-full max-w-md md:max-w-none mx-auto">
            {/* Subtle glow behind the idol */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#fbd1a2] rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <img 
              src="https://res.cloudinary.com/t4gae59t/image/upload/v1787657841/crafting.png" 
              alt="Laddu Gopal Ji" 
              className="relative z-10 w-full h-auto max-h-[350px] md:max-h-[450px] lg:max-h-[600px] object-contain drop-shadow-2xl animate-[float_6s_ease-in-out_infinite] md:scale-[1.15] lg:scale-100"
            />
          </div>
        </div>
      </section>

      {/* 2. Our Story Section */}
      <section className="py-10 md:py-12 lg:py-16 px-4 lg:px-10 xl:px-4 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-12 xl:gap-20">
        <div className="flex-1 w-full">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] md:aspect-square lg:aspect-square">
            <img 
              src="https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=1200&auto=format&fit=crop" 
              alt="Embroidery Process" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-6 md:mb-3 lg:mb-6 w-full">
            <h2 className="font-playfair text-[#135B42] text-3xl md:text-[26px] lg:text-4xl font-bold">Our Story</h2>
            <div className="h-px w-16 md:w-12 lg:w-20 bg-[#C0A062]"></div>
          </div>
          
          <div className="space-y-6 md:space-y-3 lg:space-y-6 text-gray-700 text-sm md:text-[12px] lg:text-[15px] xl:text-lg leading-relaxed max-w-2xl mx-auto md:mx-0 text-center md:text-left">
            <p>
              Sri Divyam began with a heartfelt dream — to bring devotion closer to every heart through beautifully handcrafted dresses and accessories for beloved deities.
            </p>
            <p>
              What started as a small step of faith has now become a trusted name for thousands of devotees who value quality, tradition, and the divine touch in every creation.
            </p>
            <p>
              Each product is carefully handmade by skilled artisans who follow age-old techniques and put their heart into every stitch.
            </p>
          </div>
          
          <Link href="/contact" className="inline-block mt-8 md:mt-4 lg:mt-8 bg-[#135B42] text-white px-8 md:px-5 lg:px-8 py-3 md:py-2 lg:py-3 rounded text-base md:text-[13px] lg:text-base font-medium hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-colors shadow-md">
            Contact Us
          </Link>
        </div>
      </section>

      {/* 3. Mission & Vision */}
      <section className="px-4 pb-10 md:pb-12 lg:pb-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission Card */}
          <div className="bg-[#FFF9F5] border border-[#F2E0D5] p-8 md:p-10 rounded-2xl flex flex-col sm:flex-row md:flex-col lg:flex-row items-start gap-6 hover:shadow-xl transition-shadow duration-300">
            <div className="bg-[#135B42] text-white p-4 rounded-full shrink-0 shadow-lg">
              <Target size={32} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-playfair text-2xl font-bold text-[#303030]">Our Mission</h3>
                <div className="h-[2px] w-12 bg-[#C0A062]"></div>
              </div>
              <p className="text-gray-600 text-sm md:text-[13px] lg:text-[15px] xl:text-lg leading-relaxed">
                To create divine, high-quality products that add elegance to your worship and bring you closer to devotion.
              </p>
            </div>
          </div>
          
          {/* Vision Card */}
          <div className="bg-[#FFF9F5] border border-[#F2E0D5] p-8 md:p-10 rounded-2xl flex flex-col sm:flex-row md:flex-col lg:flex-row items-start gap-6 hover:shadow-xl transition-shadow duration-300">
            <div className="bg-[#135B42] text-white p-4 rounded-full shrink-0 shadow-lg">
              <Eye size={32} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-playfair text-2xl font-bold text-[#303030]">Our Vision</h3>
                <div className="h-[2px] w-12 bg-[#C0A062]"></div>
              </div>
              <p className="text-gray-600 text-sm md:text-[13px] lg:text-[15px] xl:text-lg leading-relaxed">
                To be a trusted brand spreading devotion through our craftsmanship across the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Crafting Process */}
      <section className="py-10 md:py-12 lg:py-16 px-4 max-w-7xl mx-auto text-center border-t border-gray-100 border-b">
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className="h-px w-10 md:w-20 bg-[#C0A062]"></div>
          <h2 className="font-playfair text-[#135B42] text-3xl md:text-4xl font-bold">Our Crafting Process</h2>
          <div className="h-px w-10 md:w-20 bg-[#C0A062]"></div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 lg:gap-8">
          {[
            { id: "01", title: "Fabric Selection", icon: <Layers size={32} /> },
            { id: "02", title: "Hand Embroidery", icon: <Scissors size={32} /> },
            { id: "03", title: "Quality Checking", icon: <SearchCheck size={32} /> },
            { id: "04", title: "Elegant Packaging", icon: <Gift size={32} /> },
            { id: "05", title: "Safe Delivery", icon: <Truck size={32} /> }
          ].map((step, index, array) => (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center group">
                <div className="w-24 h-24 md:w-20 md:h-20 lg:w-28 lg:h-28 rounded-full border-2 border-dashed border-[#C0A062] flex items-center justify-center text-[#C0A062] bg-white group-hover:bg-[#C0A062] group-hover:text-white transition-all duration-300 mb-6 relative z-10 shadow-sm">
                  {step.icon}
                </div>
                <span className="text-[#135B42] font-bold text-lg mb-1">{step.id}</span>
                <span className="font-semibold text-[#303030] text-sm md:text-base lg:text-lg max-w-[120px] leading-tight">
                  {step.title.split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
                </span>
              </div>
              
              {/* Arrow connector */}
              {index < array.length - 1 && (
                <div className="hidden md:flex flex-1 items-center justify-center opacity-80 mt-[-80px] lg:mt-[-100px] z-0">
                  <ArrowRight size={28} className="text-[#C0A062]" />
                </div>
              )}
              {index < array.length - 1 && (
                <div className="md:hidden flex items-center justify-center opacity-80 my-[-8px] z-0 w-full">
                  <ArrowDown size={28} className="text-[#C0A062]" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* 5. Why Choose Us */}
      <section className="py-10 md:py-12 lg:py-16 px-4 max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className="h-px w-10 md:w-20 bg-[#C0A062]"></div>
          <h2 className="font-playfair text-[#135B42] text-3xl md:text-4xl font-bold">Why Choose Us</h2>
          <div className="h-px w-10 md:w-20 bg-[#C0A062]"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {[
            { title: "Premium Quality", icon: <Award size={40} strokeWidth={1.5} /> },
            { title: "Handmade with Love", icon: <HeartHandshake size={40} strokeWidth={1.5} /> },
            { title: "Unique Designs", icon: <Diamond size={40} strokeWidth={1.5} /> },
            { title: "Easy Returns", icon: <RefreshCcw size={40} strokeWidth={1.5} /> },
            { title: "Secure Payment", icon: <ShieldCheck size={40} strokeWidth={1.5} /> },
            { title: "Fast Delivery", icon: <Truck size={40} strokeWidth={1.5} /> }
          ].map((feature, index) => (
            <div key={index} className="bg-white border border-gray-100 hover:border-[#135B42]/20 shadow-sm hover:shadow-md transition-all duration-300 p-6 md:p-8 rounded-2xl flex flex-col items-center justify-center gap-4 group">
              <div className="text-[#135B42] group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-medium text-[#303030] text-sm md:text-base">{feature.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Stats Banner */}
      <section className="bg-[#135B42] py-16 px-4 relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/20">
            <div className="flex flex-col items-center justify-center text-center p-4">
              <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 font-playfair"><AnimatedCounter endValue={5000} suffix="+" /></span>
              <span className="text-white/80 font-medium tracking-wide uppercase text-xs md:text-sm">Happy Customers</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-4">
              <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 font-playfair flex items-center gap-2"><AnimatedCounter endValue={4.9} isFloat={true} /> <Star fill="white" className="text-white w-6 h-6 md:w-8 md:h-8" /></span>
              <span className="text-white/80 font-medium tracking-wide uppercase text-xs md:text-sm">Customer Rating</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-4">
              <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 font-playfair"><AnimatedCounter endValue={100} suffix="%" /></span>
              <span className="text-white/80 font-medium tracking-wide uppercase text-xs md:text-sm">Handmade</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-4">
              <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 font-playfair"><AnimatedCounter endValue={50} suffix="+" /></span>
              <span className="text-white/80 font-medium tracking-wide uppercase text-xs md:text-sm">Unique Designs</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Our Values */}
      <section className="py-10 md:py-12 lg:py-16 px-4 lg:px-10 xl:px-4 max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-stretch gap-12 lg:gap-12 xl:gap-20">
        <div className="flex-1 w-full order-2 md:order-1 lg:order-1 flex">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl w-full h-full min-h-[300px]">
            <img 
              src="https://res.cloudinary.com/t4gae59t/image/upload/v1787659647/values.png" 
              alt="Idol Shringar" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        <div className="flex-1 order-1 md:order-2 lg:order-2 text-center md:text-left flex flex-col justify-center">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-8 md:mb-6 lg:mb-10 w-full">
            <h2 className="font-playfair text-[#135B42] text-3xl md:text-[28px] lg:text-4xl font-bold">Our Values</h2>
            <div className="h-px w-20 md:w-12 lg:w-20 bg-[#C0A062]"></div>
          </div>
          
          <div className="space-y-8 md:space-y-5 lg:space-y-8">
            {[
              { title: "Devotion First", desc: "Every creation is inspired by devotion and made with a pure heart.", icon: <Heart size={24} className="w-5 h-5 md:w-6 md:h-6" /> },
              { title: "Traditional Craftsmanship", desc: "We preserve the rich heritage of Indian handicraft and embroidery.", icon: <Home size={24} className="w-5 h-5 md:w-6 md:h-6" /> },
              { title: "Quality & Trust", desc: "We never compromise on quality, because your trust is our pride.", icon: <Award size={24} className="w-5 h-5 md:w-6 md:h-6" /> },
              { title: "Customer Happiness", desc: "Your satisfaction and happiness are the blessings we aim for.", icon: <Smile size={24} className="w-5 h-5 md:w-6 md:h-6" /> }
            ].map((val, idx) => (
              <div key={idx} className="flex gap-6 md:gap-4 lg:gap-6 items-start group">
                <div className="bg-[#135B42] text-white w-14 h-14 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                  {val.icon}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-[#3F3F50] text-xl md:text-lg lg:text-xl mb-1 md:mb-0.5 lg:mb-1">{val.title}</h3>
                  <p className="text-gray-600 text-sm md:text-[12px] lg:text-[15px] xl:text-lg leading-relaxed">{val.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Bottom CTA Banner */}
      <section className="px-4 pb-10 md:pb-12 lg:pb-16">
        <div className="max-w-7xl mx-auto bg-[#135B42] rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row items-stretch shadow-2xl relative">
           {/* Pattern overlay */}
           <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none"></div>
           
          {/* Left Text */}
          <div className="flex-1 p-10 md:p-16 lg:p-20 flex flex-col justify-center relative z-10">
            <h2 className="font-playfair text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Celebrate Every Festival<br />With Sri Divyam
            </h2>
            <p className="text-white/80 text-sm md:text-[13px] lg:text-[15px] xl:text-lg mb-10 max-w-md">
              Handcrafted with devotion for your beloved deities.
            </p>
            <div>
              <Link href="/shop" className="inline-flex items-center gap-2 bg-white text-[#135B42] px-8 py-3.5 rounded font-bold hover:bg-gray-100 transition-colors shadow-lg">
                Explore Collection <ArrowRight size={20} />
              </Link>
            </div>
          </div>
          
          {/* Right Images */}
          <div className="flex-1 p-6 md:p-10 lg:p-0 flex items-center justify-center lg:justify-end lg:pr-10 gap-4 md:gap-6 relative z-10 bg-[#651832] lg:bg-transparent">
            {/* Image 1 */}
            <div className="w-1/3 max-w-[200px] aspect-square rounded-2xl bg-white overflow-hidden shadow-lg border-[3px] border-[#C0A062]/50 hover:scale-105 transition-transform duration-300 transform lg:translate-y-6">
              <img src="https://res.cloudinary.com/t4gae59t/image/upload/v1787661825/laddu_g_dress.png" alt="Deity 1" className="w-full h-full object-cover" />
            </div>
            {/* Image 2 */}
            <div className="w-1/3 max-w-[200px] aspect-square rounded-2xl bg-white overflow-hidden shadow-lg border-[3px] border-[#C0A062]/50 hover:scale-105 transition-transform duration-300 transform lg:-translate-y-6">
              <img src="https://res.cloudinary.com/t4gae59t/image/upload/v1787661720/laddu_gopal_dress.png" alt="Deity 2" className="w-full h-full object-cover" />
            </div>
            {/* Image 3 */}
            <div className="w-1/3 max-w-[200px] aspect-square rounded-2xl bg-white overflow-hidden shadow-lg border-[3px] border-[#C0A062]/50 hover:scale-105 transition-transform duration-300 transform lg:translate-y-6">
              <img src="https://res.cloudinary.com/t4gae59t/image/upload/v1787661720/festival_dress.png" alt="Deity 3" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* CSS for float animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}} />
      </div>
      <Footer />
    </main>
  );
}
