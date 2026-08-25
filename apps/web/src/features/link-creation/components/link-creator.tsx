"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FilePickerCredenza } from "@/components/file-picker-credenza"
import { FileTypeIcon } from "@/components/file-type-icon"
import { FILE_CREATED_EVENT } from "@/components/dashboard/files/events"
import { SnippetPickerCredenza } from "./snippet-picker-credenza"
import {
  getSiteHost,
  useSiteBrand,
} from "@/features/site-settings/components/site-brand-provider"
import { LINK_CREATED_EVENT } from "@/features/links/events"
import { useBusinessConfig } from "@/features/business-settings/use-business-config"
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { actionCategories, platformCategories } from "../catalog"
import {
  COVER_IMAGE_EXTENSIONS,
  formatSnippetSize,
  getYouTubeEmbedUrl,
  isImageFile,
  isVideoFile,
} from "../lib/media"
import {
  checkLinkAliasAvailability,
  createSnippet,
  createLink,
  getFilePreviewUrl,
  getFiles,
  getLinks,
  getSnippets,
  uploadFile,
  updateLink,
  type LinkDto,
  type ManagedFileDto,
  type SnippetDto,
} from "@/lib/api-client"
import {
  Link,
  FileCode2,
  FileImage,
  MessageSquare,
  PlayCircle,
  UserPlus,
  ExternalLink,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  MousePointerClick,
  PanelsTopLeft,
  SlidersHorizontal,
  CalendarClock,
  History,
  X,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  type LucideIcon,
  Building2,
  StarIcon,
  ChevronsUpDown,
  ChevronsDown,
  ChevronsDownUp,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import {
  SiApplemusic,
  SiAppstore,
  SiAudiomack,
  SiBandcamp,
  SiBeatstars,
  SiBehance,
  SiBluesky,
  SiDeezer,
  SiDeviantart,
  SiDiscord,
  SiDribbble,
  SiFacebook,
  SiGithub,
  SiGoogleplay,
  SiInstagram,
  SiKick,
  SiLinkerd,
  SiOnlyfans,
  SiPinterest,
  SiProducthunt,
  SiReddit,
  SiRoblox,
  SiRumble,
  SiSnapchat,
  SiSoundcloud,
  SiSpotify,
  SiSteam,
  SiTelegram,
  SiThreads,
  SiTidal,
  SiTiktok,
  SiTwitch,
  SiVimeo,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import { cn } from "@/lib/utils"


type SocialActionItem = {
  id: string
  label: string
  requiresUrl: boolean
  icon: LucideIcon
}

type SocialPlatform = {
  name: string
  icon: LucideIcon
  color: string
  category?: string
  actions: SocialActionItem[]
}

const baseSocialPlatforms: Record<string, SocialPlatform> = {
  youtube: {
    name: "YouTube",
    icon: SiYoutube,
    color: "bg-red-600",
    actions: [
      { id: "subscribe", label: "Subscribe to channel", requiresUrl: true, icon: SiYoutube },
      { id: "subscribe-notifications", label: "Subscribe & turn on notifications", requiresUrl: true, icon: SiYoutube },
      { id: "like", label: "Like a video", requiresUrl: true, icon: SiYoutube },
      { id: "comment", label: "Comment on a video", requiresUrl: true, icon: SiYoutube },
      { id: "like-comment", label: "Like & comment on video", requiresUrl: true, icon: SiYoutube },
      { id: "watch", label: "Watch video", requiresUrl: true, icon: SiYoutube },
    ],
  },

  twitter: {
    name: "X/Twitter",
    icon: SiX,
    color: "bg-black",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiX },
      { id: "like", label: "Like post", requiresUrl: true, icon: SiX },
      { id: "reply", label: "Reply to post", requiresUrl: true, icon: SiX },
      { id: "repost", label: "Repost", requiresUrl: true, icon: SiX },
    ],
  },

  instagram: {
    name: "Instagram",
    icon: SiInstagram,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiInstagram },
      { id: "like", label: "Like user", requiresUrl: true, icon: SiInstagram },
      { id: "comment", label: "Comment on post", requiresUrl: true, icon: SiInstagram },
    ],
  },

  tiktok: {
    name: "TikTok",
    icon: SiTiktok,
    color: "bg-black",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiTiktok },
      { id: "like", label: "Like post", requiresUrl: true, icon: SiTiktok },
      { id: "comment", label: "Comment on post", requiresUrl: true, icon: SiTiktok },
    ],
  },

  facebook: {
    name: "Facebook",
    icon: SiFacebook,
    color: "bg-blue-600",
    actions: [
      { id: "like-page", label: "Like page", requiresUrl: true, icon: SiFacebook },
      { id: "like-post", label: "Like post", requiresUrl: true, icon: SiFacebook },
      { id: "comment", label: "Comment on post", requiresUrl: true, icon: SiFacebook },
      { id: "share", label: "Share post", requiresUrl: true, icon: SiFacebook },
    ],
  },

  discord: {
    name: "Discord",
    icon: SiDiscord,
    color: "bg-indigo-600",
    actions: [
      { id: "join-server", label: "Join server", requiresUrl: true, icon: SiDiscord },
    ],
  },

  telegram: {
    name: "Telegram",
    icon: SiTelegram,
    color: "bg-sky-500",
    actions: [
      { id: "join-channel", label: "Join channel", requiresUrl: true, icon: SiTelegram },
    ],
  },

  spotify: {
    name: "Spotify",
    icon: SiSpotify,
    color: "bg-green-500",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiSpotify },
      { id: "like-song", label: "Like song", requiresUrl: true, icon: SiSpotify },
    ],
  },

  twitch: {
    name: "Twitch",
    icon: SiTwitch,
    color: "bg-purple-600",
    actions: [
      { id: "follow-streamer", label: "Follow streamer", requiresUrl: true, icon: SiTwitch },
    ],
  },

  vimeo: {
    name: "Vimeo",
    icon: SiVimeo,
    color: "bg-sky-500",
    actions: [
      { id: "follow-creator", label: "Follow creator", requiresUrl: true, icon: SiVimeo },
    ],
  },

  threads: {
    name: "Threads",
    icon: SiThreads,
    color: "bg-black",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiThreads },
    ],
  },

  linkedin: {
    name: "LinkedIn",
    icon: SiLinkerd,
    color: "bg-blue-700",
    actions: [
      { id: "connect", label: "Connect", requiresUrl: true, icon: UserPlus },
      { id: "follow-company", label: "Follow company", requiresUrl: true, icon: Building2 },
    ],
  },

  pinterest: {
    name: "Pinterest",
    icon: SiPinterest,
    color: "bg-red-600",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiPinterest },
    ],
  },

  snapchat: {
    name: "Snapchat",
    icon: SiSnapchat,
    color: "bg-yellow-400",
    actions: [
      { id: "add-user", label: "Add user", requiresUrl: true, icon: SiSnapchat },
    ],
  },

  reddit: {
    name: "Reddit",
    icon: SiReddit,
    color: "bg-orange-600",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiReddit },
      { id: "upvote", label: "Upvote post", requiresUrl: true, icon: SiReddit },
    ],
  },

  whatsapp: {
    name: "WhatsApp",
    icon: SiWhatsapp,
    color: "bg-green-500",
    actions: [
      { id: "join-group", label: "Join group", requiresUrl: true, icon: SiWhatsapp },
    ],
  },

  bluesky: {
    name: "Bluesky",
    icon: SiBluesky,
    color: "bg-sky-500",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiBluesky },
    ],
  },

  soundcloud: {
    name: "SoundCloud",
    icon: SiSoundcloud,
    color: "bg-orange-500",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiSoundcloud },
      { id: "like-track", label: "Like track", requiresUrl: true, icon: SiSoundcloud },
      { id: "repost-track", label: "Repost track", requiresUrl: true, icon: SiSoundcloud },
    ],
  },

  deezer: {
    name: "Deezer",
    icon: SiDeezer,
    color: "bg-purple-600",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiDeezer },
    ],
  },

  kick: {
    name: "Kick",
    icon: SiKick,
    color: "bg-lime-500",
    actions: [
      { id: "follow-streamer", label: "Follow streamer", requiresUrl: true, icon: SiKick },
    ],
  },

  rumble: {
    name: "Rumble",
    icon: SiRumble,
    color: "bg-green-600",
    actions: [
      { id: "subscribe", label: "Subscribe to channel", requiresUrl: true, icon: SiRumble },
      { id: "like-video", label: "Like video", requiresUrl: true, icon: SiRumble },
    ],
  },

  roblox: {
    name: "Roblox",
    icon: SiRoblox,
    color: "bg-gray-900",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiRoblox },
      { id: "join-group", label: "Join group", requiresUrl: true, icon: SiRoblox },
      { id: "favorite-game", label: "Favorite game", requiresUrl: true, icon: SiRoblox },
      { id: "like-game", label: "Like game", requiresUrl: true, icon: SiRoblox },
    ],
  },

  steam: {
    name: "Steam",
    icon: SiSteam,
    color: "bg-slate-800",
    actions: [
      { id: "follow-curator", label: "Follow curator", requiresUrl: true, icon: SiSteam },
      { id: "comment-profile", label: "Comment on profile", requiresUrl: true, icon: SiSteam },
      { id: "join-group", label: "Join group", requiresUrl: true, icon: SiSteam },
    ],
  },

  behance: {
    name: "Behance",
    icon: SiBehance,
    color: "bg-blue-600",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiBehance },
    ],
  },

  dribbble: {
    name: "Dribbble",
    icon: SiDribbble,
    color: "bg-pink-500",
    actions: [
      { id: "follow-designer", label: "Follow designer", requiresUrl: true, icon: SiDribbble },
      { id: "like-shot", label: "Like shot", requiresUrl: true, icon: SiDribbble },
    ],
  },

  deviantart: {
    name: "DeviantArt",
    icon: SiDeviantart,
    color: "bg-green-600",
    actions: [
      { id: "watch-artist", label: "Watch artist", requiresUrl: true, icon: SiDeviantart },
      { id: "favorite-artwork", label: "Favorite artwork", requiresUrl: true, icon: SiDeviantart },
    ],
  },

  appleMusic: {
    name: "Apple Music",
    icon: SiApplemusic,
    color: "bg-pink-500",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiApplemusic },
    ],
  },

  audiomack: {
    name: "Audiomack",
    icon: SiAudiomack,
    color: "bg-yellow-500",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiAudiomack },
      { id: "like-song", label: "Like song", requiresUrl: true, icon: SiAudiomack },
    ],
  },

  beatstars: {
    name: "BeatStars",
    icon: SiBeatstars,
    color: "bg-red-600",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiBeatstars },
    ],
  },

  bandcamp: {
    name: "Bandcamp",
    icon: SiBandcamp,
    color: "bg-sky-600",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiBandcamp },
    ],
  },

  tidal: {
    name: "Tidal",
    icon: SiTidal,
    color: "bg-black",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiTidal },
    ],
  },

  // airbit: {
  //   name: "Airbit",
  //   icon: SiAirbit,
  //   color: "bg-blue-600",
  //   actions: [
  //     { id: "follow-producer", label: "Follow producer", requiresUrl: true, icon: UserPlus },
  //   ],
  // },

  onlyfans: {
    name: "OnlyFans",
    icon: SiOnlyfans,
    color: "bg-sky-500",
    actions: [
      { id: "view-page", label: "View page", requiresUrl: true, icon: SiOnlyfans },
    ],
  },

  github: {
    name: "GitHub",
    icon: SiGithub,
    color: "bg-gray-900",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiGithub },
      { id: "star-repository", label: "Star repository", requiresUrl: true, icon: SiGithub },
    ],
  },

  productHunt: {
    name: "Product Hunt",
    icon: SiProducthunt,
    color: "bg-orange-600",
    actions: [
      { id: "upvote-product", label: "Upvote product", requiresUrl: true, icon: SiProducthunt },
      { id: "follow-maker", label: "Follow maker", requiresUrl: true, icon: SiProducthunt },
    ],
  },

  googlePlay: {
    name: "Google Play Store",
    icon: SiGoogleplay,
    color: "bg-green-600",
    actions: [
      { id: "install-app", label: "Install app", requiresUrl: true, icon: SiGoogleplay },
    ],
  },

  appStore: {
    name: "iOS App Store",
    icon: SiAppstore,
    color: "bg-blue-600",
    actions: [
      { id: "install-app", label: "Install app", requiresUrl: true, icon: SiAppstore },
    ],
  },

  other: {
    name: "Other",
    icon: Link,
    color: "bg-gray-700",
    actions: [
      { id: "visit-page", label: "Visit a page", requiresUrl: true, icon: Link },
    ],
  },
}

