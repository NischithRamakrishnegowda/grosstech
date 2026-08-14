"use client";

import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Clock, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";

const STATS = [
  { value: "500+",   label: "Products Listed" },
  { value: "1,000+", label: "Registered Buyers" },
  { value: "50+",    label: "Verified Sellers" },
];

const BENTO = [
  { src: "/hero/hero1.jpg", span: "row-span-2" },
  { src: "/hero/hero2.jpg", span: "" },
  { src: "/hero/hero3.jpg", span: "" },
];

const CYCLING_WORDS = ["Quality.", "Price.", "Support."];

export default function HeroSection() {
  const [displayed, setDisplayed] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const word = CYCLING_WORDS[wordIndex];

    if (typing) {
      if (displayed.length < word.length) {
        const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
        return () => clearTimeout(t);
      } else {
        // finished typing — pause then start deleting
        const t = setTimeout(() => setTyping(false), 1800);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
        return () => clearTimeout(t);
      } else {
        // finished deleting — move to next word
        setWordIndex((i) => (i + 1) % CYCLING_WORDS.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, wordIndex]);

  return (
    <section className="bg-white">
      {/* ── Main panel ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">

          {/* ── Left copy (3/5) ── */}
          <div className="lg:col-span-3 space-y-7">
            {/* Eyebrow */}
            <div className="animate-fade-up inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-full">
              🌿 Wholesale Marketplace
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
              <span className="block animate-fade-up [animation-delay:100ms]">Fresh Essentials,</span>
              <span className="block animate-fade-up [animation-delay:220ms]">
                Best{" "}
                <span className="text-green-600 inline-block">
                  {displayed}
                  <span className="inline-block w-[3px] h-[0.85em] bg-green-500 ml-0.5 align-middle animate-blink" />
                </span>
              </span>
            </h1>

            {/* Body */}
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed animate-fade-up [animation-delay:340ms]">
              Buy rice, sugar, oil and daily staples{" "}
              <span className="font-semibold text-slate-700">directly from verified sellers</span>.
              Secure payments, transparent fees, doorstep delivery.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 pt-1 animate-fade-up [animation-delay:460ms]">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-100 text-base group"
              >
                Shop Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/signup?role=SELLER"
                className="inline-flex items-center gap-2 border-2 border-slate-200 text-slate-700 font-semibold px-7 py-3.5 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all text-base"
              >
                Sell with Us
              </Link>
            </div>

            {/* Trust checklist */}
            <div className="flex flex-col sm:flex-row gap-x-8 gap-y-2.5 pt-1 animate-fade-up [animation-delay:560ms]">
              {[
                { icon: ShieldCheck, text: "Secure Escrow Payments" },
                { icon: Clock,       text: "3-Day Hold Protection" },
                { icon: BadgeCheck,  text: "Verified Sellers Only" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right bento grid (2/5) ── */}
          <div className="hidden lg:block lg:col-span-2 animate-fade-in [animation-delay:300ms]">
            <div className="grid grid-cols-2 grid-rows-2 gap-3 h-[460px]">
              {BENTO.map((item, i) => (
                <div
                  key={i}
                  className={`relative rounded-2xl overflow-hidden shadow-sm ${item.span}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-3 gap-4 divide-x divide-slate-200">
            {STATS.map((s) => (
              <div key={s.label} className="text-center px-4 first:pl-0 last:pr-0">
                <div className="text-2xl font-black text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
