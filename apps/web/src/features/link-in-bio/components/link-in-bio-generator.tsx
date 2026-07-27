"use client"

import type React from "react"

import { useState, type ComponentType } from "react"
import {
  ChevronDown,
  CircleCheck,
  Layers3,
  Link as LinkIcon,
  Music,
  Palette,
  Settings,
  Shield,
  Users,
} from "lucide-react"
import { toast } from "sonner"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createBioPage,
  updateBioPage,
  type BioBankDetailsBlockDto,
  type BioPageDto,
  type BioContentOrderItemDto,
  type BioDividerBlockDto,
  type BioGalleryBlockDto,
  type CreateBioPagePayload,
  type LinkAnimationEffect,
} from "@/lib/api-client"
import {
  getSiteHost,
  useSiteBrand,
} from "@/features/site-settings/components/site-brand-provider"
import {
  bioButtonStyles,
  getBioAccentColor,
  getBioLinkClass,
  getBioLinkIconClass,
  getBioLinkIconStyle,
  getBioLinkStyle,
  normalizeBioButtonStyle,
} from "./bio-appearance"
import { ContentSection } from "../content-blocks/content-section"
import { BankDetailsRenderer, DividerRenderer } from "../content-blocks/simple-content-renderers"
import { hasCompleteBankDetails } from "../content-blocks/simple-content-types"
import { getLinkAnimationClassName, getLinkAnimationStyle } from "../content-blocks/link-animation"
import { GalleryRenderer } from "../gallery/gallery-renderer"
import {
  contentOrderKey,
  normalizeContentOrder,
} from "../gallery/gallery-types"

interface SocialLink {
  id: string
  platform: string
  url: string
  enabled?: boolean
}

interface CustomLink {
  id: string
  title: string
  url: string
  animationEffect?: LinkAnimationEffect
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
  enabled?: boolean
}

type EditorSectionKey = "details" | "content" | "appearance" | "admin"

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
  const brand = useSiteBrand()
  const siteHost = getSiteHost(brand)
  const [expandedSections, setExpandedSections] = useState<Record<EditorSectionKey, boolean>>({
    details: true,
    content: true,
    appearance: false,
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
  const [galleries, setGalleries] = useState<BioGalleryBlockDto[]>(initialBio?.galleries || [])
  const [dividers, setDividers] = useState<BioDividerBlockDto[]>(initialBio?.dividers || [])
  const [bankDetails, setBankDetails] = useState<BioBankDetailsBlockDto[]>(initialBio?.bankDetails || [])
  const [contentOrder, setContentOrder] = useState<BioContentOrderItemDto[]>(() => normalizeContentOrder(
    initialBio?.contentOrder,
    {
      socials: initialBio?.socialLinks || [],
      widgets: initialBio?.widgets || [],
      galleries: initialBio?.galleries || [],
      dividers: initialBio?.dividers || [],
      bankDetails: initialBio?.bankDetails || [],
      links: initialBio?.customLinks || [],
    },
  ))
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    buttonStyle: normalizeBioButtonStyle(initialBio?.appearance.buttonStyle || "rounded"),
    backgroundColor: initialBio?.appearance.backgroundColor || "#ffffff",
    backgroundImage: initialBio?.appearance.backgroundImage || undefined,
    backgroundMediaType: initialBio?.appearance.backgroundMediaType || undefined,
    backgroundMediaUrl: initialBio?.appearance.backgroundMediaUrl || undefined,
    selectedBackgroundId: initialBio?.appearance.selectedBackgroundId || undefined,
  })
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

  const updateAppearanceSettings = (field: keyof AppearanceSettings, value: string | undefined) => {
    setAppearanceSettings((current) => ({ ...current, [field]: value }))
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
    galleries: galleries.map((gallery) => ({
      ...gallery,
      title: gallery.title?.trim() || undefined,
      images: gallery.images.map((image, sortOrder) => ({
        ...image,
        sortOrder,
        linkUrl: image.linkUrl && isValidUrl(image.linkUrl) ? image.linkUrl : undefined,
      })),
    })),
    dividers: dividers.map((block) => ({
      ...block,
      label: block.label?.trim() || undefined,
    })),
    bankDetails: bankDetails.map((block) => ({
      ...block,
      title: block.title.trim(),
      bankName: block.bankName.trim(),
      accountName: block.accountName.trim(),
      accountNumber: block.accountNumber.trim(),
      branch: block.branch?.trim() || undefined,
      note: block.note?.trim() || undefined,
    })),
    contentOrder: normalizeContentOrder(contentOrder, { socials: socialLinks, widgets, galleries, dividers, bankDetails, links: customLinks }),
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
    if (payload.socialLinks.length === 0 && payload.customLinks.length === 0 && payload.widgets.length === 0 && payload.galleries.every((gallery) => gallery.images.length === 0) && payload.dividers.length === 0 && payload.bankDetails.length === 0) {
      setSaveError("Thêm ít nhất một khối nội dung hợp lệ trước khi lưu.")
      return
    }
    if (nextStatus === "published" && payload.bankDetails.some((block) => block.enabled && !hasCompleteBankDetails(block))) {
      setSaveError("Hãy nhập tên ngân hàng, chủ tài khoản và số tài khoản trước khi xuất bản.")
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
      toast.success("Đã lưu trang Link-in-bio")
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Không lưu được trang Link-in-bio.")
      toast.error(error instanceof Error ? error.message : "Không lưu được trang Link-in-bio.")
    } finally {
      setIsSaving(false)
      onSavingChange?.(false)
    }
  }

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
  const normalizedOrder = normalizeContentOrder(contentOrder, { socials: socialLinks, widgets, galleries, dividers, bankDetails, links: customLinks })

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

          <EditorSection title="Nội dung" icon={Layers3} count={normalizedOrder.length} open={expandedSections.content} onOpenChange={(open) => setSectionOpen("content", open)}>
            <ContentSection
              customLinks={customLinks}
              socialLinks={socialLinks}
              widgets={widgets}
              galleries={galleries}
              dividers={dividers}
              bankDetails={bankDetails}
              hiddenLinks={hiddenLinks}
              contentOrder={normalizedOrder}
              disabled={isSaving}
              onCustomLinksChange={setCustomLinks}
              onSocialLinksChange={setSocialLinks}
              onWidgetsChange={setWidgets}
              onGalleriesChange={setGalleries}
              onDividersChange={setDividers}
              onBankDetailsChange={setBankDetails}
              onHiddenLinksChange={setHiddenLinks}
              onContentOrderChange={setContentOrder}
            />
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
                        <p className="mt-1 truncate text-xs font-medium text-slate-500">
                          {siteHost ? `${siteHost}/b/` : "/b/"}{customSlug || "ten-cua-ban"}
                        </p>
                        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">{profileDetails.title || "Thêm một mô tả ngắn để mọi người biết bạn là ai và nội dung bạn chia sẻ."}</p>
                      </header>

                      <div className="space-y-3">
                        {normalizedOrder.map((item, contentIndex) => {
                          if (item.type === "social") {
                            const visibleSocials = socialLinks.filter((social) => social.enabled !== false).slice(0, 8)
                            return visibleSocials.length ? <div key={contentOrderKey(item)} className="flex flex-wrap justify-center gap-2">{visibleSocials.map((social) => <button key={social.id} type="button" title={social.platform} className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm">{getSocialIcon(social.platform)}</button>)}</div> : null
                          }
                          if (item.type === "gallery") {
                            const gallery = galleries.find((entry) => entry.id === item.id)
                            return gallery ? <GalleryRenderer key={contentOrderKey(item)} gallery={gallery} emptyState={<div className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-center text-xs text-slate-500">Chưa có ảnh trong bộ sưu tập.</div>} /> : null
                          }
                          if (item.type === "divider") {
                            const block = dividers.find((entry) => entry.id === item.id)
                            return block ? <DividerRenderer key={contentOrderKey(item)} block={block} /> : null
                          }
                          if (item.type === "bank-details") {
                            const block = bankDetails.find((entry) => entry.id === item.id)
                            return block ? <BankDetailsRenderer key={contentOrderKey(item)} block={block} /> : null
                          }
                          if (item.type === "widget") {
                            const widget = widgets.find((entry) => entry.id === item.id)
                            return widget && widget.enabled !== false ? <div key={contentOrderKey(item)} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><BioWidgetEmbed widget={widget} /></div> : null
                          }
                          const link = customLinks.find((entry) => entry.id === item.id)
                          if (!link || hiddenLinks.includes(link.id)) return null
                          return <button key={contentOrderKey(item)} type="button" className={`${getBioLinkClass(selectedButtonStyle)} ${getLinkAnimationClassName(link.animationEffect)}`} style={{ ...getBioLinkStyle(selectedButtonStyle, accentColor), ...getLinkAnimationStyle(contentIndex), "--bio-accent": accentColor } as React.CSSProperties}><span className="min-w-0 truncate">{link.title || "Liên kết chưa đặt tên"}</span><span className={`grid size-8 shrink-0 place-items-center rounded-full ${getBioLinkIconClass(selectedButtonStyle)}`} style={getBioLinkIconStyle(selectedButtonStyle, accentColor)}><LinkIcon className="size-4" /></span></button>
                        })}
                      </div>
                      {customLinks.every((link) => hiddenLinks.includes(link.id)) && socialLinks.every((social) => social.enabled === false) && widgets.every((widget) => widget.enabled === false) && galleries.every((gallery) => !gallery.enabled || gallery.images.length === 0) && dividers.every((block) => !block.enabled) && bankDetails.every((block) => !block.enabled || !hasCompleteBankDetails(block)) ? <div className="rounded-xl border border-dashed border-slate-300 bg-white/55 px-4 py-8 text-center text-sm text-slate-500">Thêm nội dung để xem trước tại đây.</div> : null}
                      <div className="pt-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Powered by {brand.siteName}
                      </div>
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
