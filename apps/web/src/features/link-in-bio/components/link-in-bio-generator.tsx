"use client"

import type React from "react"

import { useRef, useState, type ComponentType } from "react"
import {
  ChevronDown,
  CircleCheck,
  Eye,
  EyeOff,
  Grid3X3,
  GripVertical,
  Link as LinkIcon,
  Music,
  Music2,
  Palette,
  Plus,
  Settings,
  Shield,
  Trash2,
  Users,
} from "lucide-react"
import {
  SiFacebook,
  SiInstagram,
  SiLinkerd,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons"

import { BioWidgetEmbed } from "@/components/bio-widget-embed"
import ImagePicker, { getYouTubeEmbedUrl, type BackgroundMedia } from "@/components/image-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createBioPage,
  updateBioPage,
  type BioPageDto,
  type CreateBioPagePayload,
} from "@/lib/api-client"
import {
  bioButtonStyles,
  getBioAccentColor,
  getBioLinkClass,
  getBioLinkIconClass,
  getBioLinkIconStyle,
  getBioLinkStyle,
  normalizeBioButtonStyle,
} from "./bio-appearance"

interface SocialLink {
  id: string
  platform: string
  url: string
}

interface CustomLink {
  id: string
  title: string
  url: string
}

interface ProfileDetails {
  name: string
  title: string
}

interface AppearanceSettings {
  buttonStyle: string
  backgroundColor: string
  backgroundImage?: string
  backgroundMediaType?: "image" | "video" | "youtube"
  backgroundMediaUrl?: string
  selectedBackgroundId?: string
}

interface Widget {
  id: string
  type: string
  title: string
  url: string
  description?: string
}

type EditorSectionKey = "details" | "links" | "socials" | "appearance" | "widgets" | "admin"

