"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkspacesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/workspaces");
  }, [router]);

  return null;
}
