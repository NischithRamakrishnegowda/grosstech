"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";

function Bar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const prevRoute = useRef(`${pathname}${searchParams}`);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("tel")) return;
      clearTimeout(hideTimer.current);
      setDone(false);
      setActive(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const route = `${pathname}${searchParams}`;
    if (active && route !== prevRoute.current) {
      prevRoute.current = route;
      setDone(true);
      hideTimer.current = setTimeout(() => {
        setActive(false);
        setDone(false);
      }, 400);
    } else {
      prevRoute.current = route;
    }
  }, [pathname, searchParams, active]);

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[3px] overflow-hidden pointer-events-none">
      <div
        className={
          done
            ? "h-full w-full bg-green-500 transition-all duration-300 ease-out"
            : "h-full bg-green-500 animate-nav-progress"
        }
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense>
      <Bar />
    </Suspense>
  );
}
