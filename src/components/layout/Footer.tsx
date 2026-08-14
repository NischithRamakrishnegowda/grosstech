import Link from "next/link";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const adminEmail = process.env.ADMIN_EMAIL || "support@grosstech.in";
  const adminPhone = process.env.ADMIN_PHONE || "";

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-gray-800">

          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-white">Gross<span className="text-primary-400">Tech</span></span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
              India&apos;s wholesale marketplace for daily essentials.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">Platform</p>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/products",           label: "Browse Products"  },
                { href: "/signup?role=BUYER",  label: "Register as Buyer"},
                { href: "/signup?role=SELLER", label: "Become a Seller"  },
                { href: "/login",              label: "Sign In"          },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-primary-400 transition-colors text-xs">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/#about",   label: "About Us"    },
                { href: "/#contact", label: "Contact"     },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-primary-400 transition-colors text-xs">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div id="contact">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">Contact</p>
            <ul className="space-y-3 text-xs">
              <li>
                <a href={`mailto:${adminEmail}`} className="flex items-start gap-2 hover:text-primary-400 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                  <span className="break-all">{adminEmail}</span>
                </a>
              </li>
              {adminPhone && (
                <li>
                  <a href={`tel:${adminPhone}`} className="flex items-center gap-2 hover:text-primary-400 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    {adminPhone}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                Bangalore, Karnataka
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-5 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Gross Tech — All rights reserved.
        </div>
      </div>
    </footer>
  );
}
