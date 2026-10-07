"use client";

import { Wand2, Palette, Leaf } from "lucide-react";

const features = [
  {
    id: 1,
    icon: Wand2,
    title: "Purity of Materials",
    description:
      "We source only the finest Banarasi silks, hand-woven gold Zari, and organic cottons to ensure sanctity in every garment.",
  },
  {
    id: 2,
    icon: Palette,
    title: "Artisanal Mastery",
    description:
      "Each piece is crafted by hereditary artisans who understand the spiritual significance of the iconography they weave.",
  },
  {
    id: 3,
    icon: Leaf,
    title: "Eco-Spiritual Conscious",
    description:
      "Natural dyes and sustainable processes are used to honor the Earth as we honor the Divine.",
  },
];

export default function SacredCraft() {
  return (
    <section className="mx-auto max-w-[1720px] bg-[#FFFFFF] w-full h-auto py-10 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 md:px-16 lg:px-16 xl:px-24">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-10 xl:gap-14">
          {/* Left Image */}
          <div className="relative mx-auto w-full max-w-[546px] lg:flex-1 group">
            <div className="overflow-hidden rounded-[16px] sm:rounded-[22px] relative">
              <img
                src="https://res.cloudinary.com/t4gae59t/image/upload/v1787656735/sacred_craft.png"
                alt="Artisan crafting dress"
                className="w-full h-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Full-coverage hover overlay */}
              <div className="absolute inset-0 bg-[#135B42]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
            </div>

            <div className="absolute bottom-[-10px] right-2 sm:bottom-[-14px] sm:right-4 md:right-5 lg:bottom-[-12px] lg:right-[-14px]">
              <div className="flex h-[80px] w-[100px] flex-col items-center justify-center rounded-[12px] bg-[#135B42] text-white shadow-lg sm:h-[94px] sm:w-[122px] sm:rounded-[18px] md:h-[130px] md:w-[180px] lg:h-[130px] xl:h-[150px] lg:w-[170px] xl:w-[208px]">
                <span className="font-serif text-[24px] sm:text-[32px] md:text-[36px] lg:text-[32px] xl:text-[40px] font-bold font-playfair leading-none">
                  100%
                </span>
                <span className="mt-1 md:mt-2 text-[9px] sm:text-[11px] md:text-[14px] lg:text-[12px] xl:text-[14px] font-semibold font-gt-walsheim uppercase tracking-[0.15em] md:tracking-[0.18em] text-white/95 text-center">
                  Handcrafted
                </span>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="mx-auto w-full mt-10 lg:mt-0 lg:flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="mb-6 sm:mb-8">
              <h2 className="font-serif text-[20px] sm:text-[34px] md:text-[38px] lg:text-[34px] xl:text-[40px] font-bold leading-[1.1] text-[#1F2230]">
                Our Sacred Craft
              </h2>
              <p className="mt-1 font-serif text-[20px] sm:text-[34px] md:text-[38px] lg:text-[34px] xl:text-[40px] font-playfair font-bold leading-[1.1] text-[#135B42]">
                A Legacy of Devotion
              </p>
            </div>


            <div className="space-y-6 sm:space-y-7 w-full max-w-[520px]">
              {features.map((feature) => {
                const Icon = feature.icon;
                const isImageIcon = typeof Icon === 'string';

                return (
                  <div key={feature.id} className="flex items-start gap-4 text-left">
                    <div className="mt-0.5 flex h-[40px] w-[40px] sm:h-[44px] sm:w-[44px] shrink-0 items-center justify-center rounded-full border-[2px] border-[#135B42] text-[#135B42] overflow-hidden p-[8px]">
                      {isImageIcon ? (
                        <img src={Icon} alt={feature.title} className="w-full h-full object-contain" />
                      ) : (
                        <Icon size={18} strokeWidth={1.8} />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-[17px] sm:text-[19px] md:text-[20px] lg:text-[18px] xl:text-[20px] font-medium leading-[1.3] font-gt-walsheim text-[#303030]">
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[14px] xl:text-[16px] leading-[1.6] font-gt-walsheim text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 
