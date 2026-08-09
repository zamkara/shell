"use client"

import * as React from "react"
import {
  COLLECTION_CONFIGS,
  COLLECTION_DEFAULTS,
  type CollectionKey,
} from "@/lib/data"
import type { MultiSelectOption } from "@/components/multi-select"

export type CollectionOptionRecord = Record<string, unknown> & {
  id?: string | number
}

const optionRequests = new Map<string, Promise<CollectionOptionRecord[]>>()

export function invalidateCollectionOptions(collectionKey: CollectionKey) {
  const endpoint = COLLECTION_CONFIGS[collectionKey].endpoint
  for (const url of optionRequests.keys()) {
    if (url.startsWith(`${endpoint}?`)) optionRequests.delete(url)
  }
}

export function useCollectionOptionRecords(collectionKey?: CollectionKey) {
  const [records, setRecords] = React.useState<CollectionOptionRecord[]>([])
  React.useEffect(() => {
    if (!collectionKey) return
    const endpoint = COLLECTION_CONFIGS[collectionKey].endpoint
    const url = `${endpoint}?search=&page=1&limit=${COLLECTION_DEFAULTS.maxLimit}`
    let request = optionRequests.get(url)
    if (!request) {
      request = fetch(url, { cache: "no-store", credentials: "include" })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to load ${collectionKey} options`)
          }
          const data = (await response.json()) as {
            items?: CollectionOptionRecord[]
          }
          return data.items ?? []
        })
        .catch((error) => {
          optionRequests.delete(url)
          throw error
        })
      optionRequests.set(url, request)
    }
    let active = true
    void request
      .then((items) => {
        if (active) setRecords(items)
      })
      .catch(() => {
        if (active) setRecords([])
      })
    return () => {
      active = false
    }
  }, [collectionKey])
  return records
}

export function useCollectionOptions(
  collectionKey?: CollectionKey,
  labelField = "name"
) {
  const records = useCollectionOptionRecords(collectionKey)
  return React.useMemo<MultiSelectOption[]>(
    () =>
      records.map((item) => ({
        id: String(item.id ?? ""),
        label: String(item[labelField] ?? item.id ?? "Untitled"),
      })),
    [labelField, records]
  )
}
