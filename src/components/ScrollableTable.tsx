"use client";

import { useRef } from "react";

export default function ScrollableTable({
  children,
  maxHeightRem = 24,
}: {
  children: React.ReactNode;
  maxHeightRem?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div ref={scrollRef} className="overflow-auto" style={{ maxHeight: `${maxHeightRem}rem` }}>
        {children}
      </div>
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => scrollRef.current?.scrollBy({ top: 250 })}
          className="btn-secondary text-xs py-1 px-3"
        >
          Scroll for more &darr;
        </button>
      </div>
    </div>
  );
}
