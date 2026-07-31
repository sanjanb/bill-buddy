import { z } from "zod";

export const BillItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100),
  hsn: z.string().max(20).optional().default(""),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(99999),
  rate: z.number().min(0, "Rate cannot be negative").max(9999999),
  gstRate: z.number().min(0).max(28),
});

export const BillFormSchema = z.object({
  customerName: z.string().max(100).optional().default(""),
  customerPhone: z.string().max(15).optional().default(""),
  gstType: z.enum(["intra", "inter"]),
  items: z.array(BillItemSchema).min(1, "At least one item is required"),
});

export const SettingsSchema = z.object({
  shopName: z.string().max(100).optional().default(""),
  shopAddress: z.string().max(200).optional().default(""),
  shopGSTIN: z.string().max(15).optional().default(""),
  logo: z.string().optional().default(""),
  defaultGSTRate: z.number().min(0).max(28),
});

export type BillFormData = z.infer<typeof BillFormSchema>;