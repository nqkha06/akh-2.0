"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ImagePicker from "@/components/image-picker"
import {
  createBioPage,
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
  Play,
} from "lucide-react"
import {
  SiFacebook,
  SiInstagram,
  SiLinkerd,
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
  onCreated,
}: {
  showHeader?: boolean
  onCreated?: (bioPage: BioPageDto) => void
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
    name: "KhaTG",
    title: "Creator tools, presets and community links",
  })

  const [customSlug, setCustomSlug] = useState("khatg")
  const [status, setStatus] = useState<"published" | "draft">("published")

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { id: "1", platform: "YouTube", url: "https://youtube.com" },
    { id: "2", platform: "Reddit", url: "https://reddit.com" },
    { id: "3", platform: "PayPal", url: "https://paypal.com" },
    { id: "4", platform: "Instagram", url: "https://instagram.com" },
  ])

  const [customLinks, setCustomLinks] = useState<CustomLink[]>([
    { id: "1", title: "Preset Lightroom Pack", url: "https://example.com/preset-pack" },
    { id: "2", title: "Join creator community", url: "https://example.com/community" },
  ])

  const [widgets, setWidgets] = useState<Widget[]>([])

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    buttonStyle: "rounded",
    backgroundColor: "#ffffff",
  })

  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [showWidgetSelector, setShowWidgetSelector] = useState(false)
  const [hiddenLinks, setHiddenLinks] = useState<string[]>([])
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

  const buildCreatePayload = (): CreateBioPagePayload => ({
    name: profileDetails.name,
    title: profileDetails.title || undefined,
    customSlug: customSlug || undefined,
    status,
    socialLinks: socialLinks.filter((link) => link.platform && isValidUrl(link.url)),
    customLinks: customLinks.filter((link) => link.title.trim() && isValidUrl(link.url)),
    widgets: widgets.filter((widget) => widget.title.trim() && isValidUrl(widget.url)),
    hiddenLinks,
    appearance: appearanceSettings,
  })

  const handleSaveBio = async () => {
    if (isSaving) {
      return
    }

    setIsSaving(true)
    setSaveError("")

    try {
      const bioPage = await createBioPage(buildCreatePayload())
      setSavedBio(bioPage)
      onCreated?.(bioPage)
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
    { type: "twitch-stream", label: "Twitch channel stream", icon: SiTwitch },
  ]

  const buttonStyleOptions = [
    {
      value: "rounded",
      label: "Rounded solid",
      description: "CTA đậm, hợp profile bán hàng và creator.",
      sampleClass: "rounded-full bg-slate-950 text-white shadow-lg",
    },
    {
      value: "minimalist",
      label: "Minimalist",
      description: "Sạch, nhẹ, ít nhiễu cho portfolio chuyên nghiệp.",
      sampleClass: "rounded-xl border border-slate-200 bg-white text-slate-950",
    },
    {
      value: "mineral-rounded",
      label: "Mineral rounded",
      description: "Glass mềm, có chiều sâu, hợp bio lifestyle.",
      sampleClass: "rounded-[1.35rem] border border-white bg-white/80 text-slate-950 shadow-md",
    },
    {
      value: "mineral-square",
      label: "Mineral square",
      description: "Gọn, sắc, nhìn tech/editorial hơn.",
      sampleClass: "rounded-lg border border-slate-950 bg-white text-slate-950 shadow-[4px_4px_0_rgba(15,23,42,1)]",
    },
    {
      value: "rounded-border",
      label: "Rounded border",
      description: "Outline rõ, cân bằng giữa nhẹ và nổi bật.",
      sampleClass: "rounded-full border-2 border-blue-600 bg-white text-blue-700",
    },
    {
      value: "glow",
      label: "Glow",
      description: "Premium dark CTA với glow, hợp campaign nổi bật.",
      sampleClass: "rounded-[1.45rem] bg-slate-950 text-white shadow-[0_0_24px_rgba(37,99,235,0.45)]",
    },
    {
      value: "soft-shadow",
      label: "Soft shadow",
      description: "Button trắng nổi nhẹ, an toàn cho profile dịch vụ và portfolio.",
      sampleClass: "rounded-2xl border border-slate-100 bg-white text-slate-950 shadow-xl",
    },
    {
      value: "accent-gradient",
      label: "Accent gradient",
      description: "Gradient có điểm nhấn, hợp campaign và launch page.",
      sampleClass: "rounded-[1.35rem] bg-gradient-to-r from-slate-950 to-blue-600 text-white shadow-lg",
    },
    {
      value: "glass-outline",
      label: "Glass outline",
      description: "Trong, nhẹ, hợp nền ảnh hoặc màu đậm.",
      sampleClass: "rounded-[1.35rem] border border-white bg-white/70 text-slate-950 shadow-md",
    },
    {
      value: "neon-outline",
      label: "Neon outline",
      description: "Viền sáng trên nền tối, hợp creator/music/gaming.",
      sampleClass: "rounded-full border-2 border-cyan-400 bg-slate-950 text-white shadow-[0_0_18px_rgba(34,211,238,0.45)]",
    },
    {
      value: "compact-sharp",
      label: "Compact sharp",
      description: "Gọn, ít bo, hợp trang bio nhiều link cần scan nhanh.",
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
      case "twitch-stream":
        return <SiTwitch className="w-5 h-5" />
      default:
        return <Grid3X3 className="w-5 h-5" />
    }
  }

  const getBackgroundStyle = () => {
    if (appearanceSettings.backgroundImage) {
      return {
        backgroundImage: `url('${appearanceSettings.backgroundImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    }
    return {
      backgroundColor: appearanceSettings.backgroundColor,
    }
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

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case "youtube-video":
        return (
          <div className="w-full bg-gray-100 rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <SiYoutube className="w-5 h-5 text-red-600" />
              <span className="font-medium text-gray-800">{widget.title || "YouTube Video"}</span>
            </div>
            <div className="bg-gray-300 rounded aspect-video flex items-center justify-center">
              <Play className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        )
      case "spotify-track":
        return (
          <div className="w-full bg-green-100 rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <Music className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-800">{widget.title || "Spotify Track"}</span>
            </div>
            <div className="bg-green-200 rounded p-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-green-400 rounded"></div>
              <div>
                <div className="font-medium text-sm">Track Name</div>
                <div className="text-xs text-gray-600">Artist Name</div>
              </div>
            </div>
          </div>
        )
      case "instagram-post":
        return (
          <div className="w-full bg-pink-50 rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <SiInstagram className="w-5 h-5 text-pink-600" />
              <span className="font-medium text-gray-800">{widget.title || "Instagram Post"}</span>
            </div>
            <div className="bg-pink-100 rounded aspect-square flex items-center justify-center">
              <SiInstagram className="w-8 h-8 text-pink-400" />
            </div>
          </div>
        )
      case "audio-preview":
        return (
          <div className="w-full bg-blue-50 rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <Music2 className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-800">{widget.title || "Audio Preview"}</span>
            </div>
            <div className="bg-blue-100 rounded p-3 flex items-center gap-3">
              <Play className="w-8 h-8 text-blue-600" />
              <div className="flex-1 h-2 bg-blue-200 rounded"></div>
            </div>
          </div>
        )
      case "twitch-stream":
        return (
          <div className="w-full bg-purple-50 rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <SiTwitch className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-800">{widget.title || "Twitch Stream"}</span>
            </div>
            <div className="bg-purple-100 rounded aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                <div className="text-xs text-gray-600">LIVE</div>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="w-full bg-gray-100 rounded-lg p-4 border">
            <span className="font-medium text-gray-800">{widget.title || "Widget"}</span>
          </div>
        )
    }
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
                  className={`w-5 h-5 transition-transform duration-300 ${
                    expandedSections.details ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  expandedSections.details ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
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
                className={`transition-all duration-300 ease-in-out ${
                  expandedSections.links ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-4 border-t border-gray-200 space-y-4">
                  {customLinks.map((link) => (
                    <div
                      key={link.id}
                      className={`space-y-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                        draggedItem === link.id
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
                            className={`${
                              hiddenLinks.includes(link.id)
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
                  className={`w-5 h-5 transition-transform duration-300 ${
                    expandedSections.socials ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  expandedSections.socials ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
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
                  className={`w-5 h-5 transition-transform duration-300 ${
                    expandedSections.appearance ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  expandedSections.appearance ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
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
                    <p className="mt-2 text-xs font-medium leading-5 text-gray-500">
                      {
                        buttonStyleOptions.find(
                          (style) => style.value === appearanceSettings.buttonStyle,
                        )?.description
                      }
                    </p>
                  </div>

                  {/* Background Image */}
                  <div>
                    <label className="text-sm text-gray-600 block mb-3 font-medium">Background Image</label>
                    <ImagePicker
                      selectedImage={appearanceSettings.backgroundImage}
                      onImageSelect={(imageUrl) => updateAppearanceSettings("backgroundImage", imageUrl)}
                    />
                  </div>

                  {/* Background Color (fallback) */}
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">Background color (fallback)</label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={appearanceSettings.backgroundColor}
                        onChange={(e) => updateAppearanceSettings("backgroundColor", e.target.value)}
                        className="w-16 h-10 p-1 border border-gray-300 rounded"
                      />
                      <Input
                        value={appearanceSettings.backgroundColor}
                        onChange={(e) => updateAppearanceSettings("backgroundColor", e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1 bg-gray-50 border-gray-300 text-gray-900"
                      />
                    </div>
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
                  className={`w-5 h-5 transition-transform duration-300 ${
                    expandedSections.widgets ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  expandedSections.widgets ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
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
                          <label className="text-sm text-gray-600 block mb-1">Title</label>
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
                className={`transition-all duration-300 ease-in-out ${
                  expandedSections.admin ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
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
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-[#f4f7fb] p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-800">
                  PREVIEW
                </h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                  Live
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Mobile profile, 2 views today
              </p>
            </div>
            <Button
              type="button"
              onClick={handleSaveBio}
              disabled={isSaving || !profileDetails.name.trim()}
              className="bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-300"
            >
              <Share className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save bio"}
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

          <div className="flex justify-center">
            <div className="w-full max-w-[360px] rounded-[2.35rem] border border-slate-300 bg-slate-950 p-2 shadow-[0_22px_60px_rgba(15,23,42,0.24)]">
              <div
                className={`relative h-[640px] overflow-y-auto rounded-[1.9rem] ${
                  appearanceSettings.backgroundImage ||
                  appearanceSettings.backgroundColor !== "#ffffff"
                    ? "bg-slate-950"
                    : "bg-[#fff7ed]"
                }`}
                style={
                  appearanceSettings.backgroundImage ||
                  appearanceSettings.backgroundColor !== "#ffffff"
                    ? getBackgroundStyle()
                    : undefined
                }
              >
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/10 bg-white/85 px-4 py-3 backdrop-blur-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-900" />
                    <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                    <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
                    bio
                  </span>
                </div>

                <div
                  className={`${
                    appearanceSettings.backgroundImage ||
                    appearanceSettings.backgroundColor !== "#ffffff"
                      ? "bg-slate-950/50 backdrop-blur-sm"
                      : ""
                  }`}
                >
                  <div className="relative min-h-[190px] overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-28 bg-slate-950" />
                    <div className="absolute left-4 top-6 h-16 w-28 rounded-2xl bg-[#facc15]" />
                    <div className="absolute right-4 top-10 h-20 w-20 rounded-2xl bg-[#fb7185]" />
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-white" />

                    <div className="relative z-10 px-5 pt-16">
                      <div className="flex items-end gap-4">
                        <div className="grid size-24 shrink-0 place-items-center rounded-[1.6rem] border-4 border-white bg-slate-950 text-3xl font-black text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)]">
                          {profileDetails.name.trim().slice(0, 1).toUpperCase() || "K"}
                        </div>
                        <div className="min-w-0 pb-2">
                          <p className="mb-1 inline-flex rounded-full bg-[#facc15] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-slate-950">
                            Creator board
                          </p>
                          <h2 className="truncate text-2xl font-black tracking-tight text-slate-950">
                            {profileDetails.name || "Your name"}
                          </h2>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 bg-white px-5 pb-6">
                    <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                      <p className="text-sm font-bold leading-6 text-slate-700">
                        {profileDetails.title ||
                          "Drop your latest links, social channels and creator releases here."}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                        <span className="h-1.5 w-8 rounded-full bg-[#fb7185]" />
                        updated now
                      </div>
                    </div>

                    {socialLinks.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {socialLinks.slice(0, 8).map((social) => (
                          <button
                            key={social.id}
                            type="button"
                            className="grid h-13 cursor-pointer place-items-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:bg-slate-50"
                            title={social.platform}
                          >
                            {getSocialIcon(social.platform)}
                          </button>
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
                            {renderWidget(widget)}
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

                    <div className="border-t border-slate-200 pt-4 text-center">
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
  )
}
