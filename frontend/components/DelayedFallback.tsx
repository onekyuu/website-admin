"use client";
import { useEffect, useState } from "react";

export function DelayedFallback({
  delay = 300,
  children,
}: {
  delay?: number;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) {
    return null;
  }

  return <>{children}</>;
}
