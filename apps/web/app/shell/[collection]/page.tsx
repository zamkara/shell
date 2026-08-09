import { notFound } from "next/navigation"
import { ContentList } from "@/components/content/content-list"
import { COLLECTION_CONFIGS, CONTENT_COLLECTION_KEYS, type ContentCollectionKey } from "@/lib/data"
import { getProfile } from "@/lib/profile"

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>
}) {
  const { collection } = await params
  if (!CONTENT_COLLECTION_KEYS.includes(collection as ContentCollectionKey)) {
    notFound()
  }
  const profile = await getProfile()
  if (!profile.permissions.includes(COLLECTION_CONFIGS[collection as ContentCollectionKey].permission)) {
    notFound()
  }
  if (["users", "roles", "permissions"].includes(collection) && !profile.roles.includes("admin")) {
    notFound()
  }
  return <ContentList kind={collection as ContentCollectionKey} />
}
