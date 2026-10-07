"use client";

import React from 'react';

export default function PromoSection() {
  const image = 'https://res.cloudinary.com/t4gae59t/image/upload/v1787655563/devoation.png';
  const altText = 'Laddu Gopal Dress';

  return (
    <section className="mx-auto max-w-[1720px] relative w-full h-auto flex flex-col-reverse lg:flex-row overflow-hidden">

      {/* Left Column: Static Image */}
      <div className="w-full lg:w-1/2 aspect-square sm:min-h-[450px] lg:min-h-[450px] lg:h-[450px] xl:min-h-[580px] xl:h-[580px] bg-white overflow-hidden relative">
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-white">
          <img
            src={image}
            alt={altText}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Right Column: Background with Text */}
      <div className="w-full lg:w-1/2 min-h-[350px] sm:min-h-[450px] lg:min-h-[450px] lg:h-[450px] xl:min-h-[580px] xl:h-[580px] bg-[#135B42] flex items-center relative py-12 lg:py-12 xl:py-16 overflow-hidden">
        <img
          src="https://res.cloudinary.com/dlzxiy0tl/image/upload/v1777272312/Where%20Devotion%20Meets.png"
          alt="feather"
          className="absolute bottom-0 right-0 w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] lg:w-[250px] lg:h-[250px] xl:w-[300px] xl:h-[300px] opacity-50 lg:opacity-60 pointer-events-none"
        />

        <div className="w-full max-w-[720px] mx-auto lg:ml-auto lg:mr-0 px-6 sm:px-10 lg:px-16 xl:px-24 relative z-10 text-white space-y-3 sm:space-y-4 text-center lg:text-left">
          <h2 className="text-[18px] sm:text-[32px] lg:text-[32px] xl:text-[41px] font-playfair leading-tight">
            Where Devotion Meets
          </h2>
          <h2 className="text-[24px] sm:text-[44px] lg:text-[42px] xl:text-[54px] font-playfair font-bold leading-tight">
            Royal Elegance
          </h2>
          <p className="text-[14px] sm:text-[17px] lg:text-[18px] xl:text-[20px] opacity-90 font-gt-walsheim pt-3 sm:pt-4 max-w-[450px] mx-auto lg:mx-0">
            Exquisite Dresses for Laddu Gopal,<br className="hidden sm:block" />
            Radha Krishna & Mata Rani
          </p>
        </div>
      </div>
    </section>
  );
}
