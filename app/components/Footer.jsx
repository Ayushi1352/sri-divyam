"use client";

import { FaInstagram, FaFacebookF, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#F6F6F6] text-[#4B4B5C] font-sans">
      <div className="mx-auto w-full max-w-[1800px] px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20 pb-8 pt-10 sm:pt-16 md:pt-16 lg:pt-[54px]">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1fr_auto_auto_auto_1fr] xl:grid-cols-[1.1fr_0.5fr_0.5fr_1fr_1fr] lg:gap-6 xl:gap-6">
          {/* Brand */}
          <div className="max-w-[355px] md:col-span-2 lg:col-span-1 md:max-w-full lg:max-w-[320px] xl:max-w-[355px] md:pr-10 lg:pr-0">
            <img src='https://res.cloudinary.com/w4kwyx1p/image/upload/v1786019226/sri_divyam_xy6keo.png' alt="Sri Divyam Logo" className="-ml-6 md:-ml-8 lg:ml-6 h-8 md:h-10 w-auto scale-[2.8] lg:scale-[3.9] origin-left lg:origin-center object-contain cursor-pointer" />

            <p className="mt-4 sm:mt-6 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[14px] xl:text-[16px] leading-[1.6] text-gray-600">
              Shop God dresses online specifically the ethnic ones with Indian
              traditional mix, simply glorifies the god statues.
            </p>

            <div className="mt-6 sm:mt-7 flex items-center gap-4">
              <a
                href="https://www.instagram.com/sridivyam_k?igsh=Mmx6a2J5eGwwM244"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[24px] sm:text-[32px] md:text-[36px] lg:text-[28px] xl:text-[36px] text-gray-700 transition hover:text-[#135B42] cursor-pointer hover:scale-110"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.facebook.com/share/1DLw5ZtjpU/"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[22px] sm:text-[30px] md:text-[34px] lg:text-[26px] xl:text-[34px] text-gray-700 transition hover:text-[#135B42] cursor-pointer hover:scale-110"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://www.youtube.com/@sridivyamm"
                aria-label="YouTube"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[24px] sm:text-[32px] md:text-[36px] lg:text-[28px] xl:text-[36px] text-gray-700 transition hover:text-[#135B42] cursor-pointer hover:scale-110"
              >
                <FaYoutube />
              </a>
            </div>
          </div>


          {/* Useful Links */}
          <div className="sm:pl-4">
            <h3 className="text-[17px] sm:text-[18px] lg:text-[16px] xl:text-[18px] font-medium text-[#09061B] font-gt-walsheim whitespace-nowrap">
              Useful Links
            </h3>
            <ul className="mt-5 space-y-4 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[14px] xl:text-[16px] text-gray-600 whitespace-nowrap">
              <li>
                <Link href="/" className="transition hover:text-[#135B42] cursor-pointer">Home</Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-[#135B42] cursor-pointer">About Us</Link>
              </li>
              <li>
                <Link href="/shop" className="transition hover:text-[#135B42] cursor-pointer">Shop</Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-[#135B42] cursor-pointer">Contact us</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="sm:pl-4">
            <h3 className="text-[17px] sm:text-[18px] lg:text-[16px] xl:text-[18px] font-medium text-[#09061B] font-gt-walsheim whitespace-nowrap">
              Categories
            </h3>
            <ul className="mt-5 space-y-3 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[14px] xl:text-[16px] text-gray-600 whitespace-nowrap">
              <li>
                <Link href="/shop?category=Dresses" className="transition hover:text-[#135B42] cursor-pointer">
                  Dress</Link>
              </li>
              <li>
                <Link href="/shop?category=Ornaments" className="transition hover:text-[#135B42] cursor-pointer">
                  Ornaments</Link>
              </li>
              <li>
                <Link href="/shop?category=Puja Essentials" className="transition hover:text-[#135B42] cursor-pointer">
                  Puja Essentials</Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div className="sm:pl-4">
            <h3 className="text-[17px] sm:text-[18px] lg:text-[16px] xl:text-[18px] font-medium text-[#09061B] font-gt-walsheim whitespace-nowrap">
              Policies
            </h3>
            <ul className="mt-5 space-y-4 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[14px] xl:text-[16px] text-gray-600 whitespace-nowrap">
              <li>
                <Link href="/shipping-policy" className="transition hover:text-[#135B42] cursor-pointer">Shipping Policy</Link>
              </li>
              <li>
                <Link href="/cancellation-policy" className="transition hover:text-[#135B42] cursor-pointer">Cancellation Policy</Link>
              </li>
              <li>
                <Link href="/return-and-refund-policy" className="transition hover:text-[#135B42] cursor-pointer">Return & Refund Policy</Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="transition hover:text-[#135B42] cursor-pointer">Terms & Conditions</Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="transition hover:text-[#135B42] cursor-pointer">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="w-full">
            <h3 className="text-[17px] sm:text-[18px] lg:text-[16px] xl:text-[18px] font-medium text-[#09061B] font-gt-walsheim whitespace-nowrap">
              Contact Info
            </h3>



            <div className="mt-5 space-y-4 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[13px] xl:text-[16px] text-gray-600">
              <a href="mailto:sridivyamofficial@gmail.com" className="flex items-center gap-4 cursor-pointer hover:text-[#135B42] transition group">
                <FiMail className="shrink-0 text-[18px] sm:text-[20px] text-[#135B42] group-hover:scale-110 transition-transform" />
                <span className="break-all sm:break-normal">sridivyamofficial@gmail.com</span>
              </a>

              <a href="tel:+918433081227" className="flex items-center gap-4 cursor-pointer hover:text-[#135B42] transition group whitespace-nowrap">
                <FiPhone className="shrink-0 text-[18px] sm:text-[20px] text-[#135B42] group-hover:scale-110 transition-transform" />
                <span>+91 8433081227</span>
              </a>

              <div className="flex items-start gap-4 cursor-pointer hover:text-[#135B42] transition group">
                <FiMapPin className="mt-1 shrink-0 text-[18px] sm:text-[20px] text-[#135B42] group-hover:scale-110 transition-transform" />
                <span className="leading-relaxed">
                  D-69 Sector 1 Shatabdi Nagar, Near By Rithani, Delhi Road, Meerut, 250103
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Full-width Bottom Bar */}
      <div className="w-full bg-[#135B42] py-4 mt-8 md:mt-12">
        <div className="mx-auto w-full max-w-[1800px] px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20 flex flex-col sm:flex-row items-center justify-between text-white/90 text-[12px] sm:text-[12px] lg:text-[14px] font-medium gap-4 sm:gap-3 font-poppins text-center sm:text-left">
          <p className="flex flex-col sm:flex-row items-center gap-1 sm:whitespace-nowrap">
            <span><span className="text-[14px] lg:text-[16px]">©</span> Copyright 2026 Sri Divyam</span>
            <span className="hidden sm:inline"> </span>
            <span>All Rights Reserved.</span>
          </p>
          <p className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 sm:whitespace-nowrap">
            <span>Designed and Developed by</span>
            <a
              href="https://www.kusheldigi.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white hover:text-[#DAC153] underline transition-colors"
            >
              Kushel Digi Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
