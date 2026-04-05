"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function Wrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const prevKey = useRef(`${pathname}${searchParams}`);

  useEffect(() => {
    function onFilterChange() {
      setPending(true);
    }
    window.addEventListener("products-filter-change", onFilterChange);
    return () => window.removeEventListener("products-filter-change", onFilterChange);
  }, []);

  useEffect(() => {
    const key = `${pathname}${searchParams}`;
    if (key !== prevKey.current) {
      prevKey.current = key;
      setPending(false);
    }
  }, [pathname, searchParams]);

  return (
    <div
      className={`transition-opacity duration-150 ${
        pending ? "opacity-40 pointer-events-none" : "opacity-100"
      }`}
    >
      {children}
    </div>
  );
}

export function ProductGridWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <Wrapper>{children}</Wrapper>
    </Suspense>
  );
}
