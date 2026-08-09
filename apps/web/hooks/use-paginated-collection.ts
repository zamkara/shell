"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  COLLECTION_CONFIGS,
  COLLECTION_DEFAULTS,
  type CollectionKey,
} from "../lib/data"

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface PaginatedCollection<T> extends PaginatedResponse<T> {
  search: string
  loading: boolean
  error: string | null
  setSearch: React.Dispatch<React.SetStateAction<string>>
  setPage: React.Dispatch<React.SetStateAction<number>>
  setLimit: React.Dispatch<React.SetStateAction<number>>
  refresh: () => Promise<void>
}

const requests = new Map<string, Promise<PaginatedResponse<unknown>>>()

export function usePaginatedCollection<T>(
  collectionKey: CollectionKey
): PaginatedCollection<T> {
  const router = useRouter()
  const activeRequest = React.useRef(0)
  const endpoint = COLLECTION_CONFIGS[collectionKey].endpoint
  const [items, setItems] = React.useState<T[]>([])
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState<number>(COLLECTION_DEFAULTS.page)
  const [limit, setLimit] = React.useState<number>(COLLECTION_DEFAULTS.limit)
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(
    async (force = false) => {
      const requestId = activeRequest.current + 1
      activeRequest.current = requestId
      setLoading(true)
      const url = `${endpoint}?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`
      if (force) {
        for (const key of requests.keys()) {
          if (key.startsWith(`${endpoint}?`)) requests.delete(key)
        }
      }
      let request = requests.get(url) as
        Promise<PaginatedResponse<T>> | undefined
      if (!request) {
        request = fetch(url, { cache: "no-store", credentials: "include" })
          .then(async (response) => {
            if (response.status === 401) {
              router.push("/auth")
              return { items: [], total: 0, page, limit }
            }
            if (!response.ok) throw new Error(`Failed to load ${endpoint}`)
            const data = (await response.json()) as
              Partial<PaginatedResponse<T>> | T[]
            if (Array.isArray(data)) {
              return { items: data, total: data.length, page, limit }
            }
            return {
              items: Array.isArray(data.items) ? data.items : [],
              total: data.total ?? 0,
              page: data.page ?? page,
              limit: data.limit ?? limit,
            }
          })
          .catch((error) => {
            requests.delete(url)
            throw error
          })
        requests.set(url, request as Promise<PaginatedResponse<unknown>>)
      }
      try {
        const data = await request
        if (activeRequest.current !== requestId) return
        setItems(data.items)
        setTotal(data.total)
        setError(null)
      } catch (reason) {
        if (activeRequest.current !== requestId) return
        setError(
          reason instanceof Error ? reason.message : "Failed to load collection"
        )
      } finally {
        if (activeRequest.current === requestId) setLoading(false)
      }
    },
    [endpoint, limit, page, router, search]
  )

  React.useEffect(() => {
    const timer = window.setTimeout(
      () => void load(),
      COLLECTION_DEFAULTS.debounceMs
    )
    return () => {
      window.clearTimeout(timer)
      activeRequest.current += 1
    }
  }, [load])

  const refresh = React.useCallback(() => load(true), [load])

  return {
    items,
    search,
    setSearch,
    page,
    setPage,
    limit,
    setLimit,
    total,
    loading,
    error,
    refresh,
  }
}
