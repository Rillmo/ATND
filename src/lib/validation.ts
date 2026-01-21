import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(2)
  .max(50)
  .regex(/^[A-Za-z가-힣0-9]+(?:[ _-][A-Za-z가-힣0-9]+)*$/)
  .refine((value) => !/^\d+$/.test(value), {
    message: "Name cannot be numbers only.",
  });

const passwordSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S+$/);

export { nameSchema, passwordSchema };

export const registerSchema = z.object({
  name: nameSchema,
  email: z.string().email(),
  password: passwordSchema,
  termsAccepted: z.boolean(),
  privacyAccepted: z.boolean(),
});

export const orgCreateSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(200).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export const orgUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(200).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export const joinOrgSchema = z.object({
  inviteCode: z.string().min(4).max(12),
});

export const eventSchema = z.object({
  title: z.string().min(2).max(120),
  eventDate: z.string().min(8),
  attendanceStartAt: z.string().datetime(),
  attendanceEndAt: z.string().datetime(),
  radiusMeters: z.number().int().min(1),
  locationName: z.string().max(120).optional().nullable(),
  locationAddress: z.string().max(200).optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const recurrenceSchema = z.object({
  weeks: z.number().int().min(1).max(12),
  weekdays: z.array(z.number().int().min(1).max(7)).min(1),
});

export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
