import { redirect } from "next/navigation";

// Root "/" redirect sang login
export default function RootPage() {
  redirect("/login");
}
