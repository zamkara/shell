import { ProjectsView } from "@/components/projects/projects-view"
import { getProfile } from "@/lib/profile"
import { notFound } from "next/navigation"

export default async function ShellPage() {
  const profile = await getProfile()
  if (!profile.permissions.includes("projects.read")) notFound()
  return <ProjectsView />
}
