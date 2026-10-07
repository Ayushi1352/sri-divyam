import { Headphones, Truck, Award, HeartHandshake } from "lucide-react";

const ITEMS = [
  { icon: Headphones, label: "24/7 Support" },
  { icon: Truck, label: "Faster Delivery" },
  { icon: Award, label: "Premium Quality" },
  { icon: HeartHandshake, label: "Loved Across India" },
];

export default function WhyLoveUs() {
  return (
    <section className="bg-white py-12 sm:py-14 lg:py-16 min-[1440px]:py-0 min-[1440px]:min-h-[495px] min-[1440px]:flex min-[1440px]:items-center">
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 md:px-12 lg:px-16 xl:px-24">
        <h2 className="font-playfair text-[24px] sm:text-[28px] lg:text-[32px] font-normal leading-tight tracking-[0.01em] text-[#241F1C] mb-3 text-center md:text-left">
          Why Love Us
        </h2>
        <p className="mx-auto md:mx-0 max-w-[520px] font-gt-walsheim text-[13px] sm:text-[15px] lg:text-[17px] font-light leading-relaxed tracking-[0.01em] text-[#6b6560] mb-8 sm:mb-10 lg:mb-12 text-center md:text-left">
          Crafted for lasting quality, designed for effortless comfort this is
          the Sri Divyam standard.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-8 sm:gap-y-10">
          {ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-3 sm:gap-4 text-center">
              <div className="h-[72px] w-[72px] sm:h-24 sm:w-24 lg:h-[110px] lg:w-[110px] min-[1440px]:h-[130px] min-[1440px]:w-[130px] rounded-full bg-[#EBF0EE] border border-[#D3DEDA] text-[#4A8478] flex items-center justify-center shrink-0">
                <Icon
                  className="w-7 h-7 sm:w-9 sm:h-9 lg:w-11 lg:h-11 min-[1440px]:w-12 min-[1440px]:h-12"
                  strokeWidth={1.5}
                />
              </div>
              <span className="font-inter text-[14px] sm:text-[16px] lg:text-[18px] min-[1440px]:text-[24px] font-normal leading-tight tracking-[0.01em] text-[#241F1C]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