type PopularActionOption = {
  platform: keyof typeof baseSocialPlatforms
  action: SocialActionItem
}

const popularActionMappings: Array<{ platform: keyof typeof baseSocialPlatforms; actionId: string }> = [
  { platform: "youtube", actionId: "subscribe" },
  { platform: "youtube", actionId: "subscribe-notifications" },
  { platform: "other", actionId: "visit-page" },
  { platform: "youtube", actionId: "like" },
  { platform: "youtube", actionId: "comment" },
  { platform: "youtube", actionId: "like-comment" },
  { platform: "youtube", actionId: "watch" },
  { platform: "tiktok", actionId: "follow" },
]

const popularActionOptions: PopularActionOption[] = popularActionMappings.flatMap(({ platform, actionId }) => {
  const action = baseSocialPlatforms[platform].actions.find((item) => item.id === actionId)
  return action ? [{ platform, action }] : []
})

const socialPlatforms: Record<string, SocialPlatform> = Object.fromEntries(
  Object.entries(baseSocialPlatforms).map(([key, platform]) => [
    key,
    { ...platform, category: platformCategories[key] ?? "Other" },
  ]),
)

const platformIconColors: Record<string, string> = {
  youtube: "text-red-600 dark:text-red-400",
  twitter: "text-foreground",
  instagram: "text-pink-600 dark:text-pink-400",
  tiktok: "text-foreground",
  facebook: "text-blue-600 dark:text-blue-400",
  discord: "text-indigo-600 dark:text-indigo-400",
  telegram: "text-sky-600 dark:text-sky-400",
  spotify: "text-green-600 dark:text-green-400",
  twitch: "text-purple-600 dark:text-purple-400",
  vimeo: "text-sky-600 dark:text-sky-400",
  threads: "text-foreground",
  linkedin: "text-blue-700 dark:text-blue-400",
  pinterest: "text-red-600 dark:text-red-400",
  snapchat: "text-yellow-600 dark:text-yellow-300",
  reddit: "text-orange-600 dark:text-orange-400",
  whatsapp: "text-green-600 dark:text-green-400",
  bluesky: "text-sky-600 dark:text-sky-400",
  soundcloud: "text-orange-600 dark:text-orange-400",
  deezer: "text-purple-600 dark:text-purple-400",
  kick: "text-lime-600 dark:text-lime-400",
  rumble: "text-green-600 dark:text-green-400",
  roblox: "text-foreground",
  steam: "text-slate-700 dark:text-slate-300",
  behance: "text-blue-600 dark:text-blue-400",
  dribbble: "text-pink-600 dark:text-pink-400",
  deviantart: "text-green-600 dark:text-green-400",
  appleMusic: "text-pink-600 dark:text-pink-400",
  audiomack: "text-yellow-600 dark:text-yellow-300",
  beatstars: "text-red-600 dark:text-red-400",
  bandcamp: "text-sky-600 dark:text-sky-400",
  tidal: "text-foreground",
  onlyfans: "text-sky-600 dark:text-sky-400",
  github: "text-foreground",
  productHunt: "text-orange-600 dark:text-orange-400",
  googlePlay: "text-green-600 dark:text-green-400",
  appStore: "text-blue-600 dark:text-blue-400",
  other: "text-muted-foreground",
}

function getPlatformIconClass(platform: string) {
  return platformIconColors[platform] || "text-muted-foreground"
}

interface SocialAction {
  id: string
  platform: keyof typeof socialPlatforms
  action: string
  url: string
  isValid: boolean
}

type MostUsedAction = Omit<SocialAction, "id" | "isValid"> & {
  count: number
  lastUsedAt: number
}

type AliasCheckStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error"

