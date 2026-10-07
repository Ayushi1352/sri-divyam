"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ShieldCheck } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import ProductInfo from "./ProductInfo";
import ProductGallery from "./ProductGallery";
import ProductReviews from "./ProductReviews";
import DirectAddToCart from "./DirectAddToCart";

/* ── Accepted payment methods — plain logo row, no card/box ── */
function PaymentMethods() {
  return (
    <div className="flex items-center gap-3.5 flex-wrap">
      {/* VISA */}
      <span className="text-[22px] font-bold italic tracking-tight text-[#1A1F71] leading-none">
        VISA
      </span>

      {/* Mastercard */}
      <span className="inline-flex flex-col items-center leading-none">
        <svg viewBox="0 0 48 30" width="44" height="27" role="img" aria-label="Mastercard">
          <circle cx="19" cy="15" r="11" fill="#EB001B" />
          <circle cx="29" cy="15" r="11" fill="#F79E1B" />
          <path d="M24 6.7a11 11 0 0 1 0 16.6 11 11 0 0 1 0-16.6Z" fill="#FF5F00" />
        </svg>
        <span className="mt-[1px] text-[8px] font-semibold lowercase text-[#4b4b4b]">
          mastercard
        </span>
      </span>

      {/* American Express */}
      <span className="inline-flex items-center rounded bg-[#2E77BC] px-2 py-1 text-[11px] font-bold text-white leading-none">
        AMEX
      </span>

      {/* PayPal */}
      <span className="text-[19px] font-bold italic leading-none">
        <span className="text-[#003087]">Pay</span>
        <span className="text-[#009CDE]">Pal</span>
      </span>
    </div>
  );
}

