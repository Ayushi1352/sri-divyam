"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const faqItems = [
  {
    question: "What is your design process like?",
    answer:
      "Our design process begins with a deep understanding of traditional aesthetics and modern craftsmanship. We sketch initial concepts, select premium fabrics, and then our master artisans execute the intricate hand-embroidery to create a unique piece.",
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping typically takes 5-7 business days within India. International shipping can take 10-15 business days depending on the destination and customs processing.",
  },
  {
    question: "Do you offer custom sizing?",
    answer: "Yes, we specialize in custom sizing for all our deity dresses. You can provide specific measurements of your idol, and we will tailor the dress to ensure a perfect fit.",
  },
  {
    question: "What materials do you use for the dresses?",
    answer: "We use only the finest materials including pure silk, velvet, organza, and high-quality cotton. All our embellishments like Gota Patti and Zardosi are made with premium threads and stones.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mx-auto max-w-[1720px] bg-white pt-6 sm:pt-8 md:pt-10 lg:pt-12 pb-12 sm:pb-14 md:pb-16 lg:pb-20">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 md:px-16 lg:px-24">
        <div className="max-w-[1120px]">
          {/* Header */}
          <div className="mb-8 sm:mb-10 md:mb-12">
            <p className="text-[14px] sm:text-[24px] md:text-[32px] font-gt-walsheim font-semibold tracking-[-0.01em] text-[#135B42]">
              FAQ
            </p>
            <h2 className="mt-1 sm:mt-2 font-playfair text-[20px] sm:text-[36px] md:text-[44px] lg:text-[52px] font-bold leading-tight text-[#0A243F]">
              Most asked questions
            </h2>
          </div>


          {/* FAQ List */}
          <div className="border-t border-[#E5E7EB]">
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="border-b border-[#E5E7EB] py-4 sm:py-6 md:py-7"
                >
                  <div 
                    className="flex cursor-pointer items-start justify-between gap-4"
                    onClick={() => toggleFaq(index)}
                  >
                    <div className="flex-1 pr-2">
                      <h3 className="text-[16px] sm:text-[18px] md:text-[20px] font-semibold font-gt-walsheim leading-[1.45] text-[#0A243F]">
                        {item.question}
                      </h3>

                      {isOpen && (
                        <p className="mt-4 max-w-[980px] text-[13px] sm:text-[14px] md:text-[15px] font-gt-walsheim font-light leading-relaxed text-[#4B5563]">
                          {item.answer}
                        </p>
                      )}
                    </div>

                    <button
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[#17304D]"
                      aria-label={isOpen ? "Collapse FAQ" : "Expand FAQ"}
                    >
                      {isOpen ? (
                        <ChevronUp size={20} strokeWidth={2} className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <ChevronDown size={20} strokeWidth={2} className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}