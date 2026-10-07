import Header from "./components/Header";
import Hero from "./components/Hero";
import PromoSection from "./components/PromoSection";
import Collections from "./components/Collections";
import LatestCollection from "./components/LatestCollection";
import ProductGrid from "./components/ProductGrid";
import DivinitySection from "./components/DivinitySection";
import LadduGopalDresses from "./components/LadduGopalDresses";
import SacredCraft from "./components/SacredCraft";
import MataRaniDresses from "./components/MataRaniDresses";
import GiftSection from "./components/GiftSection";
import FeedbackSection from "./components/FeedbackSection";
import FaqSection from "./components/FaqSection";
import Footer from "./components/Footer";

// 1) Meta title + description for the home page
export const metadata = {
  title: "Laddu Gopal Dress & Deity Poshak Online | Sri Divyam",
  description:
    "Shop premium handmade dresses, poshak & ornaments for Laddu Gopal Ji, Radha Krishna & Mata Rani. Fine fabrics, custom sizing and fast delivery across India.",
  alternates: {
    canonical: "/",
  },
};

const SITE_URL = "https://sridivyam.com";
const LOGO_URL =
  "https://res.cloudinary.com/w4kwyx1p/image/upload/v1786019226/sri_divyam_xy6keo.png";

// 2) Structured data (JSON-LD) for the Sri Divyam home page.
// Each schema is rendered as its own <script type="application/ld+json"> tag.
// Nodes still reference each other by @id, so Google merges them into one graph.

// 2a) The business behind the store
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "OnlineStore"],
  "@id": `${SITE_URL}/#organization`,
  name: "Sri Divyam",
  url: `${SITE_URL}/`,
  logo: {
    "@type": "ImageObject",
    "@id": `${SITE_URL}/#logo`,
    url: LOGO_URL,
    contentUrl: LOGO_URL,
    caption: "Sri Divyam",
  },
  image: { "@id": `${SITE_URL}/#logo` },
  description:
    "Sri Divyam is a devotional e-commerce store offering exquisite handmade dresses (poshak), ornaments and puja essentials for Laddu Gopal Ji, Radha Krishna and Mata Rani, blending devotion with traditional Indian craftsmanship and premium fabrics.",
  email: "sridivyamofficial@gmail.com",
  telephone: "+91-8433081227",
  priceRange: "₹₹",
  foundingLocation: "Meerut, Uttar Pradesh, India",
  address: {
    "@type": "PostalAddress",
    streetAddress: "D-69, Sector 1, Shatabdi Nagar, Near Rithani, Delhi Road",
    addressLocality: "Meerut",
    addressRegion: "Uttar Pradesh",
    postalCode: "250103",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-8433081227",
    email: "sridivyamofficial@gmail.com",
    contactType: "customer service",
    areaServed: ["IN", "US", "GB", "AE", "CA", "AU"],
    availableLanguage: ["en", "hi"],
  },
  areaServed: "Worldwide",
  knowsAbout: [
    "Laddu Gopal Dresses",
    "Radha Krishna Poshak",
    "Mata Rani Dresses",
    "Deity Ornaments & Shringar",
    "Puja Essentials",
    "Custom Sized Idol Dresses",
    "Hand Embroidery & Gota Patti Work",
    "Festival & Special Occasion Poshak",
    "Gift Sets for Devotees",
  ],
  sameAs: [
    "https://www.instagram.com/sridivyam_k",
    "https://www.facebook.com/share/1DLw5ZtjpU/",
    "https://www.youtube.com/@sridivyamm",
  ],
};

// 2b) The website as a whole (enables the sitelinks search box)
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: "Sri Divyam",
  description:
    "Premium handmade dresses, poshak and ornaments for Laddu Gopal Ji, Radha Krishna and Mata Rani.",
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en-IN",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// 2c) This specific page (the home page)
const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}/#webpage`,
  url: `${SITE_URL}/`,
  name: "Laddu Gopal Dress & Deity Poshak Online | Sri Divyam",
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#organization` },
  primaryImageOfPage: { "@id": `${SITE_URL}/#logo` },
  inLanguage: "en-IN",
  description:
    "Shop premium handmade dresses, poshak & ornaments for Laddu Gopal Ji, Radha Krishna & Mata Rani. Fine fabrics, custom sizing and fast delivery across India.",
};

// 2d) FAQ shown on the site (kept in sync with FaqSection.jsx)
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE_URL}/#faq`,
  mainEntity: [
    {
      "@type": "Question",
      name: "What is your design process like?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our design process begins with a deep understanding of traditional aesthetics and modern craftsmanship. We sketch initial concepts, select premium fabrics, and then our master artisans execute the intricate hand-embroidery to create a unique piece.",
      },
    },
    {
      "@type": "Question",
      name: "How long does shipping take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Standard shipping typically takes 5-7 business days within India. International shipping can take 10-15 business days depending on the destination and customs processing.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer custom sizing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, we specialize in custom sizing for all our deity dresses. You can provide specific measurements of your idol, and we will tailor the dress to ensure a perfect fit.",
      },
    },
    {
      "@type": "Question",
      name: "What materials do you use for the dresses?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We use only the finest materials including pure silk, velvet, organza, and high-quality cotton. All our embellishments like Gota Patti and Zardosi are made with premium threads and stones.",
      },
    },
  ],
};

// 2e) Breadcrumb trail for the home page
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${SITE_URL}/#breadcrumb`,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
  ],
};

const schemas = [
  organizationSchema,
  websiteSchema,
  webPageSchema,
  faqSchema,
  breadcrumbSchema,
];

export default function Home() {

  return (
    <main>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Header />
      <Hero />
      <PromoSection />
      <Collections />
      <LatestCollection />
      <ProductGrid />
      <DivinitySection />
      <LadduGopalDresses />
      <SacredCraft />
      <MataRaniDresses />
      <GiftSection />
      <FeedbackSection />
      <FaqSection />
      <Footer />
    </main>
  );
}
