"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { apiClient, API_BASE_URL } from "../utils/apiClient";

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!query.trim()) {
                setProducts([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const data = await apiClient.get("/api/products");
                let allProducts = data.products || (data.data && data.data.products) || data.data || [];
                if (!Array.isArray(allProducts)) allProducts = [];
                
                // Filter products based on query (checks name and description)
                const filtered = allProducts.filter(p => {
                    const searchTerm = query.toLowerCase();
                    const name = (p.name || p.title || "").toLowerCase();
                    const desc = (p.description || p.short_description || "").toLowerCase();
                    return name.includes(searchTerm) || desc.includes(searchTerm);
                });

                // Format products to match ProductCard expectations
                const formatted = filtered.map(p => {
                    let img = p.mainImage || (p.images && p.images[0]) || p.image || p.image_path;
                    let imageUrl = img ? (img.startsWith('http') ? img : `${API_BASE_URL}/uploads/${img}`) : null;
                    
                    return {
                        id: p.id,
                        title: p.name || p.title,
                        slug: p.slug,
                        description: p.short_description || p.description || "Premium Dress",
                        price: p.price,
                        usdPrice: p.usd_price,
                        image: imageUrl,
                    };
                });

                setProducts(formatted);
            } catch (err) {
                console.error("Search Error:", err);
                setError("Something went wrong while searching. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSearchResults();
    }, [query]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#135B42] mb-4" size={40} />
                <p className="text-gray-500 font-medium">Searching for "{query}"...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 mx-auto w-full max-w-[1440px] px-6 sm:px-10 md:px-16 lg:px-24 py-10 sm:py-16">
            <div className="mb-10">
                <h1 className="text-[24px] sm:text-[32px] font-playfair text-[#303030] font-bold">
                    {products.length > 0 ? (
                        <>Results for <span className="text-[#135B42]">"{query}"</span></>
                    ) : (
                        <>No results found for <span className="text-[#135B42]">"{query}"</span></>
                    )}
                </h1>
                <p className="mt-2 text-gray-500 text-sm italic">
                    Found {products.length} {products.length === 1 ? 'product' : 'products'} matching your search.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-sm border border-red-100 mb-10">
                    {error}
                </div>
            )}

            {products.length === 0 ? (
                <div className="text-center py-20 bg-[#F9F7F5] border border-dashed border-[#E8DDD4] rounded-sm">
                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-[#303030] mb-2">We couldn't find anything</h3>
                    <p className="text-gray-500 max-w-md mx-auto px-6">
                        Try checking your spelling or use more general terms to find what you're looking for.
                    </p>
                    <Link href="/" className="inline-block mt-8 bg-[#135B42] text-white px-8 py-3 font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-white hover:text-[#135B42] border border-transparent hover:border-[#135B42] transition-colors shadow-lg">
                        Browse Collections
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 justify-items-center">
                    {products.map((item) => (
                        <div key={item.id} className="w-full h-full transition-transform duration-300 hover:-translate-y-1.5 sm:hover:-translate-y-2">
                            <ProductCard product={item} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <main className="bg-white min-h-screen flex flex-col font-primary">
            <Header />
            <Suspense fallback={
                <div className="flex-1 flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-[#135B42]" size={40} />
                </div>
            }>
                <SearchResults />
            </Suspense>
            <Footer />
        </main>
    );
}
