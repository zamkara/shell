export const PROJECT_STATUSES = ["draft", "archived", "published"] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus)
}

export interface ProjectSummary {
  id: string
  title: string
  tagline?: string
}

export interface Project {
  id?: string
  slug: string
  title: string
  status: ProjectStatus
  tagline: string
  challenge: string
  solution: string
  image_url: string
  image_thumbnail_url: string
  hero_url: string
  hero_thumbnail_url: string
  ratio: string
  live_url: string
  tags: string[]
  media: string[]
  media_thumbnail_urls: string[]
  meta: Record<string, string>
  stats: Record<string, string>
  created_at?: string
}

interface LegacyProjectStat {
  label?: unknown
  value?: unknown
  suffix?: unknown
}

export function normalizeProject(value: Partial<Project>): Project {
  const imageURL = value.image_url ?? ""
  const heroURL = value.hero_url ?? ""
  const media = Array.isArray(value.media) ? value.media : []
  const mediaThumbnailURLs = Array.isArray(value.media_thumbnail_urls)
    ? value.media_thumbnail_urls
    : []
  const stats = Array.isArray(value.stats)
    ? Object.fromEntries(
        value.stats
          .map((item: LegacyProjectStat) => [
            String(item?.label ?? ""),
            `${item?.value ?? ""}${item?.suffix ?? ""}`,
          ])
          .filter(([key]) => key)
      )
    : value.stats && typeof value.stats === "object"
      ? value.stats
      : {}
  return {
    ...emptyProject,
    ...value,
    tagline: value.tagline ?? "",
    challenge: value.challenge ?? "",
    solution: value.solution ?? "",
    image_url: imageURL,
    image_thumbnail_url: value.image_thumbnail_url || imageURL,
    hero_url: heroURL,
    hero_thumbnail_url: value.hero_thumbnail_url || heroURL,
    ratio: value.ratio ?? "",
    live_url: value.live_url ?? "",
    tags: Array.isArray(value.tags) ? value.tags : [],
    media,
    media_thumbnail_urls: media.map(
      (url, index) => mediaThumbnailURLs[index] || url
    ),
    meta: value.meta && !Array.isArray(value.meta) ? value.meta : {},
    stats,
  }
}

export const emptyProject: Project = {
  slug: "",
  title: "",
  status: "draft",
  tagline: "",
  challenge: "",
  solution: "",
  image_url: "",
  image_thumbnail_url: "",
  hero_url: "",
  hero_thumbnail_url: "",
  ratio: "",
  live_url: "",
  tags: [],
  media: [],
  media_thumbnail_urls: [],
  meta: {},
  stats: {},
}
