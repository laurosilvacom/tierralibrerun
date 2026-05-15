/**
 * Regression guard for Vercel function startup.
 *
 * `NEXT_PUBLIC_CONVEX_URL` is injected during the Convex-powered build command,
 * but it is not configured as a Vercel production runtime environment variable.
 * Server modules must therefore be importable without it, and the root layout
 * must not import the strict env parser.
 */
import { readFile } from 'node:fs/promises'

process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??= 'pk_test_regression'
process.env.CLERK_SECRET_KEY ??= 'sk_test_regression'
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'regression'
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'production'
delete process.env.NEXT_PUBLIC_CONVEX_URL

async function main() {
	await import('../src/lib/env')
	await import('../src/components/convex-provider')

	const layoutSource = await readFile('src/app/layout.tsx', 'utf8')
	if (layoutSource.includes("@/lib/env") || layoutSource.includes('src/lib/env')) {
		throw new Error('Root layout must not import the strict env parser')
	}

	console.log('Server env modules import without build-only public env vars.')
}

void main()
