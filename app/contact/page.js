"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Send,
  CheckCircle2,
  Headphones,
  ShieldCheck,
  ThumbsUp,
  Users,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  X
} from "lucide-react";
import { FaInstagram, FaFacebookF, FaYoutube } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FaqSection from "../components/FaqSection";
import { apiClient } from "../utils/apiClient";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name" && !/^[A-Za-z ]*$/.test(value)) {
      return;
    }

    if (name === "phone" && !/^\d*$/.test(value)) {
      return;
    }

    setFormData({ ...formData, [name]: name === "phone" ? value.slice(0, 10) : value });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.name.trim())) {
      showToast("Name can contain alphabets and spaces only.", "error");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      showToast("Please enter a valid 10-digit mobile number.", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/api/contact", formData);
      showToast("Message sent successfully! We will connect with you within 24 hours.", "success");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      showToast(error.message || "Failed to send message. Please try again later.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-[#FDFDFD] min-h-screen font-poppins text-gray-800">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative border-b border-gray-100 overflow-hidden flex items-center justify-center min-h-[50vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://res.cloudinary.com/t4gae59t/image/upload/v1787727584/contact_banner_2.png")' }}
        >
          <div className="absolute inset-0 bg-[#135B42]/75"></div>
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none"></div>
        </div>

        <div className="max-w-[1000px] mx-auto px-6 sm:px-8 relative z-10 text-center">
          <h1 className="font-playfair text-white text-3xl md:text-4xl lg:text-[46px] font-bold mb-4 md:mb-5 drop-shadow-md tracking-wide">
            Contact Us
          </h1>
          <p className="text-white/90 text-sm md:text-base lg:text-[17px] leading-relaxed max-w-2xl mx-auto drop-shadow font-gt-walsheim font-light">
            We are here to help you. Get in touch with us for any queries or assistance.
          </p>
        </div>
      </section>

      {/* 2. Main Contact Area */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 md:px-12 lg:px-24">
          <div className="flex flex-col gap-12 xl:gap-16">
            {/* Top Row: Get In Touch & Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
            
            {/* Get In Touch */}
            <div className="flex flex-col bg-[#F5F9F7] p-5 sm:p-8 rounded-xl border border-[#E5F0EB] shadow-sm">
              <h2 className="font-playfair font-bold text-2xl text-[#135B42] mb-6">Get In Touch</h2>
              
              <div className="space-y-6 flex-1">
                {/* Phone */}
                <a href="tel:+918433081227" className="flex items-start gap-3 md:gap-4 group cursor-pointer">
                  <div className="bg-[#135B42] text-white p-2.5 md:p-3 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md">
                    <Phone size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-[13px] md:text-sm mb-0.5">Phone</h4>
                    <p className="text-gray-600 text-[13px] md:text-sm font-medium hover:text-[#135B42] transition-colors">+91 8433081227</p>
                    <p className="text-gray-500 text-[11px] md:text-xs mt-1">Mon - Sat: 10:00 AM - 7:00 PM</p>
                  </div>
                </a>

                {/* Email */}
                <a href="mailto:sridivyamofficial@gmail.com" className="flex items-start gap-3 md:gap-4 group cursor-pointer">
                  <div className="bg-[#135B42] text-white p-2.5 md:p-3 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md">
                    <Mail size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-[13px] md:text-sm mb-0.5">Email</h4>
                    <p className="text-gray-600 text-[13px] md:text-sm font-medium hover:text-[#135B42] transition-colors break-words">sridivyamofficial@gmail.com</p>
                    <p className="text-gray-500 text-[11px] md:text-xs mt-1">We reply within 24 hours</p>
                  </div>
                </a>

                {/* Address */}
                <div className="flex items-start gap-3 md:gap-4 group cursor-pointer">
                  <div className="bg-[#135B42] text-white p-2.5 md:p-3 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md">
                    <MapPin size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-[13px] md:text-sm mb-0.5">Address</h4>
                    <p className="text-gray-600 text-[13px] md:text-sm font-medium leading-relaxed">
                      D-69 Sector 1 Shatabdi Nagar,<br />
                      Near By Rithani, Delhi Road,<br />
                      Meerut - 250103
                    </p>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-3 md:gap-4 group cursor-pointer">
                  <div className="bg-[#135B42] text-white p-2.5 md:p-3 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md">
                    <Clock size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-[13px] md:text-sm mb-0.5">Working Hours</h4>
                    <p className="text-gray-600 text-[13px] md:text-sm font-medium">Monday - Saturday: 10:00 AM - 7:00 PM</p>
                    <p className="text-gray-600 text-[13px] md:text-sm font-medium">Sunday: Closed</p>
                  </div>
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-3 mt-8 pl-14">
                <a 
                  href="https://www.instagram.com/sridivyam_k?igsh=Mmx6a2J5eGwwM244" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-full border border-[#135B42] text-[#135B42] flex items-center justify-center hover:bg-[#135B42] hover:text-white transition-colors"
                >
                  <FaInstagram size={14} />
                </a>
                <a 
                  href="https://www.facebook.com/share/1DLw5ZtjpU/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-full border border-[#135B42] text-[#135B42] flex items-center justify-center hover:bg-[#135B42] hover:text-white transition-colors"
                >
                  <FaFacebookF size={14} />
                </a>
                <a 
                  href="https://www.youtube.com/@sridivyamm" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-full border border-[#135B42] text-[#135B42] flex items-center justify-center hover:bg-[#135B42] hover:text-white transition-colors"
                >
                  <FaYoutube size={14} />
                </a>
              </div>
            </div>

            {/* Send Us a Message */}
            <div className="flex flex-col bg-[#F5F9F7] p-5 sm:p-8 rounded-xl border border-[#E5F0EB] shadow-sm">
              <h2 className="font-playfair font-bold text-2xl text-[#135B42] mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    required
                    pattern="[A-Za-z ]+"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full h-11 px-4 border border-gray-200 rounded text-sm text-gray-800 outline-none focus:border-[#135B42] transition-colors bg-[#FCFCFC]"
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-11 px-4 border border-gray-200 rounded text-sm text-gray-800 outline-none focus:border-[#135B42] transition-colors bg-[#FCFCFC]"
                  />
                </div>
                <input
                  type="tel"
                  name="phone"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full h-11 px-4 border border-gray-200 rounded text-sm text-gray-800 outline-none focus:border-[#135B42] transition-colors bg-[#FCFCFC]"
                />
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full h-11 px-4 border border-gray-200 rounded text-sm text-gray-800 outline-none focus:border-[#135B42] transition-colors bg-[#FCFCFC]"
                />
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-200 rounded text-sm text-gray-800 outline-none focus:border-[#135B42] transition-colors resize-none bg-[#FCFCFC]"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#135B42] text-white w-fit px-6 py-2.5 rounded text-sm font-semibold flex items-center gap-2 hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-colors shadow-md mt-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Send Message"} <Send size={14} />
                </button>
              </form>
            </div>

            </div>

            {/* Bottom Row: Our Location */}
            <div className="flex flex-col">
              <h2 className="font-playfair font-bold text-2xl text-[#135B42] mb-6">Our Location</h2>
              <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200 relative">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3318.8398628047294!2d77.670428!3d28.939881999999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390c63965eac5c81%3A0xbbb6f6c925ca1be!2sD-69%2C%20Shatabdi%20Nagar%2C%20Sector%201%2C%20MDA%2C%20Meerut%2C%20Uttar%20Pradesh%20250103!5e1!3m2!1sen!2sin!4v1787813560425!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, position: "absolute", inset: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="strict-origin-when-cross-origin"
                ></iframe>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Feature Banner */}
      <section className="bg-[#135B42] text-white py-12 shadow-inner">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 md:px-12 lg:px-24">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 divide-x-0 lg:divide-x divide-white/20">
            {[
              { icon: <Headphones className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1.5} />, title: "Fast Response", desc: "We reply within 24 hours" },
              { icon: <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1.5} />, title: "Secure Communication", desc: "Your info is safe with us" },
              { icon: <ThumbsUp className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1.5} />, title: "Easy & Convenient", desc: "Hassle-free support" },
              { icon: <Users className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1.5} />, title: "Dedicated Support", desc: "We are here to help you" },
            ].map((feat, idx) => (
              <div key={idx} className={`flex items-start sm:items-center gap-2.5 sm:gap-4 ${idx !== 0 ? 'lg:pl-8' : ''}`}>
                <div className="text-[#FDF8F3] opacity-90 shrink-0 mt-0.5 sm:mt-0">
                  {feat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-[11px] sm:text-[13px] md:text-[14px] leading-tight mb-0.5 sm:mb-0">{feat.title}</h4>
                  <p className="text-white/70 text-[9px] sm:text-[11px] md:text-[12px] leading-snug break-words">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FAQ Section */}
      <FaqSection />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-4 z-[9999] bg-[#F8FAF9] px-5 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-[#1f2937] flex items-start sm:items-center gap-3 transition-all duration-300 animate-in slide-in-from-top-2 max-w-[400px] border border-gray-100">
          <div className="shrink-0 mt-0.5 sm:mt-0">
            {toast.type === 'error' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            )}
          </div>
          <span className="text-[15px] font-medium leading-snug flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2 -mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}

      <Footer />
    </main>
  );
}
