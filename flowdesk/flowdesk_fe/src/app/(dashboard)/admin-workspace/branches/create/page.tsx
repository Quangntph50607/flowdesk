"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyCreateBranchPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin-workspace/branches");
  }, [router]);

  return null;
}
