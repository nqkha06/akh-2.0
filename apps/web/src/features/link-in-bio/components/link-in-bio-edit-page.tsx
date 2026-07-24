"use client"

import { useCallback, useEffect, useState } from "react"

import { getBioPageById, type BioPageDto } from "@/lib/api-client"

import { LinkInBioEditorError, LinkInBioEditorLoading, LinkInBioEditorPage } from "./link-in-bio-editor-page"

export function LinkInBioEditPage({ bioId }: { bioId: string }) {
  const [bio, setBio] = useState<BioPageDto>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      setBio(await getBioPageById(bioId))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải trang Link-in-bio.")
    } finally {
      setLoading(false)
    }
  }, [bioId])

  useEffect(() => { void Promise.resolve().then(load) }, [load])

  if (loading) return <LinkInBioEditorLoading />
  if (error || !bio) return <LinkInBioEditorError message={error || "Không tìm thấy trang Link-in-bio này."} onRetry={() => void load()} />
  return <LinkInBioEditorPage mode="edit" initialBio={bio} />
}
