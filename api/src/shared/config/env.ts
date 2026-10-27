import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3002')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  /** Lifetime of a signed-in staff session (and of its cookie when "remember me" is set). */
  SESSION_TTL_HOURS: z.coerce.number().positive().max(24 * 30).default(12),
  /** Admin app base URL, used to build password-reset links. */
  ADMIN_URL: z.url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

/** Parses environment variables, throwing a readable error listing every invalid key. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return result.data;
}
