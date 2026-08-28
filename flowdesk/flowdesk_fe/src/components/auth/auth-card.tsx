"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLogin, useRegister } from "@/hooks/use-auth";

type Mode = "login" | "register";

export function AuthCard({ className, ...props }: React.ComponentProps<"div">) {
  const [mode, setMode] = useState<Mode>("login");
  const [direction, setDirection] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const isLogin = mode === "login";
  const isPending = loginMutation.isPending || registerMutation.isPending;

  // Hiển thị lỗi từ mutation (ví dụ: không phải SUPER_ADMIN)
  const mutationError =
    (loginMutation.error as { message?: string } | null)?.message ||
    (
      registerMutation.error as {
        response?: { data?: { message?: string } };
      } | null
    )?.response?.data?.message;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Reset khi vào màn
  useEffect(() => {
    resetForm();
  }, []);

  const switchTo = (next: Mode) => {
    setDirection(next === "register" ? 1 : -1);
    setMode(next);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLogin && password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      if (isLogin) {
        await loginMutation.mutateAsync({ email, password });
      } else {
        await registerMutation.mutateAsync({ email, password, fullName });
      }
      resetForm();
    } catch (err: unknown) {
      // Lỗi từ throw trong onSuccess (vd: không phải SUPER_ADMIN)
      const throwMsg = (err as { message?: string })?.message;
      // Lỗi từ API response
      const apiMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(throwMsg || apiMsg || "Đã có lỗi xảy ra, vui lòng thử lại");
    }
  };

  return (
    <div
      className={cn("flex flex-col gap-6 w-full max-w-4xl mx-auto", className)}
      {...props}
    >
      <Card className="overflow-hidden p-0 rounded-lg border-border/60 shadow-2xl shadow-blue-500/10 backdrop-blur-xl bg-card/95">
        <CardContent className="relative grid p-0 md:grid-cols-2 min-h-[520px]">
          {/* Side Banner Graphic — login: phải, register: trái */}
          <motion.div
            className={cn(
              "relative hidden md:flex flex-col justify-between p-8 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white",
              isLogin ? "order-2" : "order-1",
            )}
            layout
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Background Glow Orbs */}
            <div className="absolute -top-24 -left-24 size-72 rounded-full bg-blue-500/30 blur-3xl animate-pulse-glow" />
            <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-cyan-500/25 blur-3xl animate-pulse-glow" />

            {/* Top Brand Tag */}
            <div className="relative z-10 flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/20 backdrop-blur-md border border-blue-400/30 shadow-lg">
                <ShieldCheck className="size-5 text-blue-400" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent">
                Flowdesk
              </span>
            </div>

            {/* Middle Floating Feature Card Art */}
            <div className="relative z-10 my-auto space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 backdrop-blur-md px-3 py-1 text-xs font-medium text-cyan-300 border border-blue-500/20">
                <Sparkles className="size-3.5 text-cyan-400" />
                <span>Next-Gen Workspace Management</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                {isLogin
                  ? "Quản lý công việc hiệu quả & tối ưu"
                  : "Bắt đầu trải nghiệm quản trị hiện đại"}
              </h2>
              <p className="text-sm text-blue-200/80 leading-relaxed">
                Nền tảng quản lý Workspace tập trung, hỗ trợ phân quyền chi
                nhánh và tối ưu hoá hiệu suất công việc team.
              </p>

              {/* Decorative Mini Stats Badge */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-white/5 backdrop-blur-md p-3.5 border border-white/10">
                  <p className="text-xs text-blue-300/80">Bảo mật</p>
                  <p className="text-base font-semibold text-white mt-0.5">
                    Role-Based Auth
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 backdrop-blur-md p-3.5 border border-white/10">
                  <p className="text-xs text-blue-300/80">Hệ thống</p>
                  <p className="text-base font-semibold text-white mt-0.5">
                    Tốc độ cao
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Quote */}
            <div className="relative z-10 pt-4 border-t border-white/10 text-xs text-blue-300/60 flex items-center justify-between">
              <span>© Flowdesk Admin</span>
              <span className="flex items-center gap-1 text-blue-400 font-medium">
                Super Admin Portal <ArrowRight className="size-3" />
              </span>
            </div>
          </motion.div>

          {/* Form Side — login: trái, register: phải */}
          <motion.div
            className={cn(
              "flex flex-col justify-center",
              isLogin ? "order-1" : "order-2",
            )}
            layout
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.form
                key={mode}
                custom={direction}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="p-8 md:p-10 flex flex-col justify-center min-h-full"
                onSubmit={handleSubmit}
              >
                <FieldGroup className="space-y-4">
                  <div className="flex flex-col gap-1.5 mb-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      {isLogin
                        ? "Chào mừng trở lại 👋"
                        : "Tạo tài khoản mới ✨"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {isLogin
                        ? "Đăng nhập để truy cập trang quản trị Flowdesk"
                        : "Điền thông tin bên dưới để bắt đầu đăng ký"}
                    </p>
                  </div>

                  {!isLogin && (
                    <Field>
                      <FieldLabel
                        htmlFor="fullName"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Họ và tên
                      </FieldLabel>
                      <div className="relative mt-1">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Nguyễn Văn A"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 h-11 rounded-lg bg-muted/40 focus:bg-background border-border/80"
                          required
                        />
                      </div>
                    </Field>
                  )}

                  <Field>
                    <FieldLabel
                      htmlFor="email"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Email
                    </FieldLabel>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@flowdesk.vn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 rounded-lg bg-muted/40 focus:bg-background border-border/80"
                        required
                      />
                    </div>
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel
                        htmlFor="password"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Mật khẩu
                      </FieldLabel>
                      {isLogin && (
                        <a
                          href="#"
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Quên mật khẩu?
                        </a>
                      )}
                    </div>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        placeholder="••••••••"
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 rounded-lg bg-muted/40 focus:bg-background border-border/80"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </Field>

                  {!isLogin && (
                    <Field>
                      <FieldLabel
                        htmlFor="confirmPassword"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Xác nhận mật khẩu
                      </FieldLabel>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          placeholder="••••••••"
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 rounded-lg bg-muted/40 focus:bg-background border-border/80"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </Field>
                  )}

                  {(error || mutationError) && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{error || mutationError}</span>
                    </motion.div>
                  )}

                  <Field className="pt-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-11 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all duration-200"
                    >
                      {isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Đang xử lý...
                        </span>
                      ) : isLogin ? (
                        "Đăng nhập"
                      ) : (
                        "Tạo tài khoản"
                      )}
                    </Button>
                  </Field>

                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card *:data-[slot=field-separator-content]:text-muted-foreground *:data-[slot=field-separator-content]:text-xs">
                    Hoặc tiếp tục với
                  </FieldSeparator>

                  <Field>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full h-11 rounded-lg font-medium border-border/80 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="size-4"
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>Google</span>
                    </Button>
                  </Field>

                  <FieldDescription className="text-center pt-2 text-xs">
                    {isLogin ? (
                      <span>
                        Chưa có tài khoản?{" "}
                        <button
                          type="button"
                          onClick={() => switchTo("register")}
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Đăng ký ngay
                        </button>
                      </span>
                    ) : (
                      <span>
                        Đã có tài khoản?{" "}
                        <button
                          type="button"
                          onClick={() => switchTo("login")}
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Đăng nhập
                        </button>
                      </span>
                    )}
                  </FieldDescription>
                </FieldGroup>
              </motion.form>
            </AnimatePresence>
          </motion.div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <a
          href="#"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Điều khoản dịch vụ
        </a>{" "}
        và{" "}
        <a
          href="#"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Chính sách bảo mật
        </a>
        .
      </FieldDescription>
    </div>
  );
}
