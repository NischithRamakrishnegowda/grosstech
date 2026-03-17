import Link from "next/link";
import { Package, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <Package className="w-5 h-5 text-green-400" />
              <span>Gross<span className="text-green-400">Tech</span></span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs">
              Your trusted marketplace for daily essential goods — rice, sugar, oil and more.
              Connecting buyers and sellers across India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#about" className="hover:text-green-400 transition-colors">About Us</Link></li>
              <li><Link href="/products" className="hover:text-green-400 transition-colors">Products</Link></li>
              <li><Link href="/#contact" className="hover:text-green-400 transition-colors">Contact</Link></li>
              <li><Link href="/login" className="hover:text-green-400 transition-colors">Login</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-400 shrink-0" />
                <span>support@grosstech.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-400 shrink-0" />
                <span>+91 90000 00000</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>Bangalore, Karnataka, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Gross Tech. All rights reserved.</p>
          <p>Platform fee: ₹20 per transaction</p>
        </div>
      </div>
    </footer>
  );
}
