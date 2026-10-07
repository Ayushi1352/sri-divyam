import Header from "../../components/Header";
import Footer from "../../components/Footer";
import StayInTouch from "../../components/StayInTouch";
import ProductCard from "../../components/ProductCard";
import ProductContainer from "../../components/ProductContainer";
import ProductInfo from "../../components/ProductInfo";
import WhyLoveUs from "../../components/WhyLoveUs";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const canonical = `/product-details/${slug}`;

  let product = null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/products/slug/${slug}`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      product = data?.product || data?.data || null;
    }
  } catch {
    // ignore - fall back to generic metadata
  }

  if (!product?.name) {
    return {
      title: "Product | Sri Divyam",
      description:
        "Handcrafted deity dresses, ornaments and puja essentials by Sri Divyam. Premium fabrics, fine detailing and custom sizing for your beloved deities.",
      alternates: { canonical },
    };
  }

  const clean = String(product.description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const description = clean
    ? clean.length > 155
      ? `${clean.slice(0, 152).trimEnd()}...`
      : clean
    : `Buy ${product.name} handcrafted by Sri Divyam. Premium fabric, fine detailing and custom sizing for your beloved deity.`;

  return {
    title: `${product.name} | Sri Divyam`,
    description,
    alternates: { canonical },
  };
}

export default async function ProductDetailsPage({ params }) {
  const { slug } = await params;

  let productFromApi = null;
  let relatedProductsApi = [];

  try {
    // Direct API call for product details - bypass proxy for this specific endpoint
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/slug/${slug}`, {
      next: { revalidate: 60 },
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error(`Product API returned status: ${res.status}`);
      throw new Error(`API returned ${res.status}`);
    }

    const data = await res.json();
    if (data && (data.product || data.data)) {
      const prodData = data.product || data.data;
      productFromApi = {
        ...prodData,
        // Override with root-level fields if they exist (specific to some API structures)
        price: data.price || prodData.price,
        images: data.images || prodData.images,
        variations: data.variants || prodData.variations || prodData.variants,
        usd_price: data.usd_price || prodData.usd_price
      };
    } else {
      console.error("Product API response missing product data:", data);
    }
  } catch (error) {
    console.error("Failed to fetch product:", error);
  }

  if (!productFromApi) {
    notFound();
  }

  // Fetch products for the "People Also Bought" section — same category first,
  // then top up from the full catalogue so the section always has items to show.
  const RELATED_COUNT = 4;
  const currentKey = String(productFromApi.id ?? productFromApi._id ?? "");
  const dedupeRelated = (list) => (Array.isArray(list) ? list : []).filter(
    (p) => String(p.id ?? p._id ?? "") !== currentKey && p.slug !== slug
  );

  if (productFromApi.category?.slug) {
    try {
      const relatedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/category/${productFromApi.category.slug}`, { next: { revalidate: 60 } });
      const relatedData = await relatedRes.json();
      relatedProductsApi = dedupeRelated(relatedData?.products || relatedData?.data?.products || relatedData?.data);
    } catch (e) {
      console.error("Failed to fetch related products:", e);
    }
  }

  if (relatedProductsApi.length < RELATED_COUNT) {
    try {
      const allRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, { next: { revalidate: 60 } });
      const allData = await allRes.json();
      const pool = dedupeRelated(allData?.products || allData?.data?.products || allData?.data);
      const seen = new Set(relatedProductsApi.map((p) => String(p.id ?? p._id ?? "")));
      for (const p of pool) {
        const key = String(p.id ?? p._id ?? "");
        if (seen.has(key)) continue;
        relatedProductsApi.push(p);
        seen.add(key);
        if (relatedProductsApi.length >= RELATED_COUNT) break;
      }
    } catch (e) {
      console.error("Failed to fetch fallback products:", e);
    }
  }

  relatedProductsApi = relatedProductsApi.slice(0, RELATED_COUNT);

  const IMAGE_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/uploads/`;

  const normalizeImgUrl = (img) => {
    if (!img || typeof img !== 'string') return null;
    const trimmed = img.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    return `${IMAGE_BASE_URL}${trimmed.replace(/^\/+/, '')}`;
  };

  // Helper to extract image list from any field (string, JSON, array, or object)
  const extractMediaUrls = (source) => {
    if (!source) return [];
    if (typeof source === 'string') {
      try {
        if (source.startsWith('[') && source.endsWith(']')) {
          const parsed = JSON.parse(source);
          return Array.isArray(parsed) ? parsed.map(extractMediaUrls).flat() : [source];
        }
        if (source.includes(',')) {
          return source.split(',').map(s => s.trim()).filter(Boolean);
        }
      } catch (e) {
        return [source];
      }
      return [source];
    }
    if (Array.isArray(source)) {
      return source.map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.url || item.image || item.image_path || item.mainImage || null;
        return null;
      }).filter(Boolean);
    }
    if (typeof source === 'object' && source !== null) {
      return [source.url || source.image || source.image_path || source.mainImage].filter(Boolean);
    }
    return [];
  };

  // Dynamic extraction of colors strictly from admin data
  const rawColors = [];
  if (productFromApi.color && typeof productFromApi.color === 'string' && productFromApi.color.trim() && productFromApi.color.trim() !== "N/A") {
    rawColors.push(productFromApi.color.trim());
  }
  if (Array.isArray(productFromApi.colorImages)) {
    productFromApi.colorImages.forEach(ci => {
      if (ci?.color && typeof ci.color === 'string' && ci.color.trim()) {
        rawColors.push(ci.color.trim());
      }
    });
  }
  if (Array.isArray(productFromApi.variations || productFromApi.variants)) {
    (productFromApi.variations || productFromApi.variants).forEach(v => {
      if (v?.color && typeof v.color === 'string' && v.color.trim()) {
        rawColors.push(v.color.trim());
      }
    });
  }
  if (Array.isArray(productFromApi.options?.colors)) {
    productFromApi.options.colors.forEach(c => {
      if (c && typeof c === 'string' && c.trim()) rawColors.push(c.trim());
    });
  }
  const dynamicColors = [...new Set(rawColors.filter(Boolean))];

  // Build color-to-images map and aggregate all product images
  const colorImagesMap = {};
  const allImagesSet = new Set();

  // 1. Base / primary images
  const baseImgs = [
    ...extractMediaUrls(productFromApi.mainImage),
    ...extractMediaUrls(productFromApi.image_path),
    ...extractMediaUrls(productFromApi.image),
    ...extractMediaUrls(productFromApi.images),
    ...extractMediaUrls(productFromApi.wearableMedia)
  ].map(normalizeImgUrl).filter(Boolean);

  baseImgs.forEach(img => allImagesSet.add(img));

  const primaryColor = (productFromApi.color && typeof productFromApi.color === 'string' && productFromApi.color.trim())
    ? productFromApi.color.trim()
    : (dynamicColors[0] || "default");

  if (baseImgs.length > 0) {
    colorImagesMap[primaryColor] = baseImgs;
  }

  // 2. Images from colorImages array
  if (Array.isArray(productFromApi.colorImages)) {
    productFromApi.colorImages.forEach(ci => {
      if (ci?.color) {
        const cKey = ci.color.trim();
        const cImgs = [
          ...extractMediaUrls(ci.mainImage),
          ...extractMediaUrls(ci.wearableMedia),
          ...extractMediaUrls(ci.images)
        ].map(normalizeImgUrl).filter(Boolean);

        cImgs.forEach(img => allImagesSet.add(img));
        if (cImgs.length > 0) {
          colorImagesMap[cKey] = [...new Set([...(colorImagesMap[cKey] || []), ...cImgs])];
        }
      }
    });
  }

  // 3. Images from variations / variants
  if (Array.isArray(productFromApi.variations || productFromApi.variants)) {
    (productFromApi.variations || productFromApi.variants).forEach(v => {
      const vImgs = [
        ...extractMediaUrls(v.image),
        ...extractMediaUrls(v.image_path),
        ...extractMediaUrls(v.images),
        ...extractMediaUrls(v.photo)
      ].map(normalizeImgUrl).filter(Boolean);

      vImgs.forEach(img => allImagesSet.add(img));
      if (v.color && vImgs.length > 0) {
        const cKey = v.color.trim();
        colorImagesMap[cKey] = [...new Set([...(colorImagesMap[cKey] || []), ...vImgs])];
      }
    });
  }

  const allProductImages = Array.from(allImagesSet);
  if (allProductImages.length === 0) {
    allProductImages.push("https://placehold.co/800x800?text=No+Image+Available");
  }

  // Map API fields to our expected layout structure
  const product = {
    id: productFromApi.id || productFromApi.product_id || productFromApi.id_product || productFromApi._id,
    _id: productFromApi._id || productFromApi.id || productFromApi.product_id,
    title: productFromApi.name || productFromApi.product_name || productFromApi.title || "Premium Dress",
    price: productFromApi.price,
    salePrice: productFromApi.sale_price ?? productFromApi.salePrice ?? productFromApi.discount_price ?? null,
    actualPrice: productFromApi.actual_price ?? productFromApi.regular_price ?? productFromApi.original_price ?? productFromApi.mrp ?? productFromApi.price ?? null,
    usdPrice: productFromApi.usd_price || productFromApi.usdPrice,
    usdSalePrice: productFromApi.usd_sale_price || productFromApi.usdSalePrice,
    basePrice: Number(productFromApi.price) || 0,
    currency: productFromApi.currency || '₹',
    inventory: productFromApi.totalInventory ?? productFromApi.inventory ?? productFromApi.stock ?? null,
    variations: productFromApi.variations || productFromApi.variants || [],
    description: (productFromApi.short_description || productFromApi.description || productFromApi.product_specification || "")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim(),
    fullDescription: (productFromApi.product_detail || productFromApi.description || "")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
      || productFromApi.product_specification,
    category: productFromApi.sku_name || productFromApi.category?.name || productFromApi.category || "N/A",
    type: productFromApi.sub_category?.name || productFromApi.type || productFromApi.collection || "",
    color: productFromApi.color || productFromApi.variations?.[0]?.color || dynamicColors[0] || "N/A",
    material: productFromApi.material || productFromApi.fabric || "Pure Velvet & Silk Blend",
    work: productFromApi.work || productFromApi.craft || "Zardosi & Hand Embroidery",
    packaging: productFromApi.packaging || "1 Set in Sacred Protective Packaging",
    care: productFromApi.care || "Dry Clean or Gentle Wipe with Soft Cloth",
    disclaimer: productFromApi.disclaimer || productFromApi.product_disclaimer || "The product color may slightly vary due to photographic lighting sources or your monitor settings.",
    sku: productFromApi.sku || productFromApi.sku_code || productFromApi.sku_name || `SD-${(productFromApi.id || 100).toString().padStart(4, '0')}`,
    images: allProductImages,
    colorImagesMap,
    colorImages: productFromApi.colorImages || [],
    // Raw per-size pricing data from schema's sizes[] (size + price + inventory, no color)
    rawSizes: Array.isArray(productFromApi.sizes) ? productFromApi.sizes : [],

    sizes: (() => {
      const fromSchemaSizes = Array.isArray(productFromApi.sizes)
        ? productFromApi.sizes
            .map(s => (typeof s === 'object' && s !== null ? s.size : s))
            .filter(s => typeof s === 'string' && s.trim() !== "")
        : [];
      const fromVariations = Array.isArray(productFromApi.variations || productFromApi.variants)
        ? (productFromApi.variations || productFromApi.variants)
            .map(v => v.size)
            .filter((value, index, self) => typeof value === 'string' && value.trim() !== "" && self.indexOf(value) === index)
        : [];
      const fromOptions = Array.isArray(productFromApi.options?.sizes)
        ? productFromApi.options.sizes.filter(s => typeof s === 'string' && s.trim() !== "")
        : [];

      const combined = fromSchemaSizes.length > 0
        ? fromSchemaSizes
        : (fromVariations.length > 0 ? fromVariations : fromOptions);

      return [...new Set(combined)];
    })(),
    colors: dynamicColors,
    slug: productFromApi.slug,
    attributes: Array.isArray(productFromApi.attributes) ? productFromApi.attributes : [],
    rating: Number(productFromApi.rating) || 0,
    numReviews: Number(productFromApi.numReviews) || (Array.isArray(productFromApi.reviews) ? productFromApi.reviews.length : 0),
    reviews: Array.isArray(productFromApi.reviews) ? productFromApi.reviews : []
  };

  const relatedProducts = relatedProductsApi.map(p => {
    const rawImg = p.image_path || p.mainImage || (Array.isArray(p.images) ? p.images[0] : null) || p.image;
    const image = (rawImg && typeof rawImg === 'string')
      ? (rawImg.startsWith('http') ? rawImg : `${IMAGE_BASE_URL}${rawImg.replace(/^\/+/, '')}`)
      : "https://placehold.co/400x400?text=No+Image";
    return {
      id: p.id || p._id,
      _id: p._id || p.id,
      title: p.name || p.title,
      slug: p.slug,
      description: p.short_description || p.description || "Premium Dress",
      price: p.price,
      salePrice: p.sale_price ?? p.salePrice ?? null,
      usdPrice: p.usd_price || p.usdPrice,
      rating: Number(p.rating) || 0,
      numReviews: Number(p.numReviews) || (Array.isArray(p.reviews) ? p.reviews.length : 0),
      image,
    };
  });


  return (
    <main className="bg-[#FFFFFF] text-[#2f2a28]">
      <Header />

      <section className="mx-auto max-w-[1440px] h-auto min-h-[400px] px-6 sm:px-10 md:px-16 lg:px-14 xl:px-24 py-6 md:py-8">
        {/* Breadcrumb Removed */}
        <ProductContainer product={product} relatedProducts={relatedProducts} />
      </section>

      {relatedProducts.length > 0 && (
        <section className="bg-[#F5F5F5] py-12 md:py-16">
          <div className="mx-auto max-w-[1440px] px-6 sm:px-10 md:px-16 lg:px-14 xl:px-24">
            <div className="flex items-end justify-between mb-10">
              <h2 className="font-playfair text-[24px] sm:text-[32px] font-bold text-[#241F1C]">
                Popular this week
              </h2>
              <Link
                href="/shop"
                className="text-[12px] font-semibold text-[#135B42] hover:text-[#0F4A36] shrink-0"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <WhyLoveUs />

      {/* <StayInTouch /> */}
      <Footer />
    </main>
  );
}
