export const metadata = {
  title: "Your Shopping Cart | Sri Divyam",
  description:
    "Review the deity dresses, poshak and puja essentials in your Sri Divyam cart, update quantities and proceed to a secure checkout.",
  alternates: {
    canonical: "/cart",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function CartLayout({ children }) {
  return children;
}
