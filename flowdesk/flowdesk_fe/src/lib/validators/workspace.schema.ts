import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(150),
  slug: z
    .string()
    .min(2, "Slug phải có ít nhất 2 ký tự")
    .max(150)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug chỉ gồm chữ thường, số và dấu gạch ngang",
    ),
  ownerEmail: z
    .string()
    .email("Email không hợp lệ")
    .min(1, "Vui lòng chọn chủ workspace"),
});

export type CreateWorkspaceSchema = z.infer<typeof createWorkspaceSchema>;
