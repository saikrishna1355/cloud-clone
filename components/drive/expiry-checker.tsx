"use client";

import { useEffect } from "react";

export function ExpiryChecker() {
  useEffect(() => {
    fetch("/api/expiry", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
