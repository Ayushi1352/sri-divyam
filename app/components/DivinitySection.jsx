"use client";

import { Play } from "lucide-react";

export default function DivinitySection() {
  return (
    <section className="mx-auto max-w-[1720px] bg-[#135B42] py-10 sm:py-16 md:py-20">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 md:px-16 lg:px-16 xl:px-24">

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-10 xl:gap-16 items-center">

          {/* LEFT CONTENT */}
          <div className="text-[#ffffff] flex flex-col items-center lg:items-start text-center lg:text-left">

            <h2 className="text-[18px] sm:text-[32px] md:text-[40px] lg:text-[40px] xl:text-[48px] font-playfair font-medium leading-[1.2] mb-4 sm:mb-6">
              Celebrate Divinity with <br className="hidden sm:block" />
              Beautiful Poshak
            </h2>

            <p className="text-[14px] sm:text-[15px] md:text-[18px] lg:text-[17px] xl:text-[19px] font-gt-walsheim leading-relaxed text-[#ffffff] max-w-[520px] mb-6 sm:mb-8 font-light opacity-90">
              Discover a divine collection of Laddu Gopal, Radha Krishna, and Mata Rani dresses, crafted with love and devotion. Each poshak is designed to bring elegance, tradition, and spiritual beauty to your temple, making every occasion more special and sacred.
            </p>

          </div>

          {/* RIGHT IMAGE */}
          <div className="relative w-full max-w-[500px] sm:max-w-[600px] mx-auto lg:max-w-none lg:mx-0 group">
            <div className="rounded-[16px] sm:rounded-[28px] overflow-hidden shadow-2xl relative bg-white">
              <img
                src="https://res.cloudinary.com/t4gae59t/image/upload/v1787652879/divinity.png"
                alt="Divinity"
                className="w-full h-full object-cover aspect-[4/3] transition-transform duration-500 group-hover:scale-105"
              />
              {/* Full-coverage hover overlay */}
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
            </div>



          </div>

        </div>
      </div>
    </section>

  );
}