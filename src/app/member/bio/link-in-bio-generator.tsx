"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ImagePicker, {
  getYouTubeEmbedUrl,
  type BackgroundMedia,
} from "@/components/image-picker"
import { BioWidgetEmbed } from "@/components/bio-widget-embed"
import {
  createBioPage,
  updateBioPage,
  type BioPageDto,
  type CreateBioPagePayload,
} from "@/lib/api-client"

import {
  ChevronDown,
  Settings,
  Link,
  Users,
  Palette,
  Grid3X3,
  Shield,
  Trash2,
  Plus,
  Share,
  GripVertical,
  Check,
  Music,
  DollarSign,
  Music2,
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

export default function LinkInBioGenerator({
  showHeader = true,
  initialBio,
  onSaved,
}: {
  showHeader?: boolean
  initialBio?: BioPageDto | null
  onSaved?: (bioPage: BioPageDto) => void
}) {
  const nextIdRef = useRef(10)
  const [expandedSections, setExpandedSections] = useState({
    details: false,
    links: false,
    socials: false,
    appearance: true,
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
    buttonStyle: initialBio?.appearance.buttonStyle || "rounded",
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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const updateProfileDetails = (field: keyof ProfileDetails, value: string) => {
    setProfileDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addSocialLink = () => {
    const newLink: SocialLink = {
      id: `social-${nextIdRef.current++}`,
      platform: "Instagram",
      url: "",
    }
    setSocialLinks([...socialLinks, newLink])
  }

  const removeSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter((link) => link.id !== id))
  }

  const updateSocialLink = (id: string, field: "platform" | "url", value: string) => {
    setSocialLinks(socialLinks.map((link) => (link.id === id ? { ...link, [field]: value } : link)))
  }

  const addCustomLink = () => {
    const newLink: CustomLink = {
      id: `link-${nextIdRef.current++}`,
      title: "",
      url: "",
    }
    setCustomLinks([...customLinks, newLink])
  }

  const removeCustomLink = (id: string) => {
    setCustomLinks(customLinks.filter((link) => link.id !== id))
  }

  const updateCustomLink = (id: string, field: "title" | "url", value: string) => {
    setCustomLinks(customLinks.map((link) => (link.id === id ? { ...link, [field]: value } : link)))
  }

  const addWidget = (type: string) => {
    const newWidget: Widget = {
      id: `widget-${nextIdRef.current++}`,
      type,
      title: "",
      url: "",
      description: "",
    }
    setWidgets([...widgets, newWidget])
    setShowWidgetSelector(false)
  }

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((widget) => widget.id !== id))
  }

  const updateWidget = (id: string, field: keyof Widget, value: string) => {
    setWidgets(widgets.map((widget) => (widget.id === id ? { ...widget, [field]: value } : widget)))
  }

  const updateAppearanceSettings = (field: keyof AppearanceSettings, value: string | undefined) => {
    setAppearanceSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const toggleLinkVisibility = (id: string) => {
    setHiddenLinks((prev) => (prev.includes(id) ? prev.filter((linkId) => linkId !== id) : [...prev, id]))
  }

  const isValidUrl = (value: string) => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  const isEditing = Boolean(initialBio)

  const buildBioPayload = (): CreateBioPagePayload => ({
    name: profileDetails.name.trim(),
    title: profileDetails.title || undefined,
    customSlug: customSlug || undefined,
    status,
    socialLinks: socialLinks.filter((link) => link.platform && isValidUrl(link.url)),
    customLinks: customLinks.filter((link) => link.title.trim() && isValidUrl(link.url)),
    widgets: widgets
      .filter((widget) => isValidUrl(widget.url))
      .map((widget) => ({ ...widget, title: widget.title.trim() })),
    hiddenLinks,
    appearance: appearanceSettings,
  })

  const handleSaveBio = async () => {
    if (isSaving) {
      return
    }

    const payload = buildBioPayload()
    if (!payload.name) {
      setSaveError("Tên Bio là bắt buộc.")
      return
    }

    if (payload.socialLinks.length === 0 && payload.customLinks.length === 0 && payload.widgets.length === 0) {
      setSaveError("Thêm ít nhất một social link, link hoặc widget trước khi lưu.")
      return
    }

    setIsSaving(true)
    setSaveError("")

    try {
      const bioPage = initialBio
        ? await updateBioPage(initialBio.id, payload)
        : await createBioPage(payload)
      setSavedBio(bioPage)
      onSaved?.(bioPage)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Không lưu được bio page.")
    } finally {
      setIsSaving(false)
    }
  }

  // Drag and Drop Functions
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (draggedItem && draggedItem !== id) {
      setDragOverItem(id)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverItem(null)
    }
  }

  const handleDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault()

    const draggedId = e.dataTransfer.getData("text/plain") || draggedItem

    if (!draggedId || draggedId === dropId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const draggedIndex = customLinks.findIndex((link) => link.id === draggedId)
    const dropIndex = customLinks.findIndex((link) => link.id === dropId)

    if (draggedIndex === -1 || dropIndex === -1) return

    const newLinks = [...customLinks]
    const [draggedLink] = newLinks.splice(draggedIndex, 1)
    newLinks.splice(dropIndex, 0, draggedLink)

    setCustomLinks(newLinks)
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const socialPlatforms = [
    "Instagram",
    "Twitter",
    "Facebook",
    "TikTok",
    "YouTube",
    "LinkedIn",
    "PayPal",
    "Venmo",
    "CashApp",
    "Spotify",
    "Apple Music",
    "Reddit",
    "Discord",
    "Twitch",
  ]

  const widgetTypes = [
    { type: "audio-preview", label: "Audio preview", icon: Music2 },
    { type: "youtube-video", label: "YouTube video", icon: SiYoutube },
    { type: "spotify-track", label: "Spotify track/playlist", icon: Music },
    { type: "instagram-post", label: "Instagram post", icon: SiInstagram },
    { type: "tiktok-video", label: "TikTok video", icon: SiTiktok },
    { type: "twitch-stream", label: "Twitch channel stream", icon: SiTwitch },
  ]

  const buttonStyleOptions = [
    {
      value: "rounded",
      label: "Rounded solid",
      sampleClass: "rounded-full bg-slate-950 text-white shadow-lg",
    },
    {
      value: "minimalist",
      label: "Minimalist",
      sampleClass: "rounded-xl border border-slate-200 bg-white text-slate-950",
    },
    {
      value: "mineral-rounded",
      label: "Mineral rounded",
      sampleClass: "rounded-[1.35rem] border border-white bg-white/80 text-slate-950 shadow-md",
    },
    {
      value: "mineral-square",
      label: "Mineral square",
      sampleClass: "rounded-lg border border-slate-950 bg-white text-slate-950 shadow-[4px_4px_0_rgba(15,23,42,1)]",
    },
    {
      value: "rounded-border",
      label: "Rounded border",
      sampleClass: "rounded-full border-2 border-blue-600 bg-white text-blue-700",
    },
    {
      value: "glow",
      label: "Glow",
      sampleClass: "rounded-[1.45rem] bg-slate-950 text-white shadow-[0_0_24px_rgba(37,99,235,0.45)]",
    },
    {
      value: "soft-shadow",
      label: "Soft shadow",
      sampleClass: "rounded-2xl border border-slate-100 bg-white text-slate-950 shadow-xl",
    },
    {
      value: "accent-gradient",
      label: "Accent gradient",
      sampleClass: "rounded-[1.35rem] bg-gradient-to-r from-slate-950 to-blue-600 text-white shadow-lg",
    },
    {
      value: "glass-outline",
      label: "Glass outline",
      sampleClass: "rounded-[1.35rem] border border-white bg-white/70 text-slate-950 shadow-md",
    },
    {
      value: "neon-outline",
      label: "Neon outline",
      sampleClass: "rounded-full border-2 border-cyan-400 bg-slate-950 text-white shadow-[0_0_18px_rgba(34,211,238,0.45)]",
    },
    {
      value: "compact-sharp",
      label: "Compact sharp",
      sampleClass: "rounded-md border border-slate-300 bg-white text-slate-950 shadow-sm",
    },
  ]

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return <SiYoutube className="w-6 h-6" />
      case "instagram":
        return <SiInstagram className="w-6 h-6" />
      case "facebook":
        return <SiFacebook className="w-6 h-6" />
      case "twitter":
        return <SiX className="w-6 h-6" />
      case "linkedin":
        return <SiLinkerd className="w-6 h-6" />
      case "spotify":
      case "apple music":
        return <Music className="w-6 h-6" />
      case "paypal":
      case "venmo":
      case "cashapp":
        return <DollarSign className="w-6 h-6" />
      case "reddit":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
          </svg>
        )
      default:
        return <Users className="w-6 h-6" />
    }
  }

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case "audio-preview":
        return <Music2 className="w-5 h-5" />
      case "youtube-video":
        return <SiYoutube className="w-5 h-5" />
      case "spotify-track":
        return <Music className="w-5 h-5" />
      case "instagram-post":
        return <SiInstagram className="w-5 h-5" />
      case "tiktok-video":
        return <SiTiktok className="w-5 h-5" />
      case "twitch-stream":
        return <SiTwitch className="w-5 h-5" />
      default:
        return <Grid3X3 className="w-5 h-5" />
    }
  }

  const getBackgroundStyle = () => {
    const backgroundImage = appearanceSettings.backgroundMediaType === "image"
      ? appearanceSettings.backgroundMediaUrl || appearanceSettings.backgroundImage
      : appearanceSettings.backgroundImage

    if (backgroundImage) {
      return {
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    }
    return {
      backgroundColor: appearanceSettings.backgroundColor,
    }
  }

  const selectedBackgroundMedia: BackgroundMedia | null = appearanceSettings.backgroundMediaType && appearanceSettings.backgroundMediaUrl
    ? {
        id: appearanceSettings.selectedBackgroundId || appearanceSettings.backgroundMediaType,
        type: appearanceSettings.backgroundMediaType,
        url: appearanceSettings.backgroundMediaUrl,
      }
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

  const previewAccentColor =
    appearanceSettings.backgroundColor &&
      appearanceSettings.backgroundColor.toLowerCase() !== "#ffffff"
      ? appearanceSettings.backgroundColor
      : "#2563eb"

  const getPreviewLinkClass = () => {
    const base =
      "group flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"

    switch (appearanceSettings.buttonStyle) {
      case "minimalist":
        return `${base} rounded-xl border border-slate-200 bg-white text-slate-950 shadow-none hover:border-slate-300 hover:bg-slate-50`
      case "mineral-rounded":
        return `${base} rounded-[1.45rem] border border-white/80 bg-white/85 text-slate-950 shadow-[0_14px_34px_rgba(15,23,42,0.10)] backdrop-blur hover:bg-white`
      case "mineral-square":
        return `${base} rounded-lg border-2 border-slate-950 bg-white text-slate-950 shadow-[5px_5px_0_rgba(15,23,42,1)] hover:bg-slate-50`
      case "rounded-border":
        return `${base} rounded-full border-2 bg-white text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:bg-slate-50`
      case "glow":
        return `${base} rounded-[1.55rem] border border-slate-700 bg-slate-950 text-white shadow-[0_16px_44px_rgba(37,99,235,0.32)] hover:bg-slate-900`
      case "soft-shadow":
        return `${base} rounded-2xl border border-slate-100 bg-white text-slate-950 shadow-[0_18px_38px_rgba(15,23,42,0.12)] hover:border-slate-200 hover:shadow-[0_22px_46px_rgba(15,23,42,0.16)]`
      case "accent-gradient":
        return `${base} rounded-[1.35rem] border border-transparent bg-gradient-to-r from-slate-950 via-slate-900 to-blue-700 text-white shadow-[0_18px_42px_rgba(37,99,235,0.24)] hover:from-slate-900 hover:to-blue-600`
      case "glass-outline":
        return `${base} rounded-[1.35rem] border border-white/80 bg-white/70 text-slate-950 shadow-[0_16px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl hover:bg-white/88`
      case "neon-outline":
        return `${base} rounded-full border-2 border-cyan-300 bg-slate-950 text-white shadow-[0_0_26px_rgba(34,211,238,0.34)] hover:border-cyan-200 hover:bg-slate-900`
      case "compact-sharp":
        return `${base} rounded-md border border-slate-300 bg-white px-3 py-3 text-slate-950 shadow-sm hover:border-slate-500 hover:bg-slate-50`
      default:
        return `${base} rounded-full border border-slate-950 bg-slate-950 text-white shadow-[0_14px_34px_rgba(15,23,42,0.20)] hover:bg-slate-800`
    }
  }

  const getPreviewLinkIconClass = () => {
    switch (appearanceSettings.buttonStyle) {
      case "minimalist":
        return "bg-slate-100 text-slate-700"
      case "mineral-rounded":
        return "bg-white text-slate-950 shadow-sm"
      case "mineral-square":
        return "bg-slate-950 text-white"
      case "rounded-border":
        return "text-white"
      case "glow":
        return "bg-white text-slate-950"
      case "soft-shadow":
        return "bg-slate-950 text-white"
      case "accent-gradient":
        return "bg-white text-slate-950"
      case "glass-outline":
        return "bg-white text-slate-950 shadow-sm"
      case "neon-outline":
        return "bg-cyan-300 text-slate-950"
      case "compact-sharp":
        return "bg-slate-100 text-slate-700"
      default:
        return "bg-white text-slate-950"
    }
  }

  const getPreviewLinkStyle = (): React.CSSProperties | undefined => {
    if (appearanceSettings.buttonStyle === "rounded-border") {
      return {
        borderColor: previewAccentColor,
      }
    }

    if (appearanceSettings.buttonStyle === "accent-gradient") {
      return {
        backgroundImage: `linear-gradient(135deg, #0f172a 0%, ${previewAccentColor} 100%)`,
      }
    }

    if (appearanceSettings.buttonStyle === "neon-outline") {
      return {
        borderColor: previewAccentColor,
        boxShadow: `0 0 26px ${previewAccentColor}55, inset 0 1px 0 rgba(255,255,255,0.1)`,
      }
    }

    if (appearanceSettings.buttonStyle === "glow") {
      return {
        boxShadow: `0 16px 44px ${previewAccentColor}42, inset 0 1px 0 rgba(255,255,255,0.12)`,
      }
    }

    return undefined
  }

  const getPreviewIconStyle = (): React.CSSProperties | undefined => {
    if (appearanceSettings.buttonStyle === "rounded-border") {
      return {
        backgroundColor: previewAccentColor,
      }
    }

    if (appearanceSettings.buttonStyle === "neon-outline") {
      return {
        backgroundColor: previewAccentColor,
      }
    }

    return undefined
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Editor Panel */}
      <div className="space-y-5">
        {showHeader ? (
          <div className="flex items-center gap-3 border-b border-slate-200/80 pb-5">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Link-in-bio
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Tạo trang bio gọn để gom social, link và widget trong một hồ sơ.
              </p>
            </div>
          </div>
        ) : null}

        {/* Sections */}
        <div className="space-y-4">
          {/* Details Section */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => toggleSection("details")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-medium">DETAILS</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${expandedSections.details ? "rotate-180" : ""
                  }`}
              />
            </button>

            <div
              className={`transition-all duration-300 ease-in-out ${expandedSections.details ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              <div className="p-4 border-t border-gray-200 space-y-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-2">
                    Name<span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={profileDetails.name}
                    onChange={(e) => updateProfileDetails("name", e.target.value)}
                    placeholder="Your name"
                    className="bg-gray-50 border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Title</label>
                  <Input
                    value={profileDetails.title}
                    onChange={(e) => updateProfileDetails("title", e.target.value)}
                    placeholder="Your title or description"
                    className="bg-gray-50 border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Public slug</label>
                  <div className="flex overflow-hidden rounded-md border border-gray-300 bg-gray-50 focus-within:border-blue-300">
                    <span className="inline-flex items-center border-r border-gray-300 px-3 text-sm font-bold text-gray-500">
                      /b/
                    </span>
                    <input
                      value={customSlug}
                      onChange={(e) =>
                        setCustomSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]+/g, "-")
                            .replace(/^-+/, ""),
                        )
                      }
                      placeholder="your-bio"
                      className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-semibold text-gray-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => toggleSection("links")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Link className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-medium">LINKS</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${expandedSections.links ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`transition-all duration-300 ease-in-out ${expandedSections.links ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              <div className="p-4 border-t border-gray-200 space-y-4">
                {customLinks.map((link) => (
                  <div
                    key={link.id}
                    className={`space-y-3 p-3 rounded-lg border-2 transition-all duration-200 ${draggedItem === link.id
                        ? "opacity-50 scale-95 border-blue-300 bg-blue-50"
                        : dragOverItem === link.id
                          ? "border-blue-400 bg-blue-50 transform scale-105"
                          : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      handleDragOver(e, link.id)
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, link.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, link.id)}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-200 rounded transition-colors"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="text-sm text-gray-600 block mb-1">Title</label>
                          <Input
                            value={link.title}
                            onChange={(e) => updateCustomLink(link.id, "title", e.target.value)}
                            placeholder="Link title"
                            className="bg-gray-50 border-gray-300 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 block mb-1">Url</label>
                          <Input
                            value={link.url}
                            onChange={(e) => updateCustomLink(link.id, "url", e.target.value)}
                            placeholder="https://example.com"
                            className="bg-gray-50 border-gray-300 text-gray-900"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleLinkVisibility(link.id)}
                          className={`${hiddenLinks.includes(link.id)
                              ? "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                              : "text-green-500 hover:text-green-600 hover:bg-green-50"
                            }`}
                          title={hiddenLinks.includes(link.id) ? "Show link" : "Hide link"}
                        >
                          {hiddenLinks.includes(link.id) ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4"
                            >
                              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                              <line x1="2" x2="22" y1="2" y2="22"></line>
                            </svg>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCustomLink(link.id)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="ghost"
                  onClick={addCustomLink}
                  className="w-full justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-dashed border-gray-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add link
                </Button>
              </div>
            </div>
          </div>

          {/* Socials Section */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => toggleSection("socials")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-medium">SOCIALS</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${expandedSections.socials ? "rotate-180" : ""
                  }`}
              />
            </button>

            <div
              className={`transition-all duration-300 ease-in-out ${expandedSections.socials ? " opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              <div className="p-4 border-t border-gray-200 space-y-4">
                {socialLinks.map((link) => (
                  <div key={link.id} className="space-y-2">
                    <div className="text-sm text-gray-600">Social</div>
                    <div className="flex gap-2">
                      <Select
                        value={link.platform}
                        onValueChange={(value) => updateSocialLink(link.id, "platform", value)}
                      >
                        <SelectTrigger className="flex-1 bg-gray-50 border-gray-300 text-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          {socialPlatforms.map((platform) => (
                            <SelectItem key={platform} value={platform} className="text-gray-900 hover:bg-gray-50">
                              {platform}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={link.url}
                        onChange={(e) => updateSocialLink(link.id, "url", e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSocialLink(link.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {link.platform === "YouTube" && (
                      <div className="text-xs text-gray-500 mt-1">
                        {link.url || "https://youtube.com/channel/<your_channel>"}
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  variant="ghost"
                  onClick={addSocialLink}
                  className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add social
                </Button>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => toggleSection("appearance")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-medium">APPEARANCE</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${expandedSections.appearance ? "rotate-180" : ""
                  }`}
              />
            </button>

            <div
              className={`transition-all duration-300 ease-in-out ${expandedSections.appearance ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              <div className="p-4 border-t border-gray-200 space-y-6">
                {/* Button Style */}
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Buttons style</label>
                  <Select
                    value={appearanceSettings.buttonStyle}
                    onValueChange={(value) => updateAppearanceSettings("buttonStyle", value)}
                  >
                    <SelectTrigger className="w-full bg-gray-50 border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {buttonStyleOptions.map((style) => (
                        <SelectItem
                          key={style.value}
                          value={style.value}
                          className="text-gray-900 hover:bg-gray-50"
                        >
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Background Image */}
                <div>
                  <label className="text-sm text-gray-600 block mb-3 font-medium">Background Image</label>
                  <ImagePicker
                    selectedMedia={selectedBackgroundMedia}
                    onMediaSelect={selectBackgroundMedia}
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Widgets Section */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => toggleSection("widgets")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Grid3X3 className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-medium">WIDGETS</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${expandedSections.widgets ? "rotate-180" : ""
                  }`}
              />
            </button>

            <div
              className={`transition-all duration-300 ease-in-out ${expandedSections.widgets ? " opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              <div className="p-4 border-t border-gray-200 space-y-4">
                {/* Add Widget Button */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => setShowWidgetSelector(!showWidgetSelector)}
                    className="w-full justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-dashed border-gray-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add widget
                  </Button>

                  {/* Widget Selector Dropdown */}
                  {showWidgetSelector && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] max-h-64 overflow-y-auto">
                      {widgetTypes.map((widgetType) => {
                        const IconComponent = widgetType.icon
                        return (
                          <button
                            key={widgetType.type}
                            onClick={() => addWidget(widgetType.type)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0"
                          >
                            <IconComponent className="w-5 h-5 text-gray-600" />
                            <span className="text-gray-700">{widgetType.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Overlay to close dropdown when clicking outside */}
                {showWidgetSelector && (
                  <div className="fixed inset-0 z-[9998]" onClick={() => setShowWidgetSelector(false)} />
                )}

                {/* Existing Widgets */}
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="space-y-3 p-3 rounded-lg border hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getWidgetIcon(widget.type)}
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {widget.type.replace("-", " ")}
                        </span>
                      </div>
                      <div className="flex-1"></div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWidget(widget.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">Title (optional)</label>
                        <Input
                          value={widget.title}
                          onChange={(e) => updateWidget(widget.id, "title", e.target.value)}
                          placeholder="Widget title"
                          className="bg-gray-50 border-gray-300 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">URL</label>
                        <Input
                          value={widget.url}
                          onChange={(e) => updateWidget(widget.id, "url", e.target.value)}
                          placeholder="https://example.com"
                          className="bg-gray-50 border-gray-300 text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Admin Section */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => toggleSection("admin")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-medium">ADMIN</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${expandedSections.admin ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`transition-all duration-300 ease-in-out ${expandedSections.admin ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              <div className="space-y-4 border-t border-gray-200 p-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Publish status</label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as "published" | "draft")}
                  >
                    <SelectTrigger className="w-full bg-gray-50 border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="published" className="text-gray-900 hover:bg-gray-50">
                        Published
                      </SelectItem>
                      <SelectItem value="draft" className="text-gray-900 hover:bg-gray-50">
                        Draft
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs font-semibold leading-5 text-gray-500">
                  Published bio có thể mở công khai qua đường dẫn /b/{customSlug || "your-bio"}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Preview Panel */}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-slate-800">
                PREVIEW
              </h2>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleSaveBio}
            disabled={isSaving || !profileDetails.name.trim()}
            className="bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-300"
          >
            <Share className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : isEditing ? "Update bio" : "Create bio"}
          </Button>
        </div>

        {saveError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {saveError}
          </div>
        ) : null}

        {savedBio ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            Bio saved:{" "}
            <a
              href={`/b/${savedBio.slug}`}
              className="underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              /b/{savedBio.slug}
            </a>
          </div>
        ) : null}


        <div
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#f4f7fb]"
          style={getBackgroundStyle()}
        >
          {selectedBackgroundMedia?.type === "video" ? (
            <video
              src={selectedBackgroundMedia.url}
              autoPlay
              muted
              loop
              playsInline
              className="pointer-events-none absolute inset-0 size-full object-cover"
            />
          ) : null}
          {selectedBackgroundMedia?.type === "youtube" && getYouTubeEmbedUrl(selectedBackgroundMedia.url) ? (
            <iframe
              src={getYouTubeEmbedUrl(selectedBackgroundMedia.url)}
              title="YouTube background preview"
              allow="autoplay; encrypted-media; picture-in-picture"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[266%] -translate-x-1/2 -translate-y-1/2"
            />
          ) : null}
          <div className="relative z-10 space-y-5 p-4 sm:p-6">
            <div className="flex justify-center">
            <div className="w-full">
              <div className="relative overflow-y-auto rounded-2xl">
                <div className="rounded-2xl bg-white/65 backdrop-blur-sm border border-slate-200">
                  <div className="relative z-10 px-5 pt-6">
                    <div className="flex items-center gap-4 flex-col">
                      <div className="grid size-24 shrink-0 place-items-center rounded-full border-4 border-white bg-slate-950 text-3xl font-black text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)]">
                        {profileDetails.name.trim().slice(0, 1).toUpperCase() || "K"}
                      </div>
                      <div className="min-w-0 pb-2">
                        <h2 className="truncate text-2xl font-black tracking-tight text-slate-950">
                          {profileDetails.name || "Your name"}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 px-5 pb-6">
                    <div className="rounded-2xl border border-white/50 bg-white/65 p-4 backdrop-blur-md">
                      <p className="text-sm font-bold leading-6 text-slate-700">
                        {profileDetails.title ||
                          "Drop your latest links, social channels and creator releases here."}
                      </p>
                    </div>

                    {socialLinks.length > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {socialLinks.slice(0, 8).map((social) => (
                          <Button
                            key={social.id}
                            type="button"
                            variant="outline"
                            size="icon"
                            title={social.platform}
                          >
                            {getSocialIcon(social.platform)}
                          </Button>
                        ))}
                      </div>
                    )}

                    {widgets.length > 0 && (
                      <div className="space-y-3">
                        {widgets.map((widget) => (
                          <div
                            key={widget.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                          >
                            <BioWidgetEmbed widget={widget} />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      {customLinks
                        .filter((link) => !hiddenLinks.includes(link.id))
                        .map((link) => (
                          <button
                            key={link.id}
                            type="button"
                            className={getPreviewLinkClass()}
                            style={getPreviewLinkStyle()}
                          >
                            <span className="min-w-0 truncate text-sm font-black">
                              {link.title || "Untitled Link"}
                            </span>
                            <span
                              className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-black transition-colors ${getPreviewLinkIconClass()}`}
                              style={getPreviewIconStyle()}
                            >
                              <Link className="size-4" />
                            </span>
                          </button>
                        ))}
                    </div>

                    {customLinks.length === 0 && socialLinks.length === 0 && widgets.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                        <p className="text-sm font-bold text-slate-500">
                          Add content to see it here
                        </p>
                      </div>
                    )}

                    <div className="border-slate-200 pt-4 text-center">
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                        rekonise.bio/{profileDetails.name.toLowerCase().replace(/\s+/g, "") || "creator"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
