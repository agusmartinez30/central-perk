import { z } from 'zod';

/** Request bodies. Password strength is a domain rule, so it is not duplicated here. */

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(512),
  remember: z.boolean().default(false),
});

export const verifyMfaSchema = z.object({
  // Accepts pasted codes like "123 456", as the admin CodeInput does.
  code: z
    .string()
    .transform((value) => value.replace(/\s+/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'Expected a 6-digit code')),
});

export const forgotPasswordSchema = z.object({
  email: z.email().max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(512),
  password: z.string().max(512),
});

export type LoginBody = z.output<typeof loginSchema>;
export type VerifyMfaBody = z.output<typeof verifyMfaSchema>;
export type ForgotPasswordBody = z.output<typeof forgotPasswordSchema>;
export type ResetPasswordBody = z.output<typeof resetPasswordSchema>;