function toPlatformKey(platform: string): keyof typeof socialPlatforms {
  return platform in socialPlatforms
    ? (platform as keyof typeof socialPlatforms)
    : "other"
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function formatActionTarget(value: string) {
  try {
    const url = new URL(value)
    const segments = url.pathname.split("/").filter(Boolean)
    const target = segments.at(-1)
    return target ? decodeURIComponent(target) : url.hostname.replace(/^www\./, "")
  } catch {
    return value
  }
}

function getLocalDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function SectionTriggerLabel({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <span className="flex min-w-0 items-center gap-3 text-left">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/[0.07] text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
          {description}
        </span>
      </span>
    </span>
  )
}

type BackgroundMediaType = "image" | "video" | "youtube"

export default function SocialLinksGenerator({
  embedded = false,
  initialLink,
  onSaved,
  actionHistory,
}: {
  embedded?: boolean
  initialLink?: LinkDto
  onSaved?: (link: LinkDto) => void
  actionHistory?: LinkDto[]
} = {}) {
  const t = useTranslations("CreateLink")
  const businessConfig = useBusinessConfig()
  const backgroundImages = businessConfig.presetLibrary.images
  const backgroundVideos = businessConfig.presetLibrary.videos
  const brand = useSiteBrand()
  const siteHost = getSiteHost(brand)
  const initialInputType =
    initialLink?.inputType === "file" || initialLink?.inputType === "snippet"
      ? initialLink.inputType
      : "url"
  const initialActions = initialLink?.actions.map((action, index) => ({
    id: action.id || `action-${index + 1}`,
    platform: toPlatformKey(action.platform),
    action: action.action,
    url: action.url,
    isValid: isValidUrl(action.url),
  })) ?? []

  const actionIdRef = useRef(initialActions.length)
  const [destinationUrl, setDestinationUrl] = useState(initialInputType === "url" ? initialLink?.destinationUrl || "" : "")
  const [title, setTitle] = useState(initialLink?.title || "")
  const [inputType, setInputType] = useState<"url" | "file" | "snippet">(initialInputType)
  const [selectedFile, setSelectedFile] = useState<string>(initialLink?.selectedFile || "")
  const [selectedFileName, setSelectedFileName] = useState(
    initialLink?.destinationFileName || initialLink?.selectedFile || "",
  )
  const [availableFiles, setAvailableFiles] = useState<ManagedFileDto[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)
  const [coverImageUploading, setCoverImageUploading] = useState(false)
  const [fileError, setFileError] = useState("")
  const [coverFileError, setCoverFileError] = useState("")
  const [snippets, setSnippets] = useState<SnippetDto[]>([])
  const [snippetsLoading, setSnippetsLoading] = useState(false)
  const [snippetsLoaded, setSnippetsLoaded] = useState(false)
  const [snippetError, setSnippetError] = useState("")
  const [selectedSnippet, setSelectedSnippet] = useState<string>(initialLink?.selectedSnippet || "")
  const [isSnippetDialogOpen, setIsSnippetDialogOpen] = useState(false)
  const [isCoverImageDialogOpen, setIsCoverImageDialogOpen] = useState(false)
  const [actions, setActions] = useState<SocialAction[]>(initialActions)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set(["youtube"]))
  const [popularExpanded, setPopularExpanded] = useState(true)
  const [layoutOpen, setLayoutOpen] = useState(false)
  const [extraOptionsOpen, setExtraOptionsOpen] = useState(false)
  const [expiresOpen, setExpiresOpen] = useState(false)

  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>(initialLink?.backgroundSettings.selectedBackgroundId || "")
  const [sameAsCoverImage, setSameAsCoverImage] = useState(initialLink?.backgroundSettings.sameAsCoverImage || false)
  const [backgroundMediaType, setBackgroundMediaType] = useState<BackgroundMediaType | null>(
    initialLink?.backgroundSettings.backgroundMediaType || null,
  )
  const [backgroundMediaUrl, setBackgroundMediaUrl] = useState(initialLink?.backgroundSettings.backgroundMediaUrl || "")
  const [youtubeBackgroundUrl, setYoutubeBackgroundUrl] = useState(
    initialLink?.backgroundSettings.backgroundMediaType === "youtube"
      ? initialLink.backgroundSettings.backgroundMediaUrl || ""
      : "",
  )
  const [backgroundImageCategory, setBackgroundImageCategory] = useState("All")
  const [backgroundVideoCategory, setBackgroundVideoCategory] = useState("All")

  // Effects state
  const [opacity, setOpacity] = useState(initialLink?.backgroundSettings.effects.opacity ?? 100)
  const [blur, setBlur] = useState(initialLink?.backgroundSettings.effects.blur ?? 0)
  const [saturation, setSaturation] = useState(initialLink?.backgroundSettings.effects.saturation ?? 100)
  const [contrast, setContrast] = useState(initialLink?.backgroundSettings.effects.contrast ?? 100)
  const [grayscale, setGrayscale] = useState(initialLink?.backgroundSettings.effects.grayscale ?? 0)

  // Edit action state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingActionId, setEditingActionId] = useState<string | null>(null)

  // Action search & category filter
  const [actionSearch, setActionSearch] = useState("")
  const [actionCategory, setActionCategory] = useState<string>("all")

  // Extra options state
  const [subtitle, setSubtitle] = useState(initialLink?.subtitle || "")
  const [coverImageUrl, setCoverImageUrl] = useState(initialLink?.coverImageUrl || "")
  const [customAlias, setCustomAlias] = useState(initialLink?.customAlias || "")
  const [aliasCheckStatus, setAliasCheckStatus] = useState<AliasCheckStatus>("idle")
  const [aliasCheckMessage, setAliasCheckMessage] = useState("")

  // Expires state
  const [expiryEnabled, setExpiryEnabled] = useState(initialLink?.expiryEnabled || false)
  const [expiryType, setExpiryType] = useState<"date" | "clicks">(initialLink?.expiryType === "clicks" ? "clicks" : "date")
  const [expiryDate, setExpiryDate] = useState(initialLink?.expiryDate ? initialLink.expiryDate.slice(0, 10) : "")
  const [maxClicks, setMaxClicks] = useState(initialLink?.maxClicks ? String(initialLink.maxClicks) : "")
  const [expiryTime, setExpiryTime] = useState(initialLink?.expiryTime || "00:00")
  const [expiryValidationNow, setExpiryValidationNow] = useState(() => Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [validationAttempted, setValidationAttempted] = useState(false)
  const [createdLink, setCreatedLink] = useState<LinkDto | null>(null)
  const [publicUrlCopied, setPublicUrlCopied] = useState(false)
  const [fetchedActionHistory, setFetchedActionHistory] = useState<LinkDto[]>([])
  const createdPublicUrl = useMemo(() => {
    if (!createdLink) return ""

    const publicPath = `/l/${createdLink.slug}`

    if (brand.siteUrl) {
      try {
        return new URL(publicPath, brand.siteUrl).toString()
      } catch {
        // Fall back to the current browser origin or the configured host.
      }
    }

    if (typeof window !== "undefined") {
      return new URL(publicPath, window.location.origin).toString()
    }

    return siteHost ? `https://${siteHost}${publicPath}` : publicPath
  }, [brand.siteUrl, createdLink, siteHost])

  useEffect(() => {
    if (actionHistory !== undefined) return
    let active = true
    void getLinks()
      .then((links) => {
        if (active) setFetchedActionHistory(links)
      })
      .catch(() => {
        if (active) setFetchedActionHistory([])
      })
    return () => {
      active = false
    }
  }, [actionHistory])
  const isEditing = Boolean(initialLink)

  const loadAvailableFiles = useCallback(async () => {
    try {
      setFilesLoading(true)
      const response = await getFiles({ sort: "date", direction: "desc", limit: 100 })
      setAvailableFiles(response.items)
      setFileError("")
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Không tải được danh sách file.")
    } finally {
      setFilesLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadAvailableFiles)

    const handleFileCreated = () => void loadAvailableFiles()
    window.addEventListener(FILE_CREATED_EVENT, handleFileCreated)

    return () => {
      window.removeEventListener(FILE_CREATED_EVENT, handleFileCreated)
    }
  }, [loadAvailableFiles])

  const loadSnippets = useCallback(async () => {
    try {
      setSnippetsLoading(true)
      setSnippetError("")
      const data = await getSnippets()
      setSnippets(data)
      setSnippetsLoaded(true)
    } catch (error) {
      setSnippetError(error instanceof Error ? error.message : t("snippetLoadFailed"))
    } finally {
      setSnippetsLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (inputType === "snippet" && !snippetsLoaded && !snippetsLoading) {
      void Promise.resolve().then(loadSnippets)
    }
  }, [inputType, loadSnippets, snippetsLoaded, snippetsLoading])

  useEffect(() => {
    if (!expiryEnabled || expiryType !== "date") return
    const intervalId = window.setInterval(() => setExpiryValidationNow(Date.now()), 10_000)
    return () => window.clearInterval(intervalId)
  }, [expiryEnabled, expiryType])

  useEffect(() => {
    if (!publicUrlCopied) return

    const timerId = window.setTimeout(() => setPublicUrlCopied(false), 2_000)
    return () => window.clearTimeout(timerId)
  }, [publicUrlCopied])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const alias = customAlias.trim()

      if (isEditing) {
        setAliasCheckStatus("idle")
        setAliasCheckMessage(t("aliasEditing"))
        return
      }

      if (!alias) {
        setAliasCheckStatus("idle")
        setAliasCheckMessage("")
        return
      }

      if (alias.length < 3) {
        setAliasCheckStatus("invalid")
        setAliasCheckMessage(t("aliasMin"))
        return
      }

      setAliasCheckStatus("checking")
      setAliasCheckMessage(t("checkingAlias"))

      void checkLinkAliasAvailability(alias)
        .then((result) => {
          setAliasCheckStatus(result.available ? "available" : "taken")
          setAliasCheckMessage(
            result.available
              ? t("aliasAvailable", { alias: result.alias })
              : t("aliasTaken", { alias: result.alias }),
          )
        })
        .catch((error) => {
          setAliasCheckStatus("error")
          setAliasCheckMessage(error instanceof Error ? error.message : t("aliasCheckFailed"))
        })
    }, 450)

    return () => window.clearTimeout(timerId)
  }, [customAlias, isEditing, t])

  const addAction = (platform: keyof typeof socialPlatforms, actionId: string) => {
    actionIdRef.current += 1
    const newAction: SocialAction = {
      id: `action-${actionIdRef.current}`,
      platform,
      action: actionId,
      url: "",
      isValid: false,
    }
    setActions((current) => [...current, newAction])
    setIsActionModalOpen(false)
  }

  const addUsedAction = (usedAction: MostUsedAction) => {
    actionIdRef.current += 1
    setActions((current) => {
      const alreadyAdded = current.some(
        (action) =>
          action.platform === usedAction.platform &&
          action.action === usedAction.action &&
          action.url.trim().toLowerCase() === usedAction.url.trim().toLowerCase(),
      )
      if (alreadyAdded) return current
      return [
        ...current,
        {
          id: `action-${actionIdRef.current}`,
          platform: usedAction.platform,
          action: usedAction.action,
          url: usedAction.url,
          isValid: isValidUrl(usedAction.url),
        },
      ]
    })
  }

  const updateActionUrl = (actionId: string, url: string) => {
    setActions((current) =>
      current.map((action) =>
        action.id === actionId ? { ...action, url, isValid: url.length > 0 && isValidUrl(url) } : action,
      ),
    )
  }

  const removeAction = (actionId: string) => {
    setActions((current) => current.filter((action) => action.id !== actionId))
  }

  const getActionLabel = (platform: keyof typeof socialPlatforms, actionId: string) => {
    const fallback = socialPlatforms[platform].actions.find((a) => a.id === actionId)?.label || actionId
    return t.has(`actionLabels.${actionId}`) ? t(`actionLabels.${actionId}`) : fallback
  }

  const getActionIcon = (platform: keyof typeof socialPlatforms, actionId: string) => {
    return socialPlatforms[platform].actions.find((action) => action.id === actionId)?.icon ?? socialPlatforms[platform].icon
  }

  const togglePlatformExpanded = (platform: string) => {
    setExpandedPlatforms((current) => {
      const next = new Set(current)
      if (next.has(platform)) {
        next.delete(platform)
      } else {
        next.add(platform)
      }
      return next
    })
  }

  const toggleExpandAllPlatforms = () => {
    const allPlatformKeys = Object.keys(socialPlatforms)
    // If all platforms are expanded, collapse all. Otherwise, expand all.
    if (expandedPlatforms.size === allPlatformKeys.length) {
      setExpandedPlatforms(new Set())
    } else {
      setExpandedPlatforms(new Set(allPlatformKeys))
    }
  }

  const selectStoredFile = (file: ManagedFileDto) => {
    setSelectedFile(file.id)
    setSelectedFileName(file.name)
    setIsFileDialogOpen(false)
  }

  const coverImageFiles = availableFiles.filter(isImageFile)

  const openCoverImageDialog = () => {
    setCoverFileError("")
    setIsCoverImageDialogOpen(true)
  }

  const selectCoverImageFile = (file: ManagedFileDto) => {
    setCoverImageUrl(getFilePreviewUrl(file))
    setCoverFileError("")
    setIsCoverImageDialogOpen(false)
  }

  const selectBackgroundImage = (background: (typeof backgroundImages)[number]) => {
    setSelectedBackgroundId(background.id)
    setBackgroundMediaType("image")
    setBackgroundMediaUrl(background.imageUrl)
    setSameAsCoverImage(false)
  }

  const selectBackgroundVideo = (background: (typeof backgroundVideos)[number]) => {
    setSelectedBackgroundId(background.id)
    setBackgroundMediaType("video")
    setBackgroundMediaUrl(background.videoUrl)
    setSameAsCoverImage(false)
  }

  const selectBackgroundFile = (file: ManagedFileDto) => {
    const mediaType: BackgroundMediaType = isVideoFile(file) ? "video" : "image"

    setSelectedBackgroundId(`file:${file.id}`)
    setBackgroundMediaType(mediaType)
    setBackgroundMediaUrl(getFilePreviewUrl(file))
    setSameAsCoverImage(false)
  }

  const useYouTubeBackground = () => {
    const embedUrl = getYouTubeEmbedUrl(youtubeBackgroundUrl)

    if (!embedUrl) {
      toast.error(t("youtubeValid"))
      return
    }

    setSelectedBackgroundId("youtube")
    setBackgroundMediaType("youtube")
    setBackgroundMediaUrl(youtubeBackgroundUrl.trim())
    setSameAsCoverImage(false)
    toast.success(t("youtubeSelected"))
  }

  const uploadCoverFiles = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    const extension = file.name.split(".").pop()?.toLowerCase() || ""

    if (!file.type.startsWith("image/") && !COVER_IMAGE_EXTENSIONS.includes(extension)) {
      setCoverFileError(t("coverMustImage"))
      return
    }

    if (file.size > businessConfig.uploads.coverImageMaxBytes) {
      setCoverFileError(t("coverMaxSize"))
      return
    }

    try {
      setCoverImageUploading(true)
      const uploaded = await uploadFile(file, { purpose: "cover" })
      setAvailableFiles((current) => [uploaded, ...current])
      setCoverImageUrl(getFilePreviewUrl(uploaded))
      setCoverFileError("")
      setIsCoverImageDialogOpen(false)
      window.dispatchEvent(new CustomEvent(FILE_CREATED_EVENT, { detail: uploaded }))
    } catch (error) {
      setCoverFileError(error instanceof Error ? error.message : t("uploadCoverFailed"))
    } finally {
      setCoverImageUploading(false)
    }
  }

  const handleCoverUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    await uploadCoverFiles(Array.from(event.target.files || []))
    event.target.value = ""
  }

  const openSnippetDialog = () => {
    setIsSnippetDialogOpen(true)
    if (!snippetsLoaded && !snippetsLoading) void loadSnippets()
  }

  const selectSnippet = (snippet: SnippetDto) => {
    setSelectedSnippet(snippet.id)
    setIsSnippetDialogOpen(false)
  }

  const createSnippetItem = async (payload: { name?: string; content: string }) => {
    const snippet = await createSnippet(payload)
    setSnippets((current) => [snippet, ...current])
    return snippet
  }

  const uploadDestinationFiles = async (files: File[]) => {
    if (files.length === 0) return

    try {
      setFileUploading(true)
      const uploadedFiles: ManagedFileDto[] = []

      for (const file of files) {
        const uploaded = await uploadFile(file)
        uploadedFiles.push(uploaded)
        window.dispatchEvent(new CustomEvent(FILE_CREATED_EVENT, { detail: uploaded }))
      }

      const selectedUpload = uploadedFiles[0]
      setAvailableFiles((current) => [...uploadedFiles, ...current])
      setSelectedFile(selectedUpload.id)
      setSelectedFileName(selectedUpload.name)
      setIsFileDialogOpen(false)
      setFileError("")
    } catch (error) {
      setFileError(error instanceof Error ? error.message : t("uploadFileFailed"))
    } finally {
      setFileUploading(false)
    }
  }

  const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    await uploadDestinationFiles(Array.from(event.target.files || []))
    event.target.value = ""
  }

  const clearSelectedFile = () => {
    setSelectedFile("")
    setSelectedFileName("")
  }

  const resetEffects = () => {
    setOpacity(100)
    setBlur(0)
    setSaturation(100)
    setContrast(100)
    setGrayscale(0)
  }

  const handleEditAction = (actionId: string) => {
    const action = actions.find((a) => a.id === actionId)
    if (action) {
      setEditingActionId(actionId)
      setIsEditModalOpen(true)
    }
  }

  const handleChangeActionType = (platform: keyof typeof socialPlatforms, actionId: string) => {
    if (editingActionId) {
      const actionIndex = actions.findIndex((a) => a.id === editingActionId)
      if (actionIndex !== -1) {
        const updatedActions = [...actions]
        updatedActions[actionIndex] = {
          ...updatedActions[actionIndex],
          platform,
          action: actionId,
          url: "",
          isValid: false,
        }
        setActions(updatedActions)
        setIsEditModalOpen(false)
        setEditingActionId(null)
      }
    }
  }

  const isDestinationUrlValid = destinationUrl.length > 0 && isValidUrl(destinationUrl)
  const isFileDestinationValid = selectedFile.length > 0
  const isSnippetDestinationValid = selectedSnippet.length > 0
  const isDestinationValid =
    inputType === "url"
      ? isDestinationUrlValid
      : inputType === "file"
        ? isFileDestinationValid
        : isSnippetDestinationValid
  const completedActions = actions.filter((a) => a.isValid).length
  const totalActions = actions.length
  const allActionUrlsValid = totalActions > 0 && completedActions === totalActions
  const expiryClickLimit = Number(maxClicks)
  const expiryTimestamp = expiryDate
    ? new Date(`${expiryDate}T${expiryTime || "00:00"}:00`).getTime()
    : Number.NaN
  const isExpiryValid = !expiryEnabled || (
    expiryType === "date"
      ? Number.isFinite(expiryTimestamp) && expiryTimestamp > expiryValidationNow
      : Number.isInteger(expiryClickLimit) && expiryClickLimit > 0
  )
  const canCreateLink = isDestinationValid && allActionUrlsValid && isExpiryValid
  const selectedBackground = backgroundImages.find((bg) => bg.id === selectedBackgroundId)
  const selectedSnippetData = snippets.find((snippet) => snippet.id === selectedSnippet)
  const selectedFileData = availableFiles.find((file) => file.id === selectedFile)
  const selectedFileDisplayName = selectedFileData?.name || selectedFileName
  const selectedFileIconData = selectedFileData || (
    selectedFileDisplayName ? { name: selectedFileDisplayName } : null
  )
  const backgroundFileMedia = availableFiles.filter((file) => isImageFile(file) || isVideoFile(file))
  const youtubeEmbedUrl = backgroundMediaType === "youtube"
    ? getYouTubeEmbedUrl(backgroundMediaUrl)
    : getYouTubeEmbedUrl(youtubeBackgroundUrl)
  const activeBackgroundMediaType = sameAsCoverImage && coverImageUrl ? "image" : backgroundMediaType
  const activeBackgroundMediaUrl = sameAsCoverImage && coverImageUrl
    ? coverImageUrl
    : backgroundMediaType === "image"
      ? backgroundMediaUrl || selectedBackground?.imageUrl || ""
      : backgroundMediaUrl
  const backgroundImageCategories = [
    "All",
    ...Array.from(new Set(backgroundImages.flatMap((image) => image.categories))).sort(),
  ]
  const backgroundVideoCategories = [
    "All",
    ...Array.from(new Set(backgroundVideos.flatMap((video) => video.categories))).sort(),
  ]
  const filteredBackgroundImages = backgroundImages.filter((background) => (
    backgroundImageCategory === "All" ||
    background.categories.includes(backgroundImageCategory)
  ))
  const filteredBackgroundVideos = backgroundVideos.filter((video) => (
    backgroundVideoCategory === "All" || video.categories.includes(backgroundVideoCategory)
  ))

  // Derived data for action picker filtering
  const actionPlatformEntries = Object.entries(socialPlatforms)
  const filterActionPlatforms = (search: string, category: string) => actionPlatformEntries
    .map(([key, platform]) => ({ key, platform }))
    .filter(({ platform }) => {
      if (category !== "all" && (platform.category || "Other") !== category) return false
      if (!search) return true
      const q = search.toLowerCase()
      if (platform.name.toLowerCase().includes(q)) return true
      return platform.actions.some((action) => action.label.toLowerCase().includes(q))
    })
  const filteredPlatforms = filterActionPlatforms(actionSearch, actionCategory)
  const filterPopularActions = (search: string, category: string) => popularActionOptions.filter(({ platform, action }) => {
    if (category !== "all" && (platformCategories[platform] || "Other") !== category) return false
    if (!search) return true
    const normalizedSearch = search.toLowerCase()
    return action.label.toLowerCase().includes(normalizedSearch) || platform.toLowerCase().includes(normalizedSearch)
  })
  const filteredPopularActions = filterPopularActions(actionSearch, actionCategory)
  const mostUsedActions = useMemo(() => {
    const usage = new Map<string, MostUsedAction>()
    for (const link of actionHistory ?? fetchedActionHistory) {
      const lastUsedAt = new Date(link.updatedAt).getTime()
      for (const action of link.actions) {
        if (!isValidUrl(action.url)) continue
        const platform = toPlatformKey(action.platform)
        if (
          !socialPlatforms[platform].actions.some(
            (catalogAction) => catalogAction.id === action.action,
          )
        ) {
          continue
        }
        const key = `${platform}:${action.action}:${action.url.trim().toLowerCase()}`
        const existing = usage.get(key)
        usage.set(key, {
          platform,
          action: action.action,
          url: action.url.trim(),
          count: (existing?.count ?? 0) + 1,
          lastUsedAt: Math.max(existing?.lastUsedAt ?? 0, lastUsedAt),
        })
      }
    }

    return Array.from(usage.values())
      .filter(
        (usedAction) =>
          !actions.some(
            (action) =>
              action.platform === usedAction.platform &&
              action.action === usedAction.action &&
              action.url.trim().toLowerCase() === usedAction.url.toLowerCase(),
          ),
      )
      .sort(
        (left, right) =>
          right.count - left.count || right.lastUsedAt - left.lastUsedAt,
      )
      .slice(0, 8)
  }, [actionHistory, actions, fetchedActionHistory])

  const selectedBackgroundName = sameAsCoverImage && coverImageUrl
    ? "Cover image"
    : backgroundMediaType === "video"
      ? backgroundVideos.find((bg) => bg.id === selectedBackgroundId)?.name
      : backgroundMediaType === "youtube"
        ? "YouTube video"
        : selectedBackgroundId.startsWith("file:")
          ? backgroundFileMedia.find((file) => `file:${file.id}` === selectedBackgroundId)?.name
          : backgroundImages.find((bg) => bg.id === selectedBackgroundId)?.name

  const buildCreatePayload = () => ({
    title: title.trim(),
    destinationUrl:
      inputType === "file"
        ? ""
        : inputType === "snippet"
          ? ""
          : destinationUrl.trim(),
    inputType,
    selectedSnippet: inputType === "snippet" ? selectedSnippet || undefined : undefined,
    selectedFile: inputType === "file" ? selectedFile || undefined : undefined,
    subtitle: subtitle.trim() || undefined,
    customAlias: !isEditing && customAlias ? customAlias.trim() : undefined,
    coverImageUrl: coverImageUrl || undefined,
    expiryEnabled,
    expiryType: expiryEnabled ? expiryType : undefined,
    expiryDate: expiryEnabled && expiryType === "date" ? expiryDate || undefined : undefined,
    expiryTime: expiryEnabled && expiryType === "date" ? expiryTime || undefined : undefined,
    maxClicks: expiryEnabled && expiryType === "clicks" && maxClicks ? Number(maxClicks) : undefined,
    actions: actions.map(a => ({
      id: /^\d+$/.test(a.id) ? a.id : undefined,
      platform: a.platform,
      action: a.action,
      url: a.url.trim()
    })),
    backgroundSettings: {
      selectedBackgroundId: selectedBackgroundId || undefined,
      selectedBackgroundName,
      backgroundMediaType: activeBackgroundMediaType || undefined,
      backgroundMediaUrl:
        activeBackgroundMediaType === "youtube"
          ? backgroundMediaUrl || youtubeBackgroundUrl || undefined
          : activeBackgroundMediaUrl || undefined,
      sameAsCoverImage,
      effects: {
        opacity,
        blur,
        saturation,
        contrast,
        grayscale
      }
    }
  })

  const handleCreateLink = async () => {
    if (isSubmitting) {
      return
    }
    setValidationAttempted(true)
    if (!canCreateLink) {
      if (!isExpiryValid) setExpiresOpen(true)
      return
    }

    const normalizedCustomAlias = customAlias.trim()

    if (!isEditing && normalizedCustomAlias) {
      if (normalizedCustomAlias.length < 3) {
        setAliasCheckStatus("invalid")
        setAliasCheckMessage(t("aliasMin"))
        return
      }

      try {
        setAliasCheckStatus("checking")
        setAliasCheckMessage(t("checkingAlias"))
        const result = await checkLinkAliasAvailability(normalizedCustomAlias)

        if (!result.available) {
          setAliasCheckStatus("taken")
          setAliasCheckMessage(t("aliasTaken", { alias: result.alias }))
          return
        }

        setAliasCheckStatus("available")
        setAliasCheckMessage(t("aliasAvailable", { alias: result.alias }))
      } catch (error) {
        setAliasCheckStatus("error")
        setAliasCheckMessage(error instanceof Error ? error.message : t("aliasCheckFailed"))
        return
      }
    }

    setIsSubmitting(true)
    setSubmitError("")
    setCreatedLink(null)
    setPublicUrlCopied(false)

    try {
      const link = initialLink
        ? await updateLink(initialLink.id, buildCreatePayload())
        : await createLink(buildCreatePayload())
      setCreatedLink(link)
      if (initialLink) {
        toast.success(t("updated"))
      }
      onSaved?.(link)
      window.dispatchEvent(
        new CustomEvent(LINK_CREATED_EVENT, {
          detail: link,
        }),
      )
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("createFailed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyPublicUrl = async () => {
    if (!createdPublicUrl) return

    try {
      await navigator.clipboard.writeText(createdPublicUrl)
      setPublicUrlCopied(true)
      toast.success(t("copiedPublicUrl"))
    } catch {
      toast.error(t("copyPublicUrlFailed"))
    }
  }

  const isAllExpanded =
    expandedPlatforms.size === Object.keys(socialPlatforms).length;
  return (

    <div
      className={`${embedded ? "w-full" : "mx-auto max-w-6xl"} grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] xl:items-start`}
    >
      {/* Left Panel - Form */}
      <div className="min-w-0 space-y-4">
        <Card className="gap-0 overflow-hidden rounded-xl border-border bg-card py-0 shadow-none">
          <CardHeader className="space-y-4 px-4 py-4 sm:px-5">

            <Tabs
              value={inputType}
              onValueChange={(value) => {
                setInputType(value as "url" | "file" | "snippet")
              }}
              className="w-full min-w-0 !gap-0"
            >
              <TabsList className="grid h-9 w-full grid-cols-3">
                <TabsTrigger
                  value="url"
                 
                >
                  <Link className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{t("tabs.url")}</span>
                </TabsTrigger>

                <TabsTrigger
                  value="file"
                 
                >
                  <FileImage className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{t("tabs.file")}</span>
                </TabsTrigger>

                <TabsTrigger
                  value="snippet"
                 
                >
                  <MessageSquare className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{t("tabs.snippet")}</span>
                </TabsTrigger>
              </TabsList>




              {/* URL Tab */}
              <TabsContent value="url" className="mt-4 space-y-3">
                <div>
                  <Input
                    aria-describedby={
                      !isDestinationUrlValid && (validationAttempted || destinationUrl.length > 0)
                        ? "destination-url-error"
                        : undefined
                    }
                    aria-invalid={
                      !isDestinationUrlValid && (validationAttempted || destinationUrl.length > 0)
                    }
                    placeholder={t("destinationUrlPlaceholder")}
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className={`h-10 rounded-lg border-border bg-background text-foreground shadow-none placeholder:text-muted-foreground ${!isDestinationUrlValid && (validationAttempted || destinationUrl.length > 0) ? "border-destructive" : ""
                      }`}
                  />
                  {!isDestinationUrlValid && (validationAttempted || destinationUrl.length > 0) && (
                    <p id="destination-url-error" className="mt-1 text-sm text-destructive">
                      {destinationUrl.trim() ? t("invalidUrl") : t("destinationRequired")}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder={t("titlePlaceholder")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 rounded-lg border-border bg-background text-foreground shadow-none placeholder:text-muted-foreground"
                  />
                </div>
              </TabsContent>

              {/* File Tab */}
              <TabsContent value="file" className="mt-4 space-y-3">
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFileDialogOpen(true)}
                    aria-describedby={validationAttempted && !isFileDestinationValid ? "file-destination-error" : undefined}
                    data-invalid={validationAttempted && !isFileDestinationValid || undefined}
                    className={cn(
                      "flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-background px-3 text-left text-foreground transition-colors hover:border-foreground/20 hover:bg-muted/30",
                      validationAttempted && !isFileDestinationValid && "border-destructive",
                    )}
                  >
                    {selectedFileIconData ? (
                      <FileTypeIcon file={selectedFileIconData} />
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                        <FileImage className="h-5 w-5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {selectedFileDisplayName ? t("fileSelected") : t("selectFile")}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {selectedFileDisplayName
                          ? selectedFileDisplayName
                          : t("fileHint")}
                      </span>
                    </span>
                    {selectedFileDisplayName && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Clear selected file"
                        onClick={(event) => {
                          event.stopPropagation()
                          clearSelectedFile()
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            event.stopPropagation()
                            clearSelectedFile()
                          }
                        }}
                        className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                </div>
                {validationAttempted && !isFileDestinationValid ? (
                  <p id="file-destination-error" className="text-sm text-destructive">{t("fileRequired")}</p>
                ) : null}
                <div>
                  <Input
                    placeholder={t("titlePlaceholder")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 rounded-lg border-border bg-background text-foreground shadow-none placeholder:text-muted-foreground"
                  />
                </div>
              </TabsContent>

              {/* Snippet Tab */}
              <TabsContent value="snippet" className="mt-4 space-y-3">
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={openSnippetDialog}
                    aria-describedby={validationAttempted && !isSnippetDestinationValid ? "snippet-destination-error" : undefined}
                    data-invalid={validationAttempted && !isSnippetDestinationValid || undefined}
                    className={cn(
                      "flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-background px-3 text-left text-foreground transition-colors hover:border-foreground/20 hover:bg-muted/30",
                      validationAttempted && !isSnippetDestinationValid && "border-destructive",
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                      <MessageSquare className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {selectedSnippetData ? t("snippetSelected") : t("selectSnippet")}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {selectedSnippetData
                          ? `${selectedSnippetData.name} · ${formatSnippetSize(selectedSnippetData.content)}`
                          : t("snippetHint")}
                      </span>
                    </span>
                    {selectedSnippetData && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Clear selected snippet"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedSnippet("")
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            event.stopPropagation()
                            setSelectedSnippet("")
                          }
                        }}
                        className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                </div>
                {validationAttempted && !isSnippetDestinationValid ? (
                  <p id="snippet-destination-error" className="text-sm text-destructive">{t("snippetRequired")}</p>
                ) : null}

                <div>
                  <Input
                    placeholder={t("titlePlaceholder")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 rounded-lg border-border bg-background text-foreground shadow-none placeholder:text-muted-foreground"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <FilePickerCredenza
          open={isFileDialogOpen}
          onOpenChange={setIsFileDialogOpen}
          title={t("fileDialogTitle")}
          description={t("filePickerDescription")}
          mode="destination"
          files={availableFiles}
          isLoading={filesLoading}
          error={fileError}
          selectedFileId={selectedFile}
          onSelect={selectStoredFile}
          upload={{
            isUploading: fileUploading,
            label: t("uploadNewFile"),
            uploadingLabel: t("uploading"),
            multiple: true,
            onChange: handleUploadFile,
            onFiles: uploadDestinationFiles,
          }}
          labels={{
            name: t("name"),
            size: t("size"),
            uploaded: t("uploaded"),
            action: t("action"),
            loading: t("loading"),
            empty: t("noFiles"),
            select: t("select"),
            close: t("close"),
            search: t("searchFiles"),
            allTypes: t("allTypes"),
            images: t("images"),
            videos: t("videos"),
            documents: t("documents"),
            other: t("otherFiles"),
            newest: t("newest"),
            oldest: t("oldest"),
            nameSort: t("nameSort"),
            sizeSort: t("sizeSort"),
            noResults: t("noFileResults"),
            clearSearch: t("clearFilters"),
            preview: t("preview"),
            dragHint: t("dragFilesHint"),
            browseHint: t("browseFilesHint"),
            filesTab: t("filesTab"),
            uploadsTab: t("uploadsTab"),
            fileCount: (count) => t("fileCount", { count }),
          }}
        />

        <FilePickerCredenza
          open={isCoverImageDialogOpen}
          onOpenChange={setIsCoverImageDialogOpen}
          title={t("coverDialogTitle")}
          description={t("coverHint")}
          mode="cover"
          files={coverImageFiles}
          isLoading={filesLoading}
          error={coverFileError}
          selectedFileId={coverImageFiles.find((file) => getFilePreviewUrl(file) === coverImageUrl)?.id}
          onSelect={selectCoverImageFile}
          upload={{
            accept: "image/*",
            isUploading: coverImageUploading,
            label: t("uploadImage"),
            uploadingLabel: t("uploading"),
            onChange: handleCoverUploadFile,
            onFiles: uploadCoverFiles,
          }}
          footer={
            coverImageUrl ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCoverImageUrl("")
                  setSameAsCoverImage(false)
                  setIsCoverImageDialogOpen(false)
                }}
              >
                {t("removeCover")}
              </Button>
            ) : null
          }
          labels={{
            name: t("name"),
            size: t("size"),
            uploaded: t("uploaded"),
            action: t("action"),
            loading: t("loading"),
            empty: t("noImages"),
            select: t("select"),
            close: t("close"),
            search: t("searchImages"),
            allTypes: t("allTypes"),
            images: t("images"),
            newest: t("newest"),
            oldest: t("oldest"),
            nameSort: t("nameSort"),
            sizeSort: t("sizeSort"),
            noResults: t("noImageResults"),
            clearSearch: t("clearFilters"),
            preview: t("preview"),
            dragHint: t("dragImageHint"),
            browseHint: t("coverUploadHint"),
            filesTab: t("filesTab"),
            uploadsTab: t("uploadsTab"),
            fileCount: (count) => t("imageCount", { count }),
          }}
        />

        <SnippetPickerCredenza
          key={selectedSnippet || "unselected-snippet"}
          open={isSnippetDialogOpen}
          onOpenChange={setIsSnippetDialogOpen}
          snippets={snippets}
          selectedId={selectedSnippet}
          isLoading={snippetsLoading}
          loadError={snippetError}
          onRetry={() => void loadSnippets()}
          onSelect={selectSnippet}
          onCreate={createSnippetItem}
        />
        {/* Actions Section */}
        <Card className="gap-0 overflow-hidden rounded-xl border-border bg-card py-0 shadow-none">
          <CardHeader className="px-4 py-3 sm:px-5">
            <SectionTriggerLabel
              icon={MousePointerClick}
              title={t("actions")}
              description={t("actionsDescription")}
            />
          </CardHeader>
          <CardContent className="space-y-3 px-4 pt-0 pb-4 sm:px-5">
            {mostUsedActions.length > 0 ? (
              <div className="flex flex-col rounded-xl border border-border bg-muted/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                  <History className="size-4" aria-hidden="true" />
                  <span className="text-sm font-medium">{t("mostUsed")}</span>
                </div>
                <div className="flex max-h-28 flex-wrap gap-2 overflow-auto">
                  {mostUsedActions.map((usedAction) => {
                    const UsedActionIcon = getActionIcon(
                      usedAction.platform,
                      usedAction.action,
                    )
                    const target = formatActionTarget(usedAction.url)
                    const label = getActionLabel(
                      usedAction.platform,
                      usedAction.action,
                    )
                    return (
                      <button
                        key={`${usedAction.platform}:${usedAction.action}:${usedAction.url}`}
                        type="button"
                        onClick={() => addUsedAction(usedAction)}
                        aria-label={t("addUsedAction", { target, action: label })}
                        className="group relative flex min-w-0 max-w-full flex-col overflow-hidden rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:border-foreground/20 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Plus className="absolute left-2 size-4 -translate-x-1 scale-75 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:scale-100 group-focus-visible:opacity-100" />
                          <span className="flex min-w-0 items-center gap-2 transition-transform group-hover:translate-x-5 group-focus-visible:translate-x-5">
                            <UsedActionIcon className={`size-4 shrink-0 ${getPlatformIconClass(usedAction.platform)}`} />
                            <span className="max-w-48 truncate font-medium text-foreground">{target}</span>
                          </span>
                        </span>
                        <span className="max-h-0 overflow-hidden text-xs text-muted-foreground opacity-0 transition-all group-hover:mt-1 group-hover:max-h-6 group-hover:opacity-100 group-focus-visible:mt-1 group-focus-visible:max-h-6 group-focus-visible:opacity-100">
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {actions.map((action, index) => {
              const platform = socialPlatforms[action.platform]
              const Icon = getActionIcon(action.platform, action.action)
              const showActionUrlError =
                !action.isValid && (validationAttempted || action.url.length > 0)
              const actionErrorId = `action-url-error-${action.id}`
              return (
                <div key={action.id} className="space-y-2 rounded-lg border border-border bg-muted/15 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">{index + 1}.</span>
                      <button
                        onClick={() => handleEditAction(action.id)}
                        className="flex flex-1 items-center gap-2 rounded-md bg-muted px-3 py-2 text-left text-foreground transition-colors hover:bg-accent"
                      >
                        <Icon className={`w-4 h-4 ${getPlatformIconClass(action.platform)}`} />
                        <span className="text-sm">{getActionLabel(action.platform, action.action)}</span>
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(action.id)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <Input
                      aria-describedby={showActionUrlError ? actionErrorId : undefined}
                      aria-invalid={showActionUrlError}
                      placeholder={t("enterPlatformUrl", { platform: platform.name.toLowerCase() })}
                      value={action.url}
                      onChange={(e) => updateActionUrl(action.id, e.target.value)}
                      className={`h-10 rounded-lg border-border bg-background text-foreground shadow-none placeholder:text-muted-foreground ${showActionUrlError ? "border-destructive" : ""
                        }`}
                    />
                    {showActionUrlError && (
                      <p id={actionErrorId} className="mt-1 text-sm text-destructive">
                        {action.url.trim() ? t("invalidInput") : t("actionUrlRequired")}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Edit Action Modal */}
            <Credenza open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <CredenzaContent>
                <CredenzaHeader>
                  <CredenzaTitle className="flex items-center justify-between">
                    {t("changeAction")}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:bg-accent hover:text-foreground"
                      onClick={toggleExpandAllPlatforms}
                    >
                      {expandedPlatforms.size === Object.keys(socialPlatforms).length ? <ChevronsUpDown /> : <ChevronsDown />}

                      {expandedPlatforms.size === Object.keys(socialPlatforms).length ? t("collapseAll") : t("expandAll")}
                    </Button>
                  </CredenzaTitle>
                </CredenzaHeader>
                <CredenzaBody className="space-y-3 max-h-[65dvh]">
                  {filteredPopularActions.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                      <button
                        type="button"
                        onClick={() => setPopularExpanded((value) => !value)}
                        className="flex w-full items-center justify-between bg-muted/25 p-3 text-left transition-colors hover:bg-accent/60"
                      >
                        <span className="flex items-center gap-2">
                          <StarIcon className="size-5 text-primary" />
                          <span>{t("popular")}</span>
                        </span>
                        {popularExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                          {popularExpanded ? (
                            <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/15 p-3">
                              {filteredPopularActions.map(({ platform, action }) => {
                                const PopularPlatformIcon = socialPlatforms[platform].icon
                                return (
                                  <Button
                                    key={`${platform}-${action.id}`}
                                    type="button"
                                    onClick={() => handleChangeActionType(platform, action.id)}
                                    className={`${socialPlatforms[platform].color} max-w-full shrink-0 text-sm text-white hover:opacity-80`}
                                    size="sm"
                                  >
                                    <PopularPlatformIcon className="mr-1 size-4" />
                                    {getActionLabel(platform, action.id)}
                                  </Button>
                                )
                              })}
                            </div>
                      ) : null}
                    </div>
                  ) : null}
                  {Object.entries(socialPlatforms).map(([key, platform]) => {
                    const Icon = platform.icon
                    const isExpanded = expandedPlatforms.has(key)
                    return (
                      <div key={key} className="overflow-hidden rounded-lg border border-border bg-card">
                        <button
                          onClick={() => togglePlatformExpanded(key)}
                          className="flex w-full items-center justify-between bg-muted/25 p-3 text-left transition-colors hover:bg-accent/60"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 ${getPlatformIconClass(key)}`} />
                            <span>{platform.name}</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {isExpanded && (
                          <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/15 p-3">
                            {platform.actions.map((action) => (
                              <Button
                                key={action.id}
                                onClick={() => handleChangeActionType(key as keyof typeof socialPlatforms, action.id)}
                                className={`${platform.color} max-w-full shrink-0 text-sm text-white hover:opacity-80`}
                                size="sm"
                              >
                                <Icon className="w-4 h-4 mr-1" />
                                {getActionLabel(key as keyof typeof socialPlatforms, action.id)}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CredenzaBody>
                <CredenzaFooter>
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="w-full">
                    {t("close")}
                  </Button>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>

            <Credenza open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
              <Button
                variant="ghost"
                className="h-10 w-full rounded-lg border border-dashed border-border text-muted-foreground shadow-none hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                onClick={() => setIsActionModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("addAction")}
              </Button>
              <CredenzaContent>
                <CredenzaHeader>
                  <CredenzaTitle className="flex items-center justify-between">
                    {t("selectAction")}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:bg-accent hover:text-foreground"
                      onClick={toggleExpandAllPlatforms}
                    >

                      {isAllExpanded ? (
                        <ChevronsDownUp className="size-5" strokeWidth={2.4} />
                      ) : (
                        <ChevronsUpDown className="size-5" strokeWidth={2.4} />
                      )}

                      {isAllExpanded ? t("collapseAll") : t("expandAll")}
                    </Button>
                  </CredenzaTitle>
                </CredenzaHeader>
                <CredenzaBody className="space-y-3 max-h-[65dvh]">
                  <div className="space-y-3">
                    <Input
                      placeholder={t("searchActions")}
                      value={actionSearch}
                      onChange={(e) => setActionSearch(e.target.value)}
                      className="h-10"
                    />

                    <div className="flex gap-2 flex-wrap">
                      {actionCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActionCategory(cat)}
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${actionCategory === cat ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                        >
                          {cat === "all" ? t("all") : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* All Platforms */}
                  {filteredPopularActions.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                      <button
                        type="button"
                        onClick={() => setPopularExpanded((value) => !value)}
                        className="flex w-full items-center justify-between bg-muted/25 p-3 text-left transition-colors hover:bg-accent/60"
                      >
                        <span className="flex items-center gap-2">
                          <StarIcon className="size-5 text-primary" />
                          <span>{t("popular")}</span>
                        </span>
                        {popularExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                          {popularExpanded ? (
                            <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/15 p-3">
                              {filteredPopularActions.map(({ platform, action }) => {
                                const PopularPlatformIcon = socialPlatforms[platform].icon
                                return (
                                  <Button
                                    key={`${platform}-${action.id}`}
                                    type="button"
                                    onClick={() => addAction(platform, action.id)}
                                    className={`${socialPlatforms[platform].color} max-w-full shrink-0 text-sm text-white hover:opacity-80`}
                                    size="sm"
                                  >
                                    <PopularPlatformIcon className="mr-1 size-4" />
                                    {getActionLabel(platform, action.id)}
                                  </Button>
                                )
                              })}
                            </div>
                      ) : null}
                    </div>
                  ) : null}
                  {filteredPlatforms.map(({ key, platform }) => {
                    const PlatformIcon = platform.icon
                    const isExpanded = expandedPlatforms.has(key)
                    return (
                      <div key={key} className="overflow-hidden rounded-lg border border-border bg-card">
                        <button
                          onClick={() => togglePlatformExpanded(key)}
                          className="flex w-full items-center justify-between bg-muted/25 p-3 text-left transition-colors hover:bg-accent/60"
                        >
                          <div className="flex items-center gap-2">
                            <PlatformIcon className={`w-5 h-5 ${getPlatformIconClass(key)}`} />
                            <span>{platform.name} ({platform.actions.length})</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {isExpanded && (
                          <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/15 p-3">
                            {platform.actions.map((action) => (
                              <Button
                                key={action.id}
                                onClick={() => addAction(key as keyof typeof socialPlatforms, action.id)}
                                className={`${platform.color} max-w-full shrink-0 text-sm text-white hover:opacity-80`}
                                size="sm"
                              >
                                <PlatformIcon className="w-4 h-4 mr-1" />
                                {getActionLabel(key as keyof typeof socialPlatforms, action.id)}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CredenzaBody>
                <CredenzaFooter>
                  <Button variant="outline" onClick={() => setIsActionModalOpen(false)} className="w-full">
                    {t("close")}
                  </Button>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>
            {validationAttempted && totalActions === 0 ? (
              <p className="text-sm text-destructive">{t("actionRequired")}</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Collapsible open={layoutOpen} onOpenChange={setLayoutOpen}>
            <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 transition-colors hover:border-primary/20 hover:bg-muted/20">
              <SectionTriggerLabel
                icon={PanelsTopLeft}
                title={t("layout")}
                description={t("layoutDescription")}
              />
              {layoutOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-6 rounded-lg border border-border bg-card p-4">
              {/* Background Section */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-foreground">{t("background")}</h4>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (!coverImageUrl) return
                      setSameAsCoverImage(!sameAsCoverImage)
                    }}
                    disabled={!coverImageUrl}
                    aria-disabled={!coverImageUrl}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sameAsCoverImage ? "bg-primary" : "bg-muted"} ${!coverImageUrl ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sameAsCoverImage ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                  <span className="text-sm text-muted-foreground">{t("sameAsCover")}</span>
                </div>
              </div>

              {/* Gallery Section */}
              {!sameAsCoverImage && (

                <div>
                  <h4 className="mb-3 text-sm font-medium text-foreground">{t("gallery")}</h4>
                  <Tabs defaultValue="images" className="w-full">
                    <TabsList variant="line">
                      <TabsTrigger value="images">{t("images")}</TabsTrigger>
                      <TabsTrigger value="videos">{t("videos")}</TabsTrigger>
                      <TabsTrigger value="my-files">{t("myFiles")}</TabsTrigger>
                      <TabsTrigger value="embed">{t("embedYoutube")}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="images">
                      <div className="rounded-lg border border-border bg-muted/15 p-3">
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {backgroundImageCategories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setBackgroundImageCategory(category)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${backgroundImageCategory === category
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                                }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>

                        <div className="mb-3 text-xs font-medium text-muted-foreground">
                          {t("imageCountShort", { count: filteredBackgroundImages.length })}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-90 overflow-y-auto pr-2">
                          {filteredBackgroundImages.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => selectBackgroundImage(bg)}
                              title={bg.name}
                              className={`relative aspect-square w-full overflow-hidden rounded-lg transition-transform transform will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedBackgroundId === bg.id
                                ? "ring-2 ring-primary scale-100"
                                : "hover:scale-105"
                                }`}
                            >
                              <Image
                                src={bg.imageUrl}
                                alt={bg.name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
                              <div className="absolute inset-x-0 bottom-0 p-2 text-left">
                                <span className="inline-flex rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                                  {bg.name}
                                </span>
                              </div>
                              <span className="sr-only">{bg.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* <CardContent className="text-sm text-muted-foreground">
                            Page views are up 25% compared to last month.
                          </CardContent> */}
                    </TabsContent>
                    <TabsContent value="videos">
                      <div className="rounded-lg border border-border bg-muted/15 p-3">
                        <div className="mb-3 flex flex-wrap gap-2">
                          {backgroundVideoCategories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setBackgroundVideoCategory(category)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${backgroundVideoCategory === category
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                                }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>

                        <div className="mb-3 text-xs font-medium text-muted-foreground">
                          {t("videoCountShort", { count: filteredBackgroundVideos.length })}
                        </div>

                        <div className="grid max-h-90 grid-cols-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
                          {filteredBackgroundVideos.map((video) => (
                            <button
                              key={video.id}
                              type="button"
                              onClick={() => selectBackgroundVideo(video)}
                              title={video.name}
                              className={`group relative aspect-video overflow-hidden rounded-lg text-left transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedBackgroundId === video.id
                                ? "ring-2 ring-primary"
                                : "hover:scale-[1.02]"
                                }`}
                            >
                              <video
                                src={video.videoUrl}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                onMouseEnter={(event) => void event.currentTarget.play()}
                                onMouseLeave={(event) => event.currentTarget.pause()}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
                              <div className="absolute inset-x-0 bottom-0 p-3">
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800">
                                  <PlayCircle className="h-3 w-3" />
                                  {video.source}
                                </span>
                                <p className="mt-1 text-sm font-bold text-white">{video.name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="my-files">
                      <div className="rounded-lg border border-border bg-muted/15 p-3">
                        {filesLoading ? (
                          <div className="flex items-center justify-center gap-2 py-8 text-sm font-medium text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("loadingFiles")}
                          </div>
                        ) : backgroundFileMedia.length === 0 ? (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            {t("backgroundFileHint")}
                          </div>
                        ) : (
                          <div className="grid max-h-90 grid-cols-2 gap-3 overflow-y-auto pr-2 sm:grid-cols-3">
                            {backgroundFileMedia.map((file) => {
                              const fileUrl = getFilePreviewUrl(file)
                              const isVideo = isVideoFile(file)
                              const selected = selectedBackgroundId === `file:${file.id}`

                              return (
                                <button
                                  key={file.id}
                                  type="button"
                                  onClick={() => selectBackgroundFile(file)}
                                  title={file.name}
                                  className={`group overflow-hidden rounded-lg border bg-muted/20 text-left transition-colors hover:bg-muted/35 ${selected ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-foreground/20"}`}
                                >
                                  <div className="relative aspect-square bg-muted">
                                    {isVideo ? (
                                      <video
                                        src={fileUrl}
                                        muted
                                        loop
                                        playsInline
                                        preload="metadata"
                                        onMouseEnter={(event) => void event.currentTarget.play()}
                                        onMouseLeave={(event) => event.currentTarget.pause()}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={fileUrl} alt={file.name} className="h-full w-full object-cover" />
                                    )}
                                    <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                      {isVideo ? t("video") : t("image")}
                                    </span>
                                  </div>
                                  <div className="px-3 py-2">
                                    <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                                    <p className="truncate text-xs text-muted-foreground">{file.sizeLabel}</p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="embed">
                      <div className="space-y-3 rounded-lg border border-border bg-muted/15 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={youtubeBackgroundUrl}
                            onChange={(event) => setYoutubeBackgroundUrl(event.target.value)}
                            placeholder={t("youtubePlaceholder")}
                            className="h-10 border-border bg-background shadow-none"
                          />
                          <Button
                            type="button"
                            onClick={useYouTubeBackground}
                            className="h-10 bg-primary px-4 font-medium text-primary-foreground shadow-none hover:bg-primary/90"
                          >
                            {t("useVideo")}
                          </Button>
                        </div>

                        {youtubeBackgroundUrl && !getYouTubeEmbedUrl(youtubeBackgroundUrl) && (
                          <p className="text-sm font-medium text-red-600">
                            {t("invalidYoutube")}
                          </p>
                        )}

                        {getYouTubeEmbedUrl(youtubeBackgroundUrl) && (
                          <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-black">
                            <iframe
                              src={getYouTubeEmbedUrl(youtubeBackgroundUrl)}
                              title={t("youtubePreview")}
                              allow="autoplay; encrypted-media; picture-in-picture"
                              className="h-full w-full"
                            />
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                </div>
              )}

              {/* Effects Section */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-foreground">{t("effects")}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700 text-xs h-6"
                    onClick={resetEffects}
                  >
                    {t("reset")}
                  </Button>
                </div>

                {/* Opacity Slider */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t("opacity")}</label>
                      <span className="text-sm text-muted-foreground">{opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                    />
                  </div>

                  {/* Blur Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t("blur")}</label>
                      <span className="text-sm text-muted-foreground">{blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={blur}
                      onChange={(e) => setBlur(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                    />
                  </div>

                  {/* Saturation Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t("saturation")}</label>
                      <span className="text-sm text-muted-foreground">{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                    />
                  </div>

                  {/* Contrast Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t("contrast")}</label>
                      <span className="text-sm text-muted-foreground">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                    />
                  </div>

                  {/* Grayscale Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t("grayscale")}</label>
                      <span className="text-sm text-muted-foreground">{grayscale}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={grayscale}
                      onChange={(e) => setGrayscale(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={extraOptionsOpen} onOpenChange={setExtraOptionsOpen}>
            <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 transition-colors hover:border-primary/20 hover:bg-muted/20">
              <SectionTriggerLabel
                icon={SlidersHorizontal}
                title={t("extraOptions")}
                description={t("extraOptionsDescription")}
              />
              {extraOptionsOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-4 rounded-lg border border-border bg-card p-4">
              {/* Subtitle */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">{t("subtitle")}</label>
                <Input
                  placeholder={t("subtitlePlaceholder")}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="h-10 rounded-lg border-border bg-background shadow-none"
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">{t("coverImage")}</label>
                <div className="space-y-2">
                  {coverImageUrl && (
                    <div className="relative h-32 w-full overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImageUrl}
                        alt={t("coverImage")}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImageUrl("")
                          setSameAsCoverImage(false)
                        }}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={openCoverImageDialog}
                    className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-border bg-background px-3 text-left text-foreground transition-colors hover:border-foreground/20 hover:bg-muted/30"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                      <FileImage className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {coverImageUrl ? t("coverSelected") : t("selectCover")}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {coverImageUrl || t("coverSelectHint")}
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Custom Alias */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">{t("customAlias")}</label>
                <div className="space-y-2">
                  <div className={`flex flex-1 items-center rounded-lg border bg-muted/25 px-3 ${
                    aliasCheckStatus === "available"
                      ? "border-emerald-300"
                      : aliasCheckStatus === "taken" || aliasCheckStatus === "invalid" || aliasCheckStatus === "error"
                        ? "border-red-300"
                        : "border-border"
                  } ${isEditing ? "opacity-70" : ""}`}>
                    <span className="text-sm text-muted-foreground">
                      {siteHost ? `${siteHost}/l/` : "/l/"}
                    </span>
                    <Input
                      placeholder={t("aliasPlaceholder")}
                      value={customAlias}
                      disabled={isEditing}
                      onChange={(e) => {
                        const nextAlias = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]+/g, "-")
                          .replace(/-+/g, "-")
                          .replace(/^-+/, "")

                        setCustomAlias(nextAlias)
                        setAliasCheckStatus(nextAlias ? "checking" : "idle")
                        setAliasCheckMessage(nextAlias ? "Checking alias..." : "")
                      }}
                      className="h-11 border-0 bg-transparent text-sm disabled:cursor-not-allowed"
                    />
                    {!isEditing && customAlias ? (
                      <span className="ml-2 grid h-6 w-6 shrink-0 place-items-center">
                        {aliasCheckStatus === "checking" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : aliasCheckStatus === "available" ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : aliasCheckStatus === "taken" || aliasCheckStatus === "invalid" || aliasCheckStatus === "error" ? (
                          <X className="h-4 w-4 text-red-600" />
                        ) : null}
                      </span>
                    ) : null}
                  </div>

                  {isEditing ? (
                    null
                  ) : aliasCheckMessage ? (
                    <p
                      className={`text-xs font-medium ${
                        aliasCheckStatus === "available"
                          ? "text-emerald-600"
                          : aliasCheckStatus === "taken" || aliasCheckStatus === "invalid" || aliasCheckStatus === "error"
                            ? "text-red-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {aliasCheckMessage}
                    </p>
                  ) : (
                    <p className="text-xs leading-5 text-muted-foreground">
                      {t("aliasRandomHint")}
                    </p>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* <Collapsible open={emailCapturingOpen} onOpenChange={setEmailCapturingOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 font-semibold">EMAIL CAPTURING</span>
                </div>
                {emailCapturingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-white border border-gray-200 rounded-lg mt-1">
                <p className="text-gray-500">Email capturing options will be here...</p>
              </CollapsibleContent>
            </Collapsible> */}

          {/* <Collapsible open={widgetsOpen} onOpenChange={setWidgetsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 font-semibold">WIDGETS / PREVIEWS</span>
                </div>
                {widgetsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-white border border-gray-200 rounded-lg mt-1">
                <p className="text-gray-500">Widget options will be here...</p>
              </CollapsibleContent>
            </Collapsible> */}

          <Collapsible open={expiresOpen} onOpenChange={setExpiresOpen}>
            <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 transition-colors hover:border-primary/20 hover:bg-muted/20">
              <SectionTriggerLabel
                icon={CalendarClock}
                title={t("expires")}
                description={t("expiresDescription")}
              />
              {expiresOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-4 rounded-lg border border-border bg-card p-4">
              {/* Enable Expiry Toggle */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setExpiryEnabled(!expiryEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${expiryEnabled ? "bg-primary" : "bg-muted"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${expiryEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
                <span className="text-sm text-muted-foreground">{t("enableExpiry")}</span>
              </div>

              {expiryEnabled && (
                <div className="space-y-4 border-t border-border pt-4">
                  {/* Expiry Type Selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">{t("expiryType")}</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpiryType("date")}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${expiryType === "date"
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                          }`}
                      >
                        {t("byDate")}
                      </button>
                      <button
                        onClick={() => setExpiryType("clicks")}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${expiryType === "clicks"
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                          }`}
                      >
                        {t("byClicks")}
                      </button>
                    </div>
                  </div>

                  {/* Date & Time Expiry */}
                  {expiryType === "date" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">{t("expiryDate")}</label>
                        <Input
                          aria-describedby={validationAttempted && !isExpiryValid ? "expiry-date-error" : undefined}
                          aria-invalid={validationAttempted && !isExpiryValid}
                          type="date"
                          value={expiryDate}
                          onChange={(e) => {
                            setExpiryDate(e.target.value)
                            setExpiryValidationNow(Date.now())
                          }}
                          className={cn(
                            "h-10 rounded-lg border-border bg-background shadow-none",
                            validationAttempted && !isExpiryValid && "border-destructive",
                          )}
                          min={getLocalDateInputValue(new Date(expiryValidationNow))}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">{t("expiryTime")}</label>
                        <Input
                          aria-describedby={validationAttempted && !isExpiryValid ? "expiry-date-error" : undefined}
                          aria-invalid={validationAttempted && !isExpiryValid}
                          type="time"
                          value={expiryTime}
                          onChange={(e) => {
                            setExpiryTime(e.target.value)
                            setExpiryValidationNow(Date.now())
                          }}
                          className={cn(
                            "h-10 rounded-lg border-border bg-background shadow-none",
                            validationAttempted && !isExpiryValid && "border-destructive",
                          )}
                        />
                      </div>
                      {validationAttempted && !isExpiryValid ? (
                        <p id="expiry-date-error" className="text-sm text-destructive">{t("expiryRequired")}</p>
                      ) : null}
                      {expiryDate && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <p className="text-sm text-primary">
                            {t("expiresOn", { date: new Date(expiryDate).toLocaleDateString(), time: expiryTime })}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clicks Limit Expiry */}
                  {expiryType === "clicks" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">{t("maximumClicks")}</label>
                        <Input
                          aria-describedby={validationAttempted && !isExpiryValid ? "expiry-clicks-error" : undefined}
                          aria-invalid={validationAttempted && !isExpiryValid}
                          type="number"
                          placeholder={t("maximumClicksPlaceholder")}
                          value={maxClicks}
                          onChange={(e) => setMaxClicks(e.target.value)}
                          className={cn(
                            "h-10 rounded-lg border-border bg-background shadow-none",
                            validationAttempted && !isExpiryValid && "border-destructive",
                          )}
                          min="1"
                        />
                      </div>
                      {validationAttempted && !isExpiryValid ? (
                        <p id="expiry-clicks-error" className="text-sm text-destructive">{t("expiryRequired")}</p>
                      ) : null}
                      {maxClicks && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <p className="text-sm text-primary">
                            {t("expiresAfter", { count: maxClicks })}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="min-w-0 space-y-3 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t("previewTitle")}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("completeActionsHint")}</p>
          </div>

          <Button
            className={`h-9 rounded-lg px-4 font-medium shadow-none ${canCreateLink ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground"
              }`}
            disabled={isSubmitting}
            onClick={handleCreateLink}
          >
            {isSubmitting ? (isEditing ? t("saving") : t("creating")) : isEditing ? t("saveChanges") : t("create")}
          </Button>
        </div>

        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive"
          >
            {submitError}
          </div>
        )}

        {createdLink && (
          <section
            role="status"
            aria-live="polite"
            className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4 shadow-none"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </span>

              <div className="min-w-0 pt-0.5">
                <h3 className="text-sm font-semibold text-foreground">
                  {isEditing ? t("updated") : t("createdSuccess")}
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {isEditing ? t("updatedDescription") : t("createdDescription")}
                </p>
              </div>
            </div>

            <div className="mt-4 flex min-w-0 items-center gap-1 rounded-lg border border-border bg-background p-1.5 pl-3">
              <a
                href={createdPublicUrl}
                target="_blank"
                rel="noreferrer"
                title={createdPublicUrl}
                className="min-w-0 flex-1 truncate font-mono text-xs font-medium text-foreground underline-offset-4 hover:text-primary hover:underline sm:text-sm"
              >
                {createdPublicUrl}
              </a>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label={publicUrlCopied ? t("copiedPublicUrl") : t("copyPublicUrl")}
                    onClick={() => void handleCopyPublicUrl()}
                  >
                    {publicUrlCopied ? (
                      <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {publicUrlCopied ? t("copiedPublicUrl") : t("copyPublicUrl")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon-sm" className="shrink-0">
                    <a
                      href={createdPublicUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t("openPublicUrl")}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("openPublicUrl")}</TooltipContent>
              </Tooltip>
            </div>
          </section>
        )}

        <Card className="relative z-10 min-h-[420px] overflow-hidden rounded-xl border-border bg-slate-100 p-4 shadow-none dark:bg-[#010102] sm:p-5 lg:min-h-[560px]">
          {activeBackgroundMediaType === "video" && activeBackgroundMediaUrl ? (
            <video
              src={activeBackgroundMediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{
                filter: `opacity(${opacity / 100}) blur(${blur}px) saturate(${saturation / 100}) contrast(${contrast / 100}) grayscale(${grayscale / 100})`,
              }}
            />
          ) : activeBackgroundMediaType === "youtube" && youtubeEmbedUrl ? (
            <iframe
              src={youtubeEmbedUrl}
              title="YouTube background"
              allow="autoplay; encrypted-media; picture-in-picture"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[266%] -translate-x-1/2 -translate-y-1/2 sm:h-[130%] sm:w-[231%]"
              style={{
                filter: `opacity(${opacity / 100}) blur(${blur}px) saturate(${saturation / 100}) contrast(${contrast / 100}) grayscale(${grayscale / 100})`,
              }}
            />
          ) : (
            <div
              className="pointer-events-none absolute inset-0 bg-slate-100 dark:bg-[#010102]"
              style={{
                backgroundImage: activeBackgroundMediaUrl
                  ? `url(${activeBackgroundMediaUrl})`
                  : "none",
                backgroundSize: activeBackgroundMediaUrl ? "cover" : "auto",
                backgroundPosition: activeBackgroundMediaUrl ? "center" : "initial",
                backgroundRepeat: "no-repeat",
                filter: `opacity(${opacity / 100}) blur(${blur}px) saturate(${saturation / 100}) contrast(${contrast / 100}) grayscale(${grayscale / 100})`,
              }}
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-white/70 dark:bg-black/70" />

          <Card className="r
          flex flex-col items-center justify-center
          relative gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-5 text-left text-slate-950 shadow-none backdrop-blur-md dark:border-white/10 dark:bg-[#0f1011]/95 dark:text-[#f7f8f8]">
            {coverImageUrl && (
              <div className="mb-2 h-40 w-full overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrl}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <h3
              className="text-lg font-semibold tracking-[-0.02em] text-slate-950 dark:text-[#f7f8f8]"
            >
              {title || t("unlockLink")}
            </h3>

            <p className="text-sm leading-6 text-slate-600 dark:text-[#8a8f98]">{subtitle ? `${subtitle} ` : t("completeActionsHint")}</p>

            {inputType === "snippet" && selectedSnippetData ? (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-left dark:border-white/10 dark:bg-[#010102]">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-white/10">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileCode2 className="size-4 shrink-0 text-slate-600 dark:text-[#8a8f98]" />
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-[#d0d6e0]">{selectedSnippetData.name}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-500 dark:text-[#62666d]">{formatSnippetSize(selectedSnippetData.content)}</span>
                </div>
                <div className="relative h-20 overflow-hidden px-3 py-2.5">
                  <pre className="select-none whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-600 blur-[3px] dark:text-[#8a8f98]">
                    {selectedSnippetData.content}
                  </pre>
                  <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-[1px] dark:bg-[#010102]/60">
                    <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-[#141516] dark:text-[#8a8f98]">
                      {t("snippetContentLocked")}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {actions.length > 0 && (
              <div className="space-y-2 w-full overflow-hidden">
                {actions.map((action) => {
                  const platform = socialPlatforms[action.platform];
                  const Icon = getActionIcon(action.platform, action.action);

              return (
  <div
    key={action.id}
    className={cn(
      "flex max-h-11 w-full items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-white transition-all",
      platform.color,
      action.isValid
        ? "opacity-100"
        : "cursor-not-allowed opacity-60 brightness-75",
    )}
  >
    {/* <span className=" text-white">
      <Icon className="size-4" />
    </span> */}
    <Icon className="size-4" />

    <span className="min-w-0 truncate text-sm font-medium">
      {getActionLabel(action.platform, action.action)}
    </span>

    <ExternalLink
      className={cn(
        "size-3.5 shrink-0",
        action.isValid ? "text-white/80" : "text-white/50",
      )}
    />
  </div>
);
                })}
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-[#8a8f98]">
              <span>{t("unlockProgress", { completed: 0, total: totalActions })}</span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#23252a]">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                style={{
                  width: "0%",
                }}
              />
            </div>

            <Button
              type="button"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-100 font-medium text-slate-400 shadow-none disabled:opacity-100 dark:border-white/10 dark:bg-[#18191a] dark:text-[#62666d]"
              disabled
            >
              <Lock />{inputType === "file" ? t("unlockFile") : inputType === "snippet" ? t("revealSnippet") : t("unlockLink")}
            </Button>

          </Card>
        </Card>
      </div>
    </div>

  )
}