export default function ProductContainer({ product, relatedProducts = [] }) {
  const { formatPrice, currency } = useCurrency();

  // "RS. 4500" style for INR, normal formatted price for other currencies.
  const recoPrice = (inr, usd) => {
    const formatted = formatPrice(inr, usd);
    return currency === "USD" ? formatted : `RS. ${String(formatted).replace(/[₹]/g, "").trim()}`;
  };

  // Do NOT pre-select any size on initial mount. Standard product base price shows until user picks.
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(
    product.colors?.find(c => c && typeof c === 'string' && c.trim() !== "" && c.trim().toUpperCase() !== "N/A") || product.color || ""
  );

  const reviewList = product.reviews || [];
  const reviewCount = reviewList.length > 0 ? reviewList.length : (product.numReviews || 0);
  const avgRating = reviewList.length > 0
    ? (reviewList.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewList.length).toFixed(1)
    : (product.rating > 0 ? Number(product.rating).toFixed(1) : "0.0");

  // Right-hand "Product Details" panel — laid out like the reference image
  // (Product Code / Types / Color / Material / ...).
  // Values from the admin dashboard (product fields or key/value Attributes) take
  // priority; the built-in text is only a fallback when nothing is provided.
  const isReal = (v) =>
    typeof v === "string"
      ? (v.trim() !== "" && v.trim().toUpperCase() !== "N/A")
      : (v !== null && v !== undefined && v !== "");

  const rawAttrs = (Array.isArray(product.attributes) ? product.attributes : [])
    .map((a) => ({ label: (a.key || a.name || "").toString().trim(), value: a.value }))
    .filter((a) => isReal(a.label) && isReal(a.value));

  const attrByLabel = (label) => {
    const match = rawAttrs.find((a) => a.label.toLowerCase() === label.toLowerCase());
    return match ? match.value : null;
  };

  const specRows = [
    { label: "Product Code", value: attrByLabel("Product Code") || product.sku },
    { label: "Types", value: attrByLabel("Types") || product.type || product.category },
    { label: "Color", value: attrByLabel("Color") || product.color },
    { label: "Material", value: attrByLabel("Material") || product.material },
    { label: "Work", value: attrByLabel("Work") || product.work },
    { label: "Packaging", value: attrByLabel("Packaging") || product.packaging },
    { label: "Care", value: attrByLabel("Care") || product.care },
  ].filter((r) => isReal(r.value));

  // Any extra admin attributes that aren't one of the built-in rows above.
  const attrRows = rawAttrs.filter(
    (a) => !specRows.some((s) => s.label.toLowerCase() === a.label.toLowerCase())
  );

  const disclaimer = attrByLabel("Disclaimer") || product.disclaimer;

  const detailRows = [...specRows, ...attrRows];
  const hasDetailsPanel = detailRows.length > 0 || isReal(disclaimer);

  // Design shows a single recommended product.
  const recommended = (Array.isArray(relatedProducts) ? relatedProducts : []).slice(0, 1);

  return (
    <div className="w-full flex flex-col gap-10 md:gap-14">

      {/* ── Product Showcase: 3-column layout (Info · Gallery · Details) ── */}
      {/* lg–1439px: proportional columns so the 3-up layout still fits.
          ≥1440px: exact 365 / 395 / 384 px columns. */}
      <div className="flex flex-col lg:flex-row lg:flex-nowrap lg:items-stretch lg:justify-center gap-8 lg:gap-6 min-[1440px]:gap-8">

        {/* Left Column: Product Info & Purchase Controls — 365 x 802 */}
        <div className="w-full lg:w-[31%] min-[1440px]:w-[365px] lg:min-w-0 lg:self-start order-2 lg:order-1 flex flex-col min-[1440px]:aspect-[365/802]">
          <ProductInfo
            product={product}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            avgRating={avgRating}
            reviewCount={reviewCount}
          />
        </div>

        {/* Center Column: Image Gallery — 395px */}
        <div className="w-full lg:w-[35%] min-[1440px]:w-[395px] lg:min-w-0 lg:self-start order-1 lg:order-2">
          <ProductGallery
            images={product.images}
            colorImagesMap={product.colorImagesMap}
            selectedColor={selectedColor}
          />
        </div>

        {/* Right Column: Product Details · Payment · Recommended — 384px.
            Stretches to the centre column's height; the Recommended block is pushed
            down (mt-auto) and lifted by ~one thumbnail row so its image bottom-aligns
            with the gallery's SECOND image (just above the thumbnails). */}
        <aside className="w-full lg:w-[33%] min-[1440px]:w-[384px] lg:min-w-0 order-3 lg:order-3 flex flex-col gap-6">

          {hasDetailsPanel && (
            <div className="rounded-md border border-[#E8E0D5] bg-[#F5F5F5] p-5 aspect-[384/632] flex flex-col">
              <h2 className="shrink-0 font-playfair text-[24px] font-medium leading-[62px] tracking-normal text-[#241F1C] pb-1 mb-3 border-b border-[#E7DECF]">
                Product Details
              </h2>

              {/* Rows spread evenly so the panel fills its full height */}
              <dl className="flex-1 flex flex-col justify-between">
                {detailRows.map((row, idx) => (
                  <div key={idx} className="flex gap-3 items-baseline py-1.5">
                    <dt className="font-gt-walsheim text-[15px] font-normal leading-[22px] tracking-normal text-[#303030] w-[42%] shrink-0">
                      {row.label} :
                    </dt>
                    <dd className="font-gt-walsheim text-[15px] font-normal leading-[22px] tracking-normal text-[#303030] w-[58%] break-words">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {isReal(disclaimer) && (
                <p className="shrink-0 mt-4 font-gt-walsheim text-[15px] font-normal leading-[22px] tracking-normal text-[#303030]">
                  Disclaimer : {disclaimer}
                </p>
              )}
            </div>
          )}

          {/* Accepted payment methods — no box, matches reference.
              mt-auto drops payment + recommended together to the bottom, so the
              extra space sits above payment (not above the recommended heading). */}
          <div className="flex flex-col gap-2.5 my-4 lg:mt-auto">
            <ShieldCheck size={18} strokeWidth={1.75} className="text-[#8a827a]" />
            <PaymentMethods />
          </div>

          {/* Recommended products — plain list, no box.
              A second mt-auto splits the spare space evenly (some above payment,
              some above this), and mb lifts it ~one thumbnail row so its image
              bottom-aligns with the gallery's second image. */}
          {recommended.length > 0 && (
            <div className="w-full lg:mt-auto lg:mb-[100px]">
              <div className="flex items-center justify-between -mt-4 pb-2.5 mb-8 border-b border-[#EFEAE3]">
                <h3 className="font-playfair text-[24px] font-normal leading-[24px] tracking-normal lowercase text-[#241F1C]">
                  recommended products
                </h3>
                <Link
                  href="/shop"
                  className="text-[12px] font-medium text-[#135B42] underline underline-offset-2 hover:text-[#0F4A36]"
                >
                  View All
                </Link>
              </div>

              <div className="flex flex-col gap-5">
                {recommended.map((p) => {
                  const href = `/product-details/${p.slug || p.id || p._id}`;
                  const effPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
                  return (
                    <div
                      key={p.id || p._id}
                      className="flex items-start gap-4 w-full max-w-[341px]"
                    >
                      {/* Image — 154 x 194 */}
                      <Link
                        href={href}
                        className="relative h-[194px] w-[154px] shrink-0 rounded bg-[#FAF7F2] overflow-hidden"
                      >
                        <Image
                          src={p.image || "https://placehold.co/308x388?text=No+Image"}
                          alt={p.title || "Recommended product"}
                          fill
                          sizes="154px"
                          className="object-cover"
                          unoptimized
                        />
                      </Link>

                      {/* Text section — matches the 194px image height:
                          title at top, price centred, button at bottom */}
                      <div className="w-[171px] min-w-0 h-[194px] flex flex-col pt-9 pb-9">
                        <Link
                          href={href}
                          className="block font-playfair text-[18px] font-normal leading-none tracking-normal text-[#303030] hover:text-[#135B42] transition-colors line-clamp-2"
                        >
                          {p.title}
                        </Link>

                        <div className="flex-1 flex flex-col justify-center">
                          <p className="font-montserrat text-[20px] font-semibold leading-[1.2] tracking-normal text-[#1F1C1A]">
                            {recoPrice(effPrice, p.usdPrice)}
                          </p>
                          {Number(p.rating) > 0 && (
                            <span className="mt-1 flex items-center gap-1 text-[11px] text-[#8a827a]">
                              <Star size={11} className="fill-[#F5A623] text-[#F5A623]" />
                              {Number(p.rating).toFixed(1)}
                              {Number(p.numReviews) > 0 && ` (${p.numReviews} Reviews)`}
                            </span>
                          )}
                        </div>

                        <div className="w-full">
                          <DirectAddToCart product={p} className="!h-[34px] !text-[12px]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Customer Reviews — full width, below the showcase ── */}
      <div className="w-full border-t border-[#EBE3D7] pt-10">
        <h2 className="font-playfair text-[24px] sm:text-[30px] font-bold text-[#241F1C] mb-8">
          Customer Reviews
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-8 lg:gap-12">
          <ProductReviews
            variant="summary"
            productId={product.id || product._id}
            product={product}
            initialReviews={product.reviews}
          />
          <ProductReviews
            variant="list"
            productId={product.id || product._id}
            product={product}
            initialReviews={product.reviews}
          />
        </div>
      </div>
    </div>
  );
}
