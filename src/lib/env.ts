import { z } from 'zod'

/**
 * Strip surrounding whitespace (including embedded \r/\n that Vercel sometimes
 * stores when env values are added via copy-paste or piped from `echo`).
 *
 * The validator below should never throw at runtime — corrupted env values
 * crash the entire serverless function on first import, including for users
 * who only need a layout to render. Trim aggressively, fall back to defaults,
 * and log instead of throwing.
 */
function trimEnv() {
	const out: Record<string, string | undefined> = {}
	for (const [key, value] of Object.entries(process.env)) {
		if (typeof value === 'string') {
			out[key] = value.replace(/[\r\n]+/g, '').trim()
		} else {
			out[key] = value
		}
	}
	return out
}

const envSchema = z.object({
	// Convex — injected by `npx convex deploy --cmd-url-env-var-name` at build
	// time, not present in the runtime serverless function env.
	NEXT_PUBLIC_CONVEX_URL: z.string().optional(),
	CONVEX_DEPLOYMENT: z.string().optional(),

	// Clerk Auth
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
	CLERK_SECRET_KEY: z.string().optional(),
	NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/?auth=sign-in'),
	NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/?auth=sign-up'),
	NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().optional(),
	NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().optional(),
	NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: z.string().optional(),
	NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: z.string().optional(),
	NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
	NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/new-user'),

	// App
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
	NEXT_PUBLIC_SITE_URL: z.string().default('http://localhost:3000'),
	GOOGLE_SITE_VERIFICATION: z.string().optional(),

	// Sanity
	NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().optional(),
	NEXT_PUBLIC_SANITY_DATASET: z.string().optional(),
	NEXT_PUBLIC_SANITY_API_VERSION: z.string().default('2025-06-01'),
	SANITY_API_TOKEN: z.string().optional(),

	// Admin
	ADMIN_EMAILS: z.string().optional(),
})

const envParse = envSchema.safeParse(trimEnv())

if (!envParse.success) {
	console.warn(
		'env.ts: zod parse returned issues; falling back to schema defaults.',
		envParse.error.flatten().fieldErrors,
	)
}

export const env: z.infer<typeof envSchema> = envParse.success
	? envParse.data
	: envSchema.parse({})

export type Env = z.infer<typeof envSchema>
