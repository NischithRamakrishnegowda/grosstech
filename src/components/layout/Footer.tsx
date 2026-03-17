import Link from "next/link";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-100 border-t border-slate-200 text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-lg text-slate-900 tracking-tight">
                Gross<span className="text-green-600">Tech</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Your trusted marketplace for daily essential goods — rice, sugar, oil and more.
              Connecting buyers and sellers across India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-slate-700 font-semibold mb-3 text-xs uppercase tracking-widest">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#about" className="hover:text-green-600 transition-colors">About Us</Link></li>
              <li><Link href="/products" className="hover:text-green-600 transition-colors">Products</Link></li>
              <li><Link href="/#contact" className="hover:text-green-600 transition-colors">Contact</Link></li>
              <li><Link href="/login" className="hover:text-green-600 transition-colors">Login</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <h3 className="text-slate-700 font-semibold mb-3 text-xs uppercase tracking-widest">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-600 shrink-0" />
                <span>nischithramakrishnegowda@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600 shrink-0" />
                <span>+91 90085 78425</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>Bangalore, Karnataka, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200/70 mt-8 pt-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Gross Tech. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
