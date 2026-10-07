export const metadata = {
  title: "My Order History | Sri Divyam",
  description:
    "View and track all your Sri Divyam orders for handcrafted deity dresses, ornaments and puja essentials in one place.",
  alternates: {
    canonical: "/profile/orders",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersLayout({ children }) {
  return children;
}
