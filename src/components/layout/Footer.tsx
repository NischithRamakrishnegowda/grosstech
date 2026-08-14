import Link from "next/link";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const adminEmail = process.env.ADMIN_EMAIL || "support@grosstech.in";
  const adminPhone = process.env.ADMIN_PHONE || "";

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-gray-800">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg text-white tracking-tight">
                Gross<span className="text-green-500">Tech</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              India&apos;s trusted B2B marketplace for daily essential goods.
              Connecting buyers and verified sellers across the country.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs bg-green-900/40 text-green-400 border border-green-800/40 px-3 py-1 rounded-full font-medium">
                Secure Escrow Payments
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-4">Platform</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/products", label: "Browse Products" },
                { href: "/signup?role=BUYER", label: "Register as Buyer" },
                { href: "/signup?role=SELLER", label: "Become a Seller" },
                { href: "/login", label: "Sign In" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-green-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={`mailto:${adminEmail}`} className="flex items-start gap-2.5 hover:text-green-400 transition-colors">
                  <Mail className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="break-all">{adminEmail}</span>
                </a>
              </li>
              {adminPhone && (
                <li>
                  <a href={`tel:${adminPhone}`} className="flex items-center gap-2.5 hover:text-green-400 transition-colors">
                    <Phone className="w-4 h-4 text-green-600 shrink-0" />
                    <span>{adminPhone}</span>
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>Bangalore, Karnataka, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} Gross Tech. All rights reserved.</p>
          <p>Made with care for India&apos;s wholesale businesses</p>
        </div>
      </div>
    </footer>
  );
}