function EditorSection({
  title,
  icon: Icon,
  open,
  onOpenChange,
  count,
  children,
}: {
  title: string
  icon: ComponentType<{ className?: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
  count?: number
  children: React.ReactNode
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="overflow-hidden rounded-xl border border-border bg-card">
      <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none sm:px-5">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/35 text-muted-foreground">
            <Icon className="size-[18px]" />
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{title}</span>
            {typeof count === "number" ? <Badge variant="secondary" className="h-5 px-1.5 text-[10px] tabular-nums">{count}</Badge> : null}
          </span>
        </span>
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 border-t border-border px-4 py-4 sm:px-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-2 block text-xs font-medium text-foreground">
      {children}{required ? <span className="ml-1 text-destructive">*</span> : null}
    </label>
  )
}

export default function LinkInBioGenerator({
  initialBio,
  onSaved,
  onSavingChange,
}: {
  initialBio?: BioPageDto | null
  onSaved?: (bioPage: BioPageDto) => void
  onSavingChange?: (saving: boolean) => void
}) {
  const nextIdRef = useRef(10)
  const [expandedSections, setExpandedSections] = useState<Record<EditorSectionKey, boolean>>({
    details: true,
    links: false,
    socials: false,
    appearance: false,
    widgets: false,
    admin: false,
  })
  const [profileDetails, setProfileDetails] = useState<ProfileDetails>({
    name: initialBio?.name || "",
    title: initialBio?.title || "",
  })
  const [customSlug, setCustomSlug] = useState(initialBio?.slug || "")
  const [status, setStatus] = useState<"published" | "draft">(
    initialBio?.status === "draft" ? "draft" : "published",
  )
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialBio?.socialLinks || [])
  const [customLinks, setCustomLinks] = useState<CustomLink[]>(initialBio?.customLinks || [])
  const [widgets, setWidgets] = useState<Widget[]>(initialBio?.widgets || [])
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    buttonStyle: normalizeBioButtonStyle(initialBio?.appearance.buttonStyle || "rounded"),
    backgroundColor: initialBio?.appearance.backgroundColor || "#ffffff",
    backgroundImage: initialBio?.appearance.backgroundImage || undefined,
    backgroundMediaType: initialBio?.appearance.backgroundMediaType || undefined,
    backgroundMediaUrl: initialBio?.appearance.backgroundMediaUrl || undefined,
    selectedBackgroundId: initialBio?.appearance.selectedBackgroundId || undefined,
  })
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [showWidgetSelector, setShowWidgetSelector] = useState(false)
  const [hiddenLinks, setHiddenLinks] = useState<string[]>(initialBio?.hiddenLinks || [])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [savedBio, setSavedBio] = useState<BioPageDto | null>(null)

  const setSectionOpen = (section: EditorSectionKey, open: boolean) => {
    setExpandedSections((current) => ({ ...current, [section]: open }))
  }

  const updateProfileDetails = (field: keyof ProfileDetails, value: string) => {
    setProfileDetails((current) => ({ ...current, [field]: value }))
  }

  const addSocialLink = () => {
    setSocialLinks((current) => [...current, { id: `social-${nextIdRef.current++}`, platform: "Instagram", url: "" }])
  }

  const removeSocialLink = (id: string) => setSocialLinks((current) => current.filter((link) => link.id !== id))

  const updateSocialLink = (id: string, field: "platform" | "url", value: string) => {
    setSocialLinks((current) => current.map((link) => link.id === id ? { ...link, [field]: value } : link))
  }

  const addCustomLink = () => {
    setCustomLinks((current) => [...current, { id: `link-${nextIdRef.current++}`, title: "", url: "" }])
  }

  const removeCustomLink = (id: string) => setCustomLinks((current) => current.filter((link) => link.id !== id))

  const updateCustomLink = (id: string, field: "title" | "url", value: string) => {
    setCustomLinks((current) => current.map((link) => link.id === id ? { ...link, [field]: value } : link))
  }

  const addWidget = (type: string) => {
    setWidgets((current) => [...current, { id: `widget-${nextIdRef.current++}`, type, title: "", url: "", description: "" }])
    setShowWidgetSelector(false)
  }

  const removeWidget = (id: string) => setWidgets((current) => current.filter((widget) => widget.id !== id))

  const updateWidget = (id: string, field: keyof Widget, value: string) => {
    setWidgets((current) => current.map((widget) => widget.id === id ? { ...widget, [field]: value } : widget))
  }

  const updateAppearanceSettings = (field: keyof AppearanceSettings, value: string | undefined) => {
    setAppearanceSettings((current) => ({ ...current, [field]: value }))
  }

  const toggleLinkVisibility = (id: string) => {
    setHiddenLinks((current) => current.includes(id) ? current.filter((linkId) => linkId !== id) : [...current, id])
  }

  const isValidUrl = (value: string) => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  const buildBioPayload = (statusOverride: "published" | "draft" = status): CreateBioPagePayload => ({
    name: profileDetails.name.trim(),
    title: profileDetails.title || undefined,
    customSlug: customSlug || undefined,
    status: statusOverride,
    socialLinks: socialLinks.filter((link) => link.platform && isValidUrl(link.url)),
    customLinks: customLinks.filter((link) => link.title.trim() && isValidUrl(link.url)),
    widgets: widgets.filter((widget) => isValidUrl(widget.url)).map((widget) => ({ ...widget, title: widget.title.trim() })),
    hiddenLinks,
    appearance: appearanceSettings,
  })

  const handleSaveBio = async (saveMode: "draft" | "published" | "current" = "current") => {
    if (isSaving) return

    const nextStatus = saveMode === "current" ? status : saveMode
    const payload = buildBioPayload(nextStatus)
    if (!payload.name) {
      setSaveError("Tên trang là bắt buộc.")
      return
    }
    if (payload.socialLinks.length === 0 && payload.customLinks.length === 0 && payload.widgets.length === 0) {
      setSaveError("Thêm ít nhất một liên kết, mạng xã hội hoặc widget trước khi lưu.")
      return
    }

    setIsSaving(true)
    onSavingChange?.(true)
    setSaveError("")
    try {
      const bioPage = initialBio
        ? await updateBioPage(initialBio.id, payload)
        : await createBioPage(payload)
      setSavedBio(bioPage)
      onSaved?.(bioPage)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Không lưu được trang Link-in-bio.")
    } finally {
      setIsSaving(false)
      onSavingChange?.(false)
    }
  }

  const handleDragStart = (event: React.DragEvent, id: string) => {
    setDraggedItem(id)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", id)
  }

  const handleDragOver = (event: React.DragEvent, id: string) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    if (draggedItem && draggedItem !== id) setDragOverItem(id)
  }

  const handleDrop = (event: React.DragEvent, dropId: string) => {
    event.preventDefault()
    const draggedId = event.dataTransfer.getData("text/plain") || draggedItem
    if (!draggedId || draggedId === dropId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const draggedIndex = customLinks.findIndex((link) => link.id === draggedId)
    const dropIndex = customLinks.findIndex((link) => link.id === dropId)
    if (draggedIndex === -1 || dropIndex === -1) return

    const nextLinks = [...customLinks]
    const [draggedLink] = nextLinks.splice(draggedIndex, 1)
    nextLinks.splice(dropIndex, 0, draggedLink)
    setCustomLinks(nextLinks)
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const socialPlatforms = [
    "Instagram", "Twitter", "Facebook", "TikTok", "YouTube", "LinkedIn", "PayPal", "Venmo",
    "CashApp", "Spotify", "Apple Music", "Reddit", "Discord", "Twitch",
  ]
  const widgetTypes = [
    { type: "audio-preview", label: "Audio preview", icon: Music2 },
    { type: "youtube-video", label: "YouTube video", icon: SiYoutube },
    { type: "spotify-track", label: "Spotify track/playlist", icon: Music },
    { type: "instagram-post", label: "Instagram post", icon: SiInstagram },
    { type: "tiktok-video", label: "TikTok video", icon: SiTiktok },
    { type: "twitch-stream", label: "Twitch channel stream", icon: SiTwitch },
  ]

  const getSocialIcon = (platform: string) => {
    const className = "size-5"
    switch (platform.toLowerCase()) {
      case "youtube": return <SiYoutube className={className} />
      case "instagram": return <SiInstagram className={className} />
      case "facebook": return <SiFacebook className={className} />
      case "twitter": return <SiX className={className} />
      case "linkedin": return <SiLinkerd className={className} />
      case "tiktok": return <SiTiktok className={className} />
      case "twitch": return <SiTwitch className={className} />
      case "spotify":
      case "apple music": return <Music className={className} />
      default: return <Users className={className} />
    }
  }

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case "audio-preview": return <Music2 className="size-4" />
      case "youtube-video": return <SiYoutube className="size-4" />
      case "spotify-track": return <Music className="size-4" />
      case "instagram-post": return <SiInstagram className="size-4" />
      case "tiktok-video": return <SiTiktok className="size-4" />
      case "twitch-stream": return <SiTwitch className="size-4" />
      default: return <Grid3X3 className="size-4" />
    }
  }

  const selectedBackgroundMedia: BackgroundMedia | null = appearanceSettings.backgroundMediaType && appearanceSettings.backgroundMediaUrl
    ? { id: appearanceSettings.selectedBackgroundId || appearanceSettings.backgroundMediaType, type: appearanceSettings.backgroundMediaType, url: appearanceSettings.backgroundMediaUrl }
    : appearanceSettings.backgroundImage
      ? { id: "legacy-image", type: "image", url: appearanceSettings.backgroundImage }
      : null

  const selectBackgroundMedia = (media: BackgroundMedia | null) => {
    setAppearanceSettings((current) => ({
      ...current,
      backgroundImage: media?.type === "image" ? media.url : undefined,
      backgroundMediaType: media?.type,
      backgroundMediaUrl: media?.url,
      selectedBackgroundId: media?.id,
    }))
  }

  const backgroundStyle: React.CSSProperties = selectedBackgroundMedia?.type === "image"
    ? { backgroundImage: `url('${selectedBackgroundMedia.url}')`, backgroundPosition: "center", backgroundSize: "cover" }
    : { backgroundColor: appearanceSettings.backgroundColor || "#f4f7fb" }
  const accentColor = getBioAccentColor(appearanceSettings.backgroundColor)
  const selectedButtonStyle = normalizeBioButtonStyle(appearanceSettings.buttonStyle)
  const validColorValue = /^#[0-9a-f]{6}$/i.test(appearanceSettings.backgroundColor)
    ? appearanceSettings.backgroundColor
    : "#ffffff"

  return (
    <form id="link-in-bio-editor-form" className="space-y-5" onSubmit={(event) => {
      event.preventDefault()
      const submitter = event.nativeEvent.submitter as HTMLButtonElement | null
      const saveMode = submitter?.value === "draft" || submitter?.value === "published" ? submitter.value : "current"
      void handleSaveBio(saveMode)
    }}>
      {saveError ? <div role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">{saveError}</div> : null}
      {savedBio ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-medium text-foreground"><CircleCheck className="size-4 text-primary" />Đã lưu trang Link-in-bio.</span>
          <a href={`/b/${savedBio.slug}`} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">Mở /b/{savedBio.slug}</a>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-start">
        <div className="min-w-0 space-y-3">
          <EditorSection title="Thông tin trang" icon={Settings} open={expandedSections.details} onOpenChange={(open) => setSectionOpen("details", open)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>Tên trang</FieldLabel>
                <Input value={profileDetails.name} onChange={(event) => updateProfileDetails("name", event.target.value)} placeholder="Tên của bạn hoặc thương hiệu" className="h-10 rounded-lg bg-background shadow-none" />
              </div>
              <div>
                <FieldLabel>Mô tả ngắn</FieldLabel>
                <Input value={profileDetails.title} onChange={(event) => updateProfileDetails("title", event.target.value)} placeholder="Creator, designer, streamer..." className="h-10 rounded-lg bg-background shadow-none" />
              </div>
            </div>
            <div>
              <FieldLabel>Slug công khai</FieldLabel>
              <div className="flex h-10 overflow-hidden rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
                <span className="inline-flex items-center border-r border-border bg-muted/35 px-3 text-xs font-medium text-muted-foreground">/b/</span>
                <input value={customSlug} onChange={(event) => setCustomSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-+/, ""))} placeholder="ten-cua-ban" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
              </div>
            </div>
          </EditorSection>

          <EditorSection title="Liên kết" icon={LinkIcon} count={customLinks.length} open={expandedSections.links} onOpenChange={(open) => setSectionOpen("links", open)}>
            {customLinks.length === 0 ? <p className="rounded-lg border border-dashed border-border bg-muted/15 px-4 py-5 text-center text-sm text-muted-foreground">Chưa có liên kết tùy chỉnh.</p> : null}
            <div className="space-y-3">
              {customLinks.map((link) => {
                const hidden = hiddenLinks.includes(link.id)
                return (
                  <div key={link.id} draggable onDragStart={(event) => handleDragStart(event, link.id)} onDragEnd={() => { setDraggedItem(null); setDragOverItem(null) }} onDragOver={(event) => handleDragOver(event, link.id)} onDrop={(event) => handleDrop(event, link.id)} className={`rounded-lg border p-3 transition-colors duration-150 motion-reduce:transition-none ${draggedItem === link.id ? "opacity-55" : dragOverItem === link.id ? "border-primary/50 bg-primary/5" : "border-border bg-muted/10 hover:border-foreground/20"}`}>
                    <div className="flex items-start gap-2">
                      <button type="button" className="mt-1 grid size-8 shrink-0 cursor-grab place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing" aria-label="Kéo để sắp xếp"><GripVertical className="size-4" /></button>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div><FieldLabel>Tiêu đề</FieldLabel><Input value={link.title} onChange={(event) => updateCustomLink(link.id, "title", event.target.value)} placeholder="Portfolio" className="h-10 bg-background shadow-none" /></div>
                          <div><FieldLabel>URL</FieldLabel><Input value={link.url} onChange={(event) => updateCustomLink(link.id, "url", event.target.value)} placeholder="https://example.com" className="h-10 bg-background shadow-none" /></div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => toggleLinkVisibility(link.id)} className="text-muted-foreground" aria-label={hidden ? "Hiện liên kết" : "Ẩn liên kết"}>{hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeCustomLink(link.id)} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Xóa liên kết"><Trash2 className="size-4" /></Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <Button type="button" variant="outline" onClick={addCustomLink} className="h-10 w-full border-dashed shadow-none"><Plus className="size-4" />Thêm liên kết</Button>
          </EditorSection>

          <EditorSection title="Mạng xã hội" icon={Users} count={socialLinks.length} open={expandedSections.socials} onOpenChange={(open) => setSectionOpen("socials", open)}>
            {socialLinks.length === 0 ? <p className="rounded-lg border border-dashed border-border bg-muted/15 px-4 py-5 text-center text-sm text-muted-foreground">Chưa có mạng xã hội.</p> : null}
            <div className="space-y-3">
              {socialLinks.map((link) => (
                <div key={link.id} className="grid gap-2 rounded-lg border border-border bg-muted/10 p-3 sm:grid-cols-[160px_minmax(0,1fr)_36px] sm:items-end">
                  <div><FieldLabel>Nền tảng</FieldLabel><Select value={link.platform} onValueChange={(value) => updateSocialLink(link.id, "platform", value)}><SelectTrigger className="h-10 bg-background shadow-none"><SelectValue /></SelectTrigger><SelectContent>{socialPlatforms.map((platform) => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectContent></Select></div>
                  <div><FieldLabel>URL hồ sơ</FieldLabel><Input value={link.url} onChange={(event) => updateSocialLink(link.id, "url", event.target.value)} placeholder="https://..." className="h-10 bg-background shadow-none" /></div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(link.id)} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Xóa ${link.platform}`}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addSocialLink} className="h-10 w-full border-dashed shadow-none"><Plus className="size-4" />Thêm mạng xã hội</Button>
          </EditorSection>

          <EditorSection title="Giao diện" icon={Palette} open={expandedSections.appearance} onOpenChange={(open) => setSectionOpen("appearance", open)}>
            <div>
              <FieldLabel>Kiểu nút</FieldLabel>
              <Select value={selectedButtonStyle} onValueChange={(value) => updateAppearanceSettings("buttonStyle", value)}>
                <SelectTrigger className="h-10 w-full bg-background shadow-none" aria-label="Chọn kiểu nút">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bioButtonStyles.map((style) => <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-border pt-4">
              <FieldLabel>Màu chủ đạo</FieldLabel>
              <div className="flex flex-wrap items-center gap-2">
                <Input type="color" value={validColorValue} onChange={(event) => updateAppearanceSettings("backgroundColor", event.target.value)} className="h-10 w-12 cursor-pointer rounded-lg bg-background p-1" aria-label="Chọn màu chủ đạo" />
                <Input value={appearanceSettings.backgroundColor} onChange={(event) => updateAppearanceSettings("backgroundColor", event.target.value)} className="h-10 min-w-32 flex-1 bg-background font-mono text-xs uppercase shadow-none" aria-label="Mã màu chủ đạo" />
                <div className="flex gap-1.5">
                  {["#2563eb", "#7c3aed", "#db2777", "#059669", "#ea580c"].map((color) => <button key={color} type="button" onClick={() => updateAppearanceSettings("backgroundColor", color)} className="size-8 rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ backgroundColor: color }} aria-label={`Dùng màu ${color}`} />)}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Màu này điều khiển background mặc định và accent của các kiểu viền, glow, gradient hoặc neon.</p>
            </div>

            <div className="border-t border-border pt-4">
              <FieldLabel>Background media</FieldLabel>
              <ImagePicker selectedMedia={selectedBackgroundMedia} onMediaSelect={selectBackgroundMedia} />
            </div>
          </EditorSection>

          <EditorSection title="Widget" icon={Grid3X3} count={widgets.length} open={expandedSections.widgets} onOpenChange={(open) => setSectionOpen("widgets", open)}>
            <Button type="button" variant="outline" onClick={() => setShowWidgetSelector((current) => !current)} className="h-10 w-full border-dashed shadow-none"><Plus className="size-4" />Thêm widget</Button>
            {showWidgetSelector ? (
              <div className="grid gap-2 rounded-lg border border-border bg-muted/15 p-2 sm:grid-cols-2">
                {widgetTypes.map(({ type, label, icon: Icon }) => <button key={type} type="button" onClick={() => addWidget(type)} className="flex min-h-10 items-center gap-2 rounded-md px-3 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon className="size-4 text-muted-foreground" />{label}</button>)}
              </div>
            ) : null}
            <div className="space-y-3">
              {widgets.map((widget) => (
                <div key={widget.id} className="rounded-lg border border-border bg-muted/10 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-semibold text-foreground">{getWidgetIcon(widget.type)}{widget.type.replaceAll("-", " ")}</span><Button type="button" variant="ghost" size="icon-sm" onClick={() => removeWidget(widget.id)} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Xóa widget"><Trash2 className="size-4" /></Button></div>
                  <div className="grid gap-3 sm:grid-cols-2"><div><FieldLabel>Tiêu đề</FieldLabel><Input value={widget.title} onChange={(event) => updateWidget(widget.id, "title", event.target.value)} placeholder="Không bắt buộc" className="h-10 bg-background shadow-none" /></div><div><FieldLabel>URL</FieldLabel><Input value={widget.url} onChange={(event) => updateWidget(widget.id, "url", event.target.value)} placeholder="https://..." className="h-10 bg-background shadow-none" /></div></div>
                </div>
              ))}
            </div>
          </EditorSection>

          <EditorSection title="Xuất bản" icon={Shield} open={expandedSections.admin} onOpenChange={(open) => setSectionOpen("admin", open)}>
            <div><FieldLabel>Trạng thái</FieldLabel><Select value={status} onValueChange={(value) => setStatus(value as "published" | "draft")}><SelectTrigger className="h-10 w-full bg-background shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">Đã xuất bản</SelectItem><SelectItem value="draft">Bản nháp</SelectItem></SelectContent></Select></div>
            <p className="text-xs leading-5 text-muted-foreground">Trang đã xuất bản có thể mở công khai tại /b/{customSlug || "ten-cua-ban"}.</p>
          </EditorSection>

        </div>

        <aside className="min-w-0 xl:sticky xl:top-0">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-3">
                              <h3 className="text-sm font-semibold text-foreground">Xem trước trực tiếp</h3>

            </div>

            <div className="bg-muted/20 p-3 sm:p-4">
              <div className="relative min-h-[600px] overflow-hidden rounded-xl border border-border bg-[#f4f7fb]" style={backgroundStyle}>
                {selectedBackgroundMedia?.type === "video" ? <video src={selectedBackgroundMedia.url} autoPlay muted loop playsInline className="pointer-events-none absolute inset-0 size-full object-cover" /> : null}
                {selectedBackgroundMedia?.type === "youtube" && getYouTubeEmbedUrl(selectedBackgroundMedia.url) ? <iframe src={getYouTubeEmbedUrl(selectedBackgroundMedia.url)} title="Xem trước background YouTube" allow="autoplay; encrypted-media; picture-in-picture" className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[266%] -translate-x-1/2 -translate-y-1/2" /> : null}
                <div className="relative z-10 p-3 sm:p-5">
                  <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white/78 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                    <div className="space-y-4 px-4 py-6 sm:px-5">
                      <header className="text-center">
                        <div className="mx-auto grid size-20 place-items-center rounded-2xl border-4 border-white bg-slate-950 text-2xl font-semibold text-white shadow-lg">{profileDetails.name.trim().slice(0, 1).toUpperCase() || "R"}</div>
                        <h4 className="mt-3 truncate text-xl font-semibold tracking-tight text-slate-950">{profileDetails.name || "Tên của bạn"}</h4>
                        <p className="mt-1 truncate text-xs font-medium text-slate-500">rekonise.com/b/{customSlug || "ten-cua-ban"}</p>
                        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">{profileDetails.title || "Thêm một mô tả ngắn để mọi người biết bạn là ai và nội dung bạn chia sẻ."}</p>
                      </header>

                      {socialLinks.length > 0 ? <div className="flex flex-wrap justify-center gap-2">{socialLinks.slice(0, 8).map((social) => <button key={social.id} type="button" title={social.platform} className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm">{getSocialIcon(social.platform)}</button>)}</div> : null}
                      {widgets.length > 0 ? <div className="space-y-3">{widgets.map((widget) => <div key={widget.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><BioWidgetEmbed widget={widget} /></div>)}</div> : null}
                      <div className="space-y-3">
                        {customLinks.filter((link) => !hiddenLinks.includes(link.id)).map((link) => <button key={link.id} type="button" className={getBioLinkClass(selectedButtonStyle)} style={getBioLinkStyle(selectedButtonStyle, accentColor)}><span className="min-w-0 truncate">{link.title || "Liên kết chưa đặt tên"}</span><span className={`grid size-8 shrink-0 place-items-center rounded-full ${getBioLinkIconClass(selectedButtonStyle)}`} style={getBioLinkIconStyle(selectedButtonStyle, accentColor)}><LinkIcon className="size-4" /></span></button>)}
                      </div>
                      {customLinks.length === 0 && socialLinks.length === 0 && widgets.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white/55 px-4 py-8 text-center text-sm text-slate-500">Thêm nội dung để xem trước tại đây.</div> : null}
                      <div className="pt-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Powered by Rekonise</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </form>
  )
}
