import { useEffect, useState, useRef, useCallback } from 'react'

/** Debounce a value by the given delay in ms. */
export function useDebouncedValue<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState<T>(value)

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay)
		return () => clearTimeout(timer)
	}, [value, delay])

	return debounced
}

/** Track how long a user has been on a page (returns seconds). */
export function useTimeOnPage(): number {
	const [seconds, setSeconds] = useState(0)
	const startRef = useRef(Date.now())

	useEffect(() => {
		const interval = setInterval(() => {
			setSeconds(Math.floor((Date.now() - startRef.current) / 1000))
		}, 1000)
		return () => clearInterval(interval)
	}, [])

	return seconds
}

/** No-op analytics stub — wire to your analytics provider if needed. */
export function useSearchAnalytics() {
	return {
		trackSearch: useCallback((_query: string, _count: number) => {}, []),
		trackFilterApplied: useCallback((_key: string, _value: string, _count: number) => {}, []),
		trackFilterCleared: useCallback((_key: string, _count: number) => {}, []),
		trackAllFiltersCleared: useCallback((_count: number) => {}, []),
	}
}
