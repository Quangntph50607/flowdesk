"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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

type Mode = "login" | "register";

export function AuthCard({ className, ...props }: React.ComponentProps<"div">) {
  const [mode, setMode] = useState<Mode>("login");
  const [direction, setDirection] = useState(1);

  const switchTo = (next: Mode) => {
    setDirection(next === "register" ? 1 : -1);
    setMode(next);
  };

  const isLogin = mode === "login";

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="relative grid p-0 md:grid-cols-2 min-h-105">
          {/* Ảnh — login: phải, register: trái */}
          <motion.div
            className={cn(
              "relative hidden bg-muted md:block",
              isLogin ? "order-2" : "order-1",
            )}
            layout
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <Image
              src="/placeholder.svg"
              alt="Ảnh minh hoạ"
              fill
              className="object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </motion.div>

          {/* Form — login: trái, register: phải */}
          <motion.div
            className={cn(isLogin ? "order-1" : "order-2")}
            layout
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.form
                key={mode}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="p-6 md:p-8 h-full"
              >
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">
                      {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản"}
                    </h1>
                    <p className="text-balance text-muted-foreground">
                      {isLogin
                        ? "Đăng nhập vào tài khoản Flowdesk của bạn"
                        : "Đăng ký để bắt đầu sử dụng Flowdesk"}
                    </p>
                  </div>

                  {!isLogin && (
                    <Field>
                      <FieldLabel htmlFor="fullName">Họ và tên</FieldLabel>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        required
                      />
                    </Field>
                  )}

                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                      {isLogin && (
                        <a
                          href="#"
                          className="ml-auto text-sm underline-offset-2 hover:underline"
                        >
                          Quên mật khẩu?
                        </a>
                      )}
                    </div>
                    <Input id="password" type="password" required />
                  </Field>

                  {!isLogin && (
                    <Field>
                      <FieldLabel htmlFor="confirmPassword">
                        Xác nhận mật khẩu
                      </FieldLabel>
                      <Input id="confirmPassword" type="password" required />
                    </Field>
                  )}

                  <Field>
                    <Button type="submit">
                      {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
                    </Button>
                  </Field>

                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    Hoặc tiếp tục với
                  </FieldSeparator>

                  <Field>
                    <Button variant="outline" type="button">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="sr-only">
                        {isLogin ? "Đăng nhập" : "Đăng ký"} với Google
                      </span>
                    </Button>
                  </Field>

                  <FieldDescription className="text-center">
                    {isLogin ? (
                      <>
                        Chưa có tài khoản?{" "}
                        <button
                          type="button"
                          onClick={() => switchTo("register")}
                          className="underline underline-offset-2 hover:text-primary"
                        >
                          Đăng ký
                        </button>
                      </>
                    ) : (
                      <>
                        Đã có tài khoản?{" "}
                        <button
                          type="button"
                          onClick={() => switchTo("login")}
                          className="underline underline-offset-2 hover:text-primary"
                        >
                          Đăng nhập
                        </button>
                      </>
                    )}
                  </FieldDescription>
                </FieldGroup>
              </motion.form>
            </AnimatePresence>
          </motion.div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <a href="#" className="underline underline-offset-2 hover:text-primary">
          Điều khoản dịch vụ
        </a>{" "}
        và{" "}
        <a href="#" className="underline underline-offset-2 hover:text-primary">
          Chính sách bảo mật
        </a>
        .
      </FieldDescription>
    </div>
  );
}
