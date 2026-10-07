import ProfileShell from "./ProfileShell";

export const metadata = {
  title: "My Account | Sri Divyam",
  description:
    "Manage your Sri Divyam account - update your profile, saved addresses, password and review your devotional order history.",
  alternates: {
    canonical: "/profile",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({ children }) {
  return <ProfileShell>{children}</ProfileShell>;
}
