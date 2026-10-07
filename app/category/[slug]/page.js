import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  let categoryName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      const categories = Array.isArray(data)
        ? data
        : data.categories || data.data || [];
      const match = categories.find(
        (category) =>
          String(category.slug || "").toLowerCase() === slug.toLowerCase() ||
          String(category._id || category.id) === slug
      );
      if (match?.name) categoryName = match.name;
    }
  } catch {
    // ignore - fall back to the slug-derived name
  }

  return {
    title: `${categoryName} - Buy Online | Sri Divyam`,
    description: `Shop handcrafted ${categoryName} at Sri Divyam. Premium fabrics, fine detailing and custom sizing for your beloved deities, with fast delivery across India.`,
    alternates: {
      canonical: `/category/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;

  let products = [];
  let categoryName = "Category";
  let resolvedCategory = null;

  try {
    const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { next: { revalidate: 60 } });
    if (categoriesRes.ok) {
      const categoriesData = await categoriesRes.json();
      const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData.categories || categoriesData.data || []);
      resolvedCategory = categories.find(category =>
        String(category.slug || "").toLowerCase() === slug.toLowerCase() ||
        String(category._id || category.id) === slug
      );
    }

    const categoryKey = resolvedCategory?._id || resolvedCategory?.id || resolvedCategory?.slug || slug;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/category/${categoryKey}`, { next: { revalidate: 60 } });
    
    if (res.ok) {
      const data = await res.json();
      if (data) {
        let rawProducts = data.products || (data.data && data.data.products) || data.data || [];
        if (!Array.isArray(rawProducts)) rawProducts = [];
        
        const IMAGE_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/uploads/`;
        
        products = rawProducts.map(p => {
          let img = p.mainImage || (p.images && p.images[0]) || p.image || p.image_path;
          let imageUrl = img ? (img.startsWith('http') ? img : `${IMAGE_BASE_URL}${img}`) : null;
          
          return {
            id: p.id,
            title: p.name,
            slug: p.slug,
            description: p.short_description || "Premium Dress",
            price: p.price,
            usdPrice: p.usd_price,
            image: imageUrl,
          };
        });
      }
    }

    // Fallback: If no products found via category endpoint, fetch all and filter manually
    if (products.length === 0) {
      const allRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, { next: { revalidate: 60 } });
      if (allRes.ok) {
        const allData = await allRes.json();
        let allProds = allData.products || (allData.data && allData.data.products) || allData.data || [];
        if (!Array.isArray(allProds)) allProds = [];
        
        const IMAGE_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/uploads/`;
        
        const mappedProds = allProds.map(p => {
          let img = p.mainImage || (p.images && p.images[0]) || p.image || p.image_path;
          let imageUrl = img ? (img.startsWith('http') ? img : `${IMAGE_BASE_URL}${img}`) : null;
          return {
            id: p.id,
            title: p.name,
            slug: p.slug,
            description: p.short_description || "Premium Dress",
            price: p.price,
            usdPrice: p.usd_price,
            image: imageUrl,
            rawCategory: p.category,
            rawCategories: p.categories || []
          };
        });

        const s = (resolvedCategory?.slug || resolvedCategory?.name || slug).toLowerCase();
        products = mappedProds.filter(p => {
          const catName = [
            p.rawCategory?.name,
            p.rawCategory?.slug,
            typeof p.rawCategory === 'string' ? p.rawCategory : "",
            ...(Array.isArray(p.rawCategories) ? p.rawCategories.flatMap(category => [category?.name, category?.slug, category]) : [])
          ].filter(Boolean).join(" ").toLowerCase();
          const title = (p.title || '').toLowerCase();
          
          if (s.includes('laddu') || s.includes('gopal')) {
            return catName.includes('laddu') || catName.includes('gopal') || catName.includes('krishan') || catName.includes('poshak') || title.includes('laddu') || title.includes('gopal') || title.includes('poshak') || title.includes('krishna');
          }
          if (s.includes('radhe') || s.includes('radha')) {
            return catName.includes('radha') || catName.includes('krishna') || title.includes('radha') || title.includes('krishna');
          }
          if (s.includes('mata')) {
            return catName.includes('mata') || catName.includes('rani') || catName.includes('durga') || catName.includes('sherawali') || title.includes('mata') || title.includes('rani');
          }
          if (s.includes('god-dresses') || s.includes('god dresses')) {
            // God dresses includes all of the above
            return catName.includes('laddu') || catName.includes('gopal') || catName.includes('poshak') || title.includes('laddu') || title.includes('gopal') ||
                   catName.includes('radha') || catName.includes('krishna') || title.includes('radha') || title.includes('krishna') ||
                   catName.includes('mata') || catName.includes('rani') || catName.includes('durga') || catName.includes('sherawali') || title.includes('mata') || title.includes('rani');
          }
          return catName.includes(s) || title.includes(s);
        });
      }
    }

    // Try to elegantly infer a proper title from the slug, ignoring random backend suffixes if possible
    const words = (resolvedCategory?.name || slug).split('-');
    // If the last part is just a random string, we might ignore it, but for now we'll just format it
    categoryName = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
  } catch (error) {
    console.error("Failed to fetch category products:", error);
    // Continue and show empty state
  }

  const isGodDresses = slug.toLowerCase() === 'god-dresses';

  return (
    <main className="bg-[#F8F6F3] min-h-screen flex flex-col text-[#2f2a28]">
      <Header />

      <section className="flex-1 mx-auto w-full max-w-[1440px] px-6 sm:px-10 md:px-16 lg:px-24 py-10 sm:py-16">
        <div className="text-center mb-8 sm:mb-12 lg:mb-14">
          <h1 className="text-[24px] sm:text-[32px] md:text-[40px] font-playfair text-[#303030] font-bold leading-tight">
            {categoryName}
          </h1>
          <p className="mt-3 text-gray-500 text-[14px] sm:text-[16px] max-w-[700px] mx-auto font-gt-walsheim italic">
            Explore our exclusive collection of premium handcrafted {categoryName}.
          </p>
        </div>

        {/* Subcategories for God Dresses */}
        {isGodDresses && (
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link href="/category/laddu-gopal" className="px-6 py-3 bg-white border border-[#135B42] text-[#135B42] hover:bg-[#135B42] hover:text-white font-bold rounded-full transition-colors text-sm sm:text-base">
              Laddu Gopal
            </Link>
            <Link href="/category/mata-rani" className="px-6 py-3 bg-white border border-[#135B42] text-[#135B42] hover:bg-[#135B42] hover:text-white font-bold rounded-full transition-colors text-sm sm:text-base">
              Mata Rani
            </Link>
            <Link href="/category/radhe-rani" className="px-6 py-3 bg-white border border-[#135B42] text-[#135B42] hover:bg-[#135B42] hover:text-white font-bold rounded-full transition-colors text-sm sm:text-base">
              Radha Krishna
            </Link>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center text-gray-500 py-16 sm:py-20 px-6 bg-white ring-1 ring-[#EFEAE4] rounded-sm">
            <p className="text-base sm:text-lg font-gt-walsheim">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 justify-items-center max-w-[1200px] mx-auto">
            {products.map((item) => (
              <div key={item.id} className="w-full h-full transition-transform duration-300 hover:-translate-y-1.5 sm:hover:-translate-y-2">
                  <ProductCard product={item} />
              </div>
            ))}
          </div>
        )}
      </section>


      <Footer />
    </main>
  );
}
