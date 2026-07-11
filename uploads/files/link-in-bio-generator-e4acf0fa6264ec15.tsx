"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ImagePicker from "@/components/image-picker"
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
  Instagram,
  GripVertical,
  Check,
  Youtube,
  Facebook,
  Twitter,
  Linkedin,
  Music,
  DollarSign,
  Music2,
  Play,
  Twitch,
} from "lucide-react"

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

export default function Component() {
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
    title: "Title",
  })

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { id: "1", platform: "YouTube", url: "https://youtube.com/channel/<your_channel>" },
    { id: "2", platform: "Reddit", url: "https://rekonise.cor" },
    { id: "3", platform: "PayPal", url: "https://rekonise.cor" },
    { id: "4", platform: "Instagram", url: "https://rekonise.cor" },
  ])

  const [customLinks, setCustomLinks] = useState<CustomLink[]>([
    { id: "1", title: "quqw", url: "rewewewewewe" },
    { id: "2", title: "uewewewewew", url: "https://example.com" },
  ])

  const [widgets, setWidgets] = useState<Widget[]>([])

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    buttonStyle: "rounded",
    backgroundColor: "#ffffff",
  })

  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [showWidgetSelector, setShowWidgetSelector] = useState(false)
  const [/*widgetButtonRef*/ /*setWidgetButtonRef*/ ,] = useState<HTMLButtonElement | null>(null)
  const [hiddenLinks, setHiddenLinks] = useState<string[]>([])

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
      id: Date.now().toString(),
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
      id: Date.now().toString(),
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
      id: Date.now().toString(),
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

  const updateAppearanceSettings = (field: keyof AppearanceSettings, value: string) => {
    setAppearanceSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const toggleLinkVisibility = (id: string) => {
    setHiddenLinks((prev) => (prev.includes(id) ? prev.filter((linkId) => linkId !== id) : [...prev, id]))
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
    { type: "youtube-video", label: "YouTube video", icon: Youtube },
    { type: "spotify-track", label: "Spotify track/playlist", icon: Music },
    { type: "instagram-post", label: "Instagram post", icon: Instagram },
    { type: "twitch-stream", label: "Twitch channel stream", icon: Twitch },
  ]

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return <Youtube className="w-6 h-6" />
      case "instagram":
        return <Instagram className="w-6 h-6" />
      case "facebook":
        return <Facebook className="w-6 h-6" />
      case "twitter":
        return <Twitter className="w-6 h-6" />
      case "linkedin":
        return <Linkedin className="w-6 h-6" />
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
        return <Youtube className="w-5 h-5" />
      case "spotify-track":
        return <Music className="w-5 h-5" />
      case "instagram-post":
        return <Instagram className="w-5 h-5" />
      case "twitch-stream":
        return <Twitch className="w-5 h-5" />
      default:
        return <Grid3X3 className="w-5 h-5" />
    }
  }

  const getButtonStyleClasses = (style: string) => {
    switch (style) {
      case "rounded":
        return "py-4 px-6 border-2 border-gray-800 rounded-lg text-gray-800 font-medium hover:bg-gray-800 hover:text-white transition-colors"
      case "minimalist":
        return "py-3 px-6 border-b-2 border-gray-800 text-gray-800 font-medium hover:border-gray-600 transition-colors bg-transparent"
      case "mineral-rounded":
        return "py-4 px-6 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors shadow-lg"
      case "mineral-square":
        return "py-4 px-6 bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors shadow-lg"
      case "rounded-border":
        return "py-4 px-6 border-2 border-gray-400 rounded-full text-gray-800 font-medium hover:border-gray-800 hover:bg-gray-50 transition-colors"
      case "glow":
        return "py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
      default:
        return "py-4 px-6 border-2 border-gray-800 rounded-lg text-gray-800 font-medium hover:bg-gray-800 hover:text-white transition-colors"
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

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case "youtube-video":
        return (
          <div className="w-full bg-gray-100 rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <Youtube className="w-5 h-5 text-red-600" />
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
              <Instagram className="w-5 h-5 text-pink-600" />
              <span className="font-medium text-gray-800">{widget.title || "Instagram Post"}</span>
            </div>
            <div className="bg-pink-100 rounded aspect-square flex items-center justify-center">
              <Instagram className="w-8 h-8 text-pink-400" />
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
              <Twitch className="w-5 h-5 text-purple-600" />
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
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Editor Panel */}
        <div className="bg-white border-r border-gray-200 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Link-in-bio - @sfdsdfsdf</h1>
          </div>

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
                  {customLinks.map((link, index) => (
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
                        <SelectItem value="rounded" className="text-gray-900 hover:bg-gray-50">
                          rounded
                        </SelectItem>
                        <SelectItem value="minimalist" className="text-gray-900 hover:bg-gray-50">
                          minimalist
                        </SelectItem>
                        <SelectItem value="mineral-rounded" className="text-gray-900 hover:bg-gray-50">
                          mineral-rounded
                        </SelectItem>
                        <SelectItem value="mineral-square" className="text-gray-900 hover:bg-gray-50">
                          mineral-square
                        </SelectItem>
                        <SelectItem value="rounded-border" className="text-gray-900 hover:bg-gray-50">
                          rounded-border
                        </SelectItem>
                        <SelectItem value="glow" className="text-gray-900 hover:bg-gray-50">
                          glow
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                <div className="p-4 border-t border-gray-200">
                  <p className="text-gray-500 text-sm">Admin settings will be available here.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-gray-100 p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-medium text-gray-700">PREVIEW</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-500">2 VIEWS</span>
              </div>
            </div>
            <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Mobile Preview */}
          <div className="flex justify-center">
            <div
              className="w-80 h-[600px] rounded-3xl p-6 border-4 border-gray-300 shadow-lg overflow-y-auto"
              style={getBackgroundStyle()}
            >
              <div className="space-y-6">
                {/* Profile Info */}
                <div className="text-center space-y-2">
                  <h2
                    className={`text-xl font-bold drop-shadow-lg ${appearanceSettings.backgroundImage || appearanceSettings.backgroundColor !== "#ffffff" ? "text-white" : "text-gray-900"}`}
                  >
                    {profileDetails.name}
                  </h2>
                  <p
                    className={`text-lg drop-shadow ${appearanceSettings.backgroundImage || appearanceSettings.backgroundColor !== "#ffffff" ? "text-white/90" : "text-gray-700"}`}
                  >
                    {profileDetails.title}
                  </p>
                </div>

                {/* Social Icons */}
                {socialLinks.length > 0 && (
                  <div className="flex gap-4 justify-center">
                    {socialLinks.map((social) => (
                      <div
                        key={social.id}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          appearanceSettings.backgroundImage ||
                          appearanceSettings.backgroundColor !== "#ffffff"
                            ? "bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/30"
                            : "border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                        }`}
                        title={social.platform}
                      >
                        {getSocialIcon(social.platform)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Widgets */}
                {widgets.length > 0 && (
                  <div className="space-y-4">
                    {widgets.map((widget) => (
                      <div key={widget.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        {renderWidget(widget)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Link Buttons */}
                <div className="space-y-3">
                  {customLinks
                    .filter((link) => !hiddenLinks.includes(link.id))
                    .map((link) => (
                      <button
                        key={link.id}
                        className={`w-full py-4 px-6 rounded-lg font-medium transition-colors ${
                          appearanceSettings.backgroundImage ||
                          appearanceSettings.backgroundColor !== "#ffffff"
                            ? "bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/30"
                            : getButtonStyleClasses(appearanceSettings.buttonStyle)
                        }`}
                      >
                        {link.title || "Untitled Link"}
                      </button>
                    ))}
                </div>

                {/* Empty state */}
                {customLinks.length === 0 && socialLinks.length === 0 && widgets.length === 0 && (
                  <div
                    className={`text-center py-8 ${
                      appearanceSettings.backgroundImage ||
                      appearanceSettings.backgroundColor !== "#ffffff"
                        ? "text-white/70"
                        : "text-gray-500"
                    }`}
                  >
                    <p>Add content to see it here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
