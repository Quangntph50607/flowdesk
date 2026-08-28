import { AuthCard } from "@/components/auth/auth-card";

export default function LoginPage() {
  return (
    <div className="relative min-h-svh flex flex-col items-center justify-center bg-background p-4 md:p-8 overflow-hidden">
      {/* Background Glow Accents */}
      <div className="pointer-events-none absolute top-0 left-1/4 size-96 rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 size-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      
      <div className="relative z-10 w-full">
        <AuthCard />
      </div>
    </div>
  );
}

