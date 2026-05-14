type SearchParamSource =
	| URLSearchParams
	| Record<string, string | string[] | null | undefined>

export const RETURN_PARAM = 'next'
export const NEW_USER_PATH = '/new-user'

// Legacy alias used in a few existing call sites
export const ONBOARDING_RETURN_PARAM = RETURN_PARAM

export function normalizeInternalPath(path?: string | null) {
	if (!path) return undefined
	const trimmed = path.trim()
	if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return undefined
	return trimmed
}

function readSearchParam(
	searchParams: SearchParamSource,
	key: string,
): string | undefined {
	if (searchParams instanceof URLSearchParams) {
		return searchParams.get(key) ?? undefined
	}
	const value = searchParams[key]
	if (typeof value === 'string') return value
	if (Array.isArray(value)) return value[0]
	return undefined
}

export function resolveOnboardingReturnTarget(searchParams: SearchParamSource) {
	return normalizeInternalPath(
		readSearchParam(searchParams, RETURN_PARAM) ??
			readSearchParam(searchParams, 'redirect_url'),
	)
}

export function buildNewUserPath(next?: string) {
	const safeNext = normalizeInternalPath(next)
	if (!safeNext) return NEW_USER_PATH
	return `${NEW_USER_PATH}?${RETURN_PARAM}=${encodeURIComponent(safeNext)}`
}

export function buildPostSignUpPath(target?: string) {
	const safeTarget = normalizeInternalPath(target)
	if (!safeTarget) return NEW_USER_PATH
	if (
		safeTarget === NEW_USER_PATH ||
		safeTarget.startsWith(`${NEW_USER_PATH}?`)
	) {
		return safeTarget
	}
	return buildNewUserPath(safeTarget)
}
