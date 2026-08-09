"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SaveIcon } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import type { Profile } from "@/lib/profile"
import { ButtonGroup } from "@workspace/ui/components/button-group"

interface ProfileFormProps {
  initialProfile: Profile
  isOpen: boolean
  canUpdate: boolean
  onOpenChange: (isOpen: boolean) => void
}

interface ProfileUpdate {
  full_name: string
  avatar_url: string
}

function responseError(data: unknown) {
  if (!data || typeof data !== "object") return "Failed to update profile"
  const message = (data as Record<string, unknown>).error
  return typeof message === "string" ? message : "Failed to update profile"
}

export function ProfileForm({
  initialProfile,
  isOpen,
  canUpdate,
  onOpenChange,
}: ProfileFormProps) {
  const router = useRouter()
  const [profile, setProfile] = React.useState(initialProfile)
  const [isSaving, setIsSaving] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  React.useEffect(() => setProfile(initialProfile), [initialProfile])

  const displayName = profile.full_name.trim() || profile.display_name
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  function setField<Key extends keyof ProfileUpdate>(
    key: Key,
    value: ProfileUpdate[Key]
  ) {
    setProfile((current) => ({ ...current, [key]: value }))
    setMessage(null)
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        } satisfies ProfileUpdate),
      })
      const data: unknown = await response.json()
      if (!response.ok) throw new Error(responseError(data))

      setProfile(data as Profile)
      setMessage("Profile updated")
      router.refresh()
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Failed to update profile"
      )
    } finally {
      setIsSaving(false)
    }
  }

  const previewURL =
    profile.avatar_url ||
    (initialProfile.avatar_url ? "" : profile.resolved_avatar_url)

  return (
    <Dialog
      isOpen={isOpen}
      className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl"
      onOpenChange={onOpenChange}
    >
      <DialogHeader>
        <Field orientation="horizontal">
          <Avatar size="lg">
            <AvatarImage src={previewURL} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <FieldContent>
            <DialogTitle>Profile information</DialogTitle>
            <DialogDescription>Manage your profile details.</DialogDescription>
          </FieldContent>
        </Field>
      </DialogHeader>
      <form id="profile-form" onSubmit={saveProfile}>
        <FieldGroup>
          <Field data-invalid={!profile.full_name.trim()}>
            <FieldLabel htmlFor="profile-full-name">Full name</FieldLabel>
            <Input
              id="profile-full-name"
              name="full_name"
              value={profile.full_name}
              maxLength={120}
              onChange={(event) => setField("full_name", event.target.value)}
              aria-invalid={!profile.full_name.trim()}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-avatar-url">
              Custom avatar URL
            </FieldLabel>
            <Input
              id="profile-avatar-url"
              name="avatar_url"
              type="url"
              value={profile.avatar_url}
              maxLength={2048}
              onChange={(event) => setField("avatar_url", event.target.value)}
              placeholder="https://example.com/avatar.webp"
            />
            <FieldDescription>
              Leave this empty to use the Gravatar connected to your email.
            </FieldDescription>
          </Field>
          <Field data-disabled>
            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
            <Input id="profile-email" value={profile.email} disabled />
            <FieldDescription>
              Email is managed by the authentication provider.
            </FieldDescription>
          </Field>
          <Field data-disabled>
            <FieldLabel htmlFor="profile-role">Role</FieldLabel>
            <Input id="profile-role" value={profile.role} disabled />
          </Field>
          <Field data-disabled>
            <FieldLabel htmlFor="profile-created-at">Member since</FieldLabel>
            <Input
              id="profile-created-at"
              value={profile.created_at.slice(0, 10)}
              disabled
            />
          </Field>
          {(isSaving || message) && (
            <FieldDescription aria-live="polite">
              {isSaving ? "Saving profile…" : message}
            </FieldDescription>
          )}
        </FieldGroup>
      </form>
      <DialogFooter>
        <ButtonGroup>
          <DialogClose variant="outline">Cancel</DialogClose>
          {canUpdate && (
            <Button
              type="submit"
              form="profile-form"
              variant="outline"
              isDisabled={isSaving}
            >
              <SaveIcon data-icon="inline-start" />
              {isSaving ? "Saving…" : "Save"}
            </Button>
          )}
        </ButtonGroup>
      </DialogFooter>
    </Dialog>
  )
}
