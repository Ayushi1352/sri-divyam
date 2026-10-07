export default function StayInTouch() {
  return (
    <section className="bg-[#8a1d45] py-12 sm:py-16 md:py-20 text-white">
      <div className="mx-auto max-w-[1220px] px-6 sm:px-10 md:px-16 lg:px-24">
        <h2 className="mb-6 md:mb-10 text-center text-[18px] sm:text-[28px] md:text-[36px] font-playfair font-medium">Let&apos;s Stay In Touch</h2>

        <form className="mx-auto grid max-w-[780px] gap-5 sm:gap-6 grid-cols-1 md:grid-cols-[1fr_1fr_160px]">
          <div>
            <label className="mb-1.5 block text-[12px] sm:text-[13px] text-[#f1d9e4] font-medium uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              placeholder="Enter your name..."
              className="h-11 sm:h-12 w-full border border-[#c98aa3] bg-transparent px-4 text-[14px] outline-none placeholder:text-[#e0bfd0] transition-colors focus:border-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] sm:text-[13px] text-[#f1d9e4] font-medium uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              placeholder="Your email address..."
              className="h-11 sm:h-12 w-full border border-[#c98aa3] bg-transparent px-4 text-[14px] outline-none placeholder:text-[#e0bfd0] transition-colors focus:border-white"
            />
          </div>

          <div className="flex items-end mt-2 md:mt-0">
            <button
              type="submit"
              className="h-11 sm:h-12 w-full border border-white bg-transparent text-[14px] font-medium text-white transition-all duration-300 hover:bg-white hover:text-[#135B42] cursor-pointer active:scale-95 rounded-sm"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </section>

  );
}