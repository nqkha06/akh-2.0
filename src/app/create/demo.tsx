"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  createLink,
  getFileDownloadUrl,
  getFiles,
  uploadFile,
  updateLink,
  type LinkDto,
  type ManagedFileDto,
} from "@/lib/api-client"
import {
  Link,
  FileImage,
  MessageCircle,
  MessageSquare,
  PlayCircle,
  Share2,
  Repeat2,
  ThumbsUp,
  UserPlus,
  Eye,
  UsersRound,
  Plus,
  Trash2,
  UploadCloud,
  ImageIcon,
  ArrowDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Clock,
  X,
  Loader2,
  Lock,
  Heart,
  type LucideIcon,
  Building2,
  Star,
  Download,
  Radio,
  Bell,
  StarIcon,
  ChevronsUpDown,
  ChevronsDown,
  ChevronsDownUp,
} from "lucide-react"

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

const socialPlatforms: Record<string, SocialPlatform> = {
  popular: {
    name: "Popular",
    icon: StarIcon,
    color: "bg-red-600",
    actions: [
      { id: "subscribe", label: "Subscribe to channel", requiresUrl: true, icon: UserPlus },
      { id: "subscribe-notifications", label: "Subscribe & turn on notifications", requiresUrl: true, icon: Bell },
      { id: "other-visit", label: "Visit website", requiresUrl: true, icon: Link },
      { id: "like", label: "Like a video", requiresUrl: true, icon: ThumbsUp },
      { id: "comment", label: "Comment on a video", requiresUrl: true, icon: MessageCircle },
      { id: "like-comment", label: "Like & comment on video", requiresUrl: true, icon: MessageCircle },
      { id: "watch", label: "Watch video", requiresUrl: true, icon: PlayCircle },
      { id: "tiktok-follow", label: "Follow user", requiresUrl: true, icon: UserPlus },

    ],
  },
  youtube: {
    name: "YouTube",
    icon: SiYoutube,
    color: "bg-red-600",
    actions: [
      { id: "subscribe", label: "Subscribe to channel", requiresUrl: true, icon: UserPlus },
      { id: "subscribe-notifications", label: "Subscribe & turn on notifications", requiresUrl: true, icon: Bell },
      { id: "like", label: "Like a video", requiresUrl: true, icon: ThumbsUp },
      { id: "comment", label: "Comment on a video", requiresUrl: true, icon: MessageCircle },
      { id: "like-comment", label: "Like & comment on video", requiresUrl: true, icon: MessageCircle },
      { id: "watch", label: "Watch video", requiresUrl: true, icon: PlayCircle },
    ],
  },

  twitter: {
    name: "X/Twitter",
    icon: SiX,
    color: "bg-black",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: UserPlus },
      { id: "like", label: "Like post", requiresUrl: true, icon: ThumbsUp },
      { id: "reply", label: "Reply to post", requiresUrl: true, icon: MessageSquare },
      { id: "repost", label: "Repost", requiresUrl: true, icon: Repeat2 },
    ],
  },

  instagram: {
    name: "Instagram",
    icon: SiInstagram,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: UserPlus },
      { id: "like", label: "Like user", requiresUrl: true, icon: Heart },
      { id: "comment", label: "Comment on post", requiresUrl: true, icon: MessageCircle },
    ],
  },

  tiktok: {
    name: "TikTok",
    icon: SiTiktok,
    color: "bg-black",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: UserPlus },
      { id: "like", label: "Like post", requiresUrl: true, icon: ThumbsUp },
      { id: "comment", label: "Comment on post", requiresUrl: true, icon: MessageCircle },
    ],
  },

  facebook: {
    name: "Facebook",
    icon: SiFacebook,
    color: "bg-blue-600",
    actions: [
      { id: "like-page", label: "Like page", requiresUrl: true, icon: ThumbsUp },
      { id: "like-post", label: "Like post", requiresUrl: true, icon: ThumbsUp },
      { id: "comment", label: "Comment on post", requiresUrl: true, icon: MessageCircle },
      { id: "share", label: "Share post", requiresUrl: true, icon: Share2 },
    ],
  },

  discord: {
    name: "Discord",
    icon: SiDiscord,
    color: "bg-indigo-600",
    actions: [
      { id: "join-server", label: "Join server", requiresUrl: true, icon: UsersRound },
    ],
  },

  telegram: {
    name: "Telegram",
    icon: SiTelegram,
    color: "bg-sky-500",
    actions: [
      { id: "join-channel", label: "Join channel", requiresUrl: true, icon: Radio },
    ],
  },

  spotify: {
    name: "Spotify",
    icon: SiSpotify,
    color: "bg-green-500",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: UserPlus },
      { id: "like-song", label: "Like song", requiresUrl: true, icon: Heart },
    ],
  },

  twitch: {
    name: "Twitch",
    icon: SiTwitch,
    color: "bg-purple-600",
    actions: [
      { id: "follow-streamer", label: "Follow streamer", requiresUrl: true, icon: UserPlus },
    ],
  },

  vimeo: {
    name: "Vimeo",
    icon: SiVimeo,
    color: "bg-sky-500",
    actions: [
      { id: "follow-creator", label: "Follow creator", requiresUrl: true, icon: UserPlus },
    ],
  },

  threads: {
    name: "Threads",
    icon: SiThreads,
    color: "bg-black",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: UserPlus },
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
      { id: "follow", label: "Follow user", requiresUrl: true, icon: UserPlus },
    ],
  },

  snapchat: {
    name: "Snapchat",
    icon: SiSnapchat,
    color: "bg-yellow-400",
    actions: [
      { id: "add-user", label: "Add user", requiresUrl: true, icon: UserPlus },
    ],
  },

  reddit: {
    name: "Reddit",
    icon: SiReddit,
    color: "bg-orange-600",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: UserPlus },
      { id: "upvote", label: "Upvote post", requiresUrl: true, icon: ThumbsUp },
    ],
  },

  whatsapp: {
    name: "WhatsApp",
    icon: SiWhatsapp,
    color: "bg-green-500",
    actions: [
      { id: "join-group", label: "Join group", requiresUrl: true, icon: UsersRound },
    ],
  },

  bluesky: {
    name: "Bluesky",
    icon: SiBluesky,
    color: "bg-sky-500",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: UserPlus },
    ],
  },

  soundcloud: {
    name: "SoundCloud",
    icon: SiSoundcloud,
    color: "bg-orange-500",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: UserPlus },
      { id: "like-track", label: "Like track", requiresUrl: true, icon: Heart },
      { id: "repost-track", label: "Repost track", requiresUrl: true, icon: Repeat2 },
    ],
  },

  deezer: {
    name: "Deezer",
    icon: SiDeezer,
    color: "bg-purple-600",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: UserPlus },
    ],
  },

  kick: {
    name: "Kick",
    icon: SiKick,
    color: "bg-lime-500",
    actions: [
      { id: "follow-streamer", label: "Follow streamer", requiresUrl: true, icon: UserPlus },
    ],
  },

  rumble: {
    name: "Rumble",
    icon: SiRumble,
    color: "bg-green-600",
    actions: [
      { id: "subscribe", label: "Subscribe to channel", requiresUrl: true, icon: UserPlus },
      { id: "like-video", label: "Like video", requiresUrl: true, icon: ThumbsUp },
    ],
  },

  roblox: {
    name: "Roblox",
    icon: SiRoblox,
    color: "bg-gray-900",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: UserPlus },
      { id: "join-group", label: "Join group", requiresUrl: true, icon: UsersRound },
      { id: "favorite-game", label: "Favorite game", requiresUrl: true, icon: Star },
      { id: "like-game", label: "Like game", requiresUrl: true, icon: ThumbsUp },
    ],
  },

  steam: {
    name: "Steam",
    icon: SiSteam,
    color: "bg-slate-800",
    actions: [
      { id: "follow-curator", label: "Follow curator", requiresUrl: true, icon: UserPlus },
      { id: "comment-profile", label: "Comment on profile", requiresUrl: true, icon: MessageCircle },
      { id: "join-group", label: "Join group", requiresUrl: true, icon: UsersRound },
    ],
  },

  behance: {
    name: "Behance",
    icon: SiBehance,
    color: "bg-blue-600",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: UserPlus },
    ],
  },

  dribbble: {
    name: "Dribbble",
    icon: SiDribbble,
    color: "bg-pink-500",
    actions: [
      { id: "follow-designer", label: "Follow designer", requiresUrl: true, icon: UserPlus },
      { id: "like-shot", label: "Like shot", requiresUrl: true, icon: Heart },
    ],
  },

  deviantart: {
    name: "DeviantArt",
    icon: SiDeviantart,
    color: "bg-green-600",
    actions: [
      { id: "watch-artist", label: "Watch artist", requiresUrl: true, icon: Eye },
      { id: "favorite-artwork", label: "Favorite artwork", requiresUrl: true, icon: Star },
    ],
  },

  appleMusic: {
    name: "Apple Music",
    icon: SiApplemusic,
    color: "bg-pink-500",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: UserPlus },
    ],
  },

  audiomack: {
    name: "Audiomack",
    icon: SiAudiomack,
    color: "bg-yellow-500",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: UserPlus },
      { id: "like-song", label: "Like song", requiresUrl: true, icon: Heart },
    ],
  },

  beatstars: {
    name: "BeatStars",
    icon: SiBeatstars,
    color: "bg-red-600",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: UserPlus },
    ],
  },

  bandcamp: {
    name: "Bandcamp",
    icon: SiBandcamp,
    color: "bg-sky-600",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: UserPlus },
    ],
  },

  tidal: {
    name: "Tidal",
    icon: SiTidal,
    color: "bg-black",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: UserPlus },
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
      { id: "view-page", label: "View page", requiresUrl: true, icon: Eye },
    ],
  },

  github: {
    name: "GitHub",
    icon: SiGithub,
    color: "bg-gray-900",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: UserPlus },
      { id: "star-repository", label: "Star repository", requiresUrl: true, icon: Star },
    ],
  },

  productHunt: {
    name: "Product Hunt",
    icon: SiProducthunt,
    color: "bg-orange-600",
    actions: [
      { id: "upvote-product", label: "Upvote product", requiresUrl: true, icon: ThumbsUp },
      { id: "follow-maker", label: "Follow maker", requiresUrl: true, icon: UserPlus },
    ],
  },

  googlePlay: {
    name: "Google Play Store",
    icon: SiGoogleplay,
    color: "bg-green-600",
    actions: [
      { id: "install-app", label: "Install app", requiresUrl: true, icon: Download },
    ],
  },

  appStore: {
    name: "iOS App Store",
    icon: SiAppstore,
    color: "bg-blue-600",
    actions: [
      { id: "install-app", label: "Install app", requiresUrl: true, icon: Download },
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

interface SocialAction {
  id: string
  platform: keyof typeof socialPlatforms
  action: string
  url: string
  isValid: boolean
}

function toPlatformKey(platform: string): keyof typeof socialPlatforms {
  return platform in socialPlatforms
    ? (platform as keyof typeof socialPlatforms)
    : "other"
}

const backgroundImages = [
  {
    id: "1",
    name: "Neon Flow",
    imageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "2",
    name: "Aurora Mist",
    imageUrl: "https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "3",
    name: "Cosmic Dust",
    imageUrl: "https://images.unsplash.com/photo-1465101178521-c1a9136a3f11?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "4",
    name: "Blue Mirage",
    imageUrl: "https://images.unsplash.com/photo-1505483531331-5095d1f4b0f5?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "5",
    name: "Glass Bloom",
    imageUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "6",
    name: "Chromatic Wave",
    imageUrl: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "7",
    name: "Prism Haze",
    imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "8",
    name: "Liquid Light",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "9",
    name: "Velvet Pulse",
    imageUrl: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "10",
    name: "Soft Glow",
    imageUrl: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "11",
    name: "Satin Wave",
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "12",
    name: "Inferno Bloom",
    imageUrl: "https://images.unsplash.com/photo-1518632642078-03f0d1f3a6b7?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "13",
    name: "Candy Cloud",
    imageUrl: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "14",
    name: "Golden Drift",
    imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "15",
    name: "Midnight Bloom",
    imageUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "16",
    name: "Desert Halo",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "17",
    name: "Tropical Echo",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  },
]

// Sample snippets data
const snippets = [
  { id: "1", name: "Welcome Message", content: "Welcome to our exclusive content!" },
  { id: "2", name: "Limited Offer", content: "Get 50% off on your first purchase" },
  { id: "3", name: "Newsletter Signup", content: "Subscribe to our newsletter for updates" },
  { id: "4", name: "Event Invitation", content: "You are invited to our upcoming event" },
  { id: "5", name: "Product Launch", content: "Check out our new product launch" },
  { id: "6", name: "Special Thanks", content: "Thank you for your support" },
]

export default function SocialLinksGenerator({
  embedded = false,
  initialLink,
  onSaved,
}: {
  embedded?: boolean
  initialLink?: LinkDto
  onSaved?: (link: LinkDto) => void
} = {}) {
  const actionIdRef = useRef(0)
  const [destinationUrl, setDestinationUrl] = useState("")
  const [title, setTitle] = useState("")
  const [inputType, setInputType] = useState<"url" | "file" | "snippet">("url")
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [selectedFileName, setSelectedFileName] = useState("")
  const [selectedFileSize, setSelectedFileSize] = useState("")
  const [selectedFileUrl, setSelectedFileUrl] = useState("")
  const [availableFiles, setAvailableFiles] = useState<ManagedFileDto[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)
  const [fileError, setFileError] = useState("")
  const [selectedSnippet, setSelectedSnippet] = useState<string>("")
  const [actions, setActions] = useState<SocialAction[]>([])
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set(["youtube"]))
  const [layoutOpen, setLayoutOpen] = useState(false)
  const [extraOptionsOpen, setExtraOptionsOpen] = useState(false)
  const [expiresOpen, setExpiresOpen] = useState(false)

  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>("")
  const [sameAsCoverImage, setSameAsCoverImage] = useState(false)

  // Effects state
  const [opacity, setOpacity] = useState(100)
  const [blur, setBlur] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [grayscale, setGrayscale] = useState(0)

  // Edit action state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingActionId, setEditingActionId] = useState<string | null>(null)

  // Action search & category filter
  const [actionSearch, setActionSearch] = useState("")
  const [actionCategory, setActionCategory] = useState<string>("all")

  // Extra options state
  const [subtitle, setSubtitle] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [customAlias, setCustomAlias] = useState("")

  // Expires state
  const [expiryEnabled, setExpiryEnabled] = useState(false)
  const [expiryType, setExpiryType] = useState<"date" | "clicks">("date")
  const [expiryDate, setExpiryDate] = useState("")
  const [maxClicks, setMaxClicks] = useState("")
  const [expiryTime, setExpiryTime] = useState("00:00")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [createdLink, setCreatedLink] = useState<LinkDto | null>(null)

  const loadAvailableFiles = useCallback(async () => {
    try {
      setFilesLoading(true)
      const response = await getFiles({ sort: "date", direction: "desc" })
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
    window.addEventListener("STU:file-created", handleFileCreated)

    return () => {
      window.removeEventListener("STU:file-created", handleFileCreated)
    }
  }, [loadAvailableFiles])

  const addAction = (platform: keyof typeof socialPlatforms, actionId: string) => {
    actionIdRef.current += 1
    const newAction: SocialAction = {
      id: `action-${actionIdRef.current}`,
      platform,
      action: actionId,
      url: "",
      isValid: false,
    }
    setActions([...actions, newAction])
    setIsActionModalOpen(false)
  }

  const updateActionUrl = (actionId: string, url: string) => {
    setActions(
      actions.map((action) =>
        action.id === actionId ? { ...action, url, isValid: url.length > 0 && isValidUrl(url) } : action,
      ),
    )
  }

  const removeAction = (actionId: string) => {
    setActions(actions.filter((action) => action.id !== actionId))
  }

  const getActionLabel = (platform: keyof typeof socialPlatforms, actionId: string) => {
    return socialPlatforms[platform].actions.find((a) => a.id === actionId)?.label || actionId
  }

  const getActionIcon = (platform: keyof typeof socialPlatforms, actionId: string) => {
    return socialPlatforms[platform].actions.find((action) => action.id === actionId)?.icon ?? socialPlatforms[platform].icon
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const togglePlatformExpanded = (platform: string) => {
    const newExpanded = new Set(expandedPlatforms)
    if (newExpanded.has(platform)) {
      newExpanded.delete(platform)
    } else {
      newExpanded.add(platform)
    }
    setExpandedPlatforms(newExpanded)
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
    setSelectedFileSize(file.sizeLabel)
    setSelectedFileUrl(getFileDownloadUrl(file))
    setIsFileDialogOpen(false)
  }

  const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      setFileUploading(true)
      const uploaded = await uploadFile(file)
      setAvailableFiles((current) => [uploaded, ...current])
      setSelectedFile(uploaded.id)
      setSelectedFileName(uploaded.name)
      setSelectedFileSize(uploaded.sizeLabel)
      setSelectedFileUrl(getFileDownloadUrl(uploaded))
      setIsFileDialogOpen(false)
      setFileError("")
      window.dispatchEvent(new CustomEvent("STU:file-created", { detail: uploaded }))
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Upload file thất bại.")
    } finally {
      setFileUploading(false)
      event.target.value = ""
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile("")
    setSelectedFileName("")
    setSelectedFileSize("")
    setSelectedFileUrl("")
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
  const isFileDestinationValid = selectedFile.length > 0 && selectedFileUrl.length > 0
  const isSnippetDestinationValid = selectedSnippet.length > 0
  const isDestinationValid =
    inputType === "url"
      ? isDestinationUrlValid
      : inputType === "file"
        ? isFileDestinationValid
        : isSnippetDestinationValid
  const isTitleValid = title.length > 0
  const completedActions = actions.filter((a) => a.isValid).length
  const totalActions = actions.length
  const allActionUrlsValid = totalActions > 0 && completedActions === totalActions
  const canCreateLink = isDestinationValid && isTitleValid && allActionUrlsValid
  const selectedBackground = backgroundImages.find((bg) => bg.id === selectedBackgroundId)

  // Derived data for action picker filtering
  const actionPlatformEntries = Object.entries(socialPlatforms)
  const actionCategories = [
    "all",
    ...Array.from(new Set(Object.values(socialPlatforms).map((platform) => platform.category || "Other"))),
  ]

  const filteredPlatforms = actionPlatformEntries
    .map(([key, platform]) => ({ key, platform }))
    .filter(({ platform }) => {
      if (actionCategory !== "all" && (platform.category || "Other") !== actionCategory) return false
      if (!actionSearch) return true
      const q = actionSearch.toLowerCase()
      if (platform.name.toLowerCase().includes(q)) return true
      return platform.actions.some((action) => action.label.toLowerCase().includes(q))
    })

  const buildCreatePayload = () => ({
    title,
    destinationUrl: inputType === "file" ? selectedFileUrl : destinationUrl,
    inputType,
    selectedSnippet: selectedSnippet || undefined,
    selectedFile: selectedFile || undefined,
    subtitle: subtitle || undefined,
    customAlias: customAlias || undefined,
    coverImageUrl: coverImageUrl || undefined,
    expiryEnabled,
    expiryType: expiryEnabled ? expiryType : undefined,
    expiryDate: expiryEnabled && expiryType === "date" ? expiryDate || undefined : undefined,
    expiryTime: expiryEnabled && expiryType === "date" ? expiryTime || undefined : undefined,
    maxClicks: expiryEnabled && expiryType === "clicks" && maxClicks ? Number(maxClicks) : undefined,
    actions: actions.map(a => ({
      platform: a.platform,
      action: a.action,
      url: a.url
    })),
    backgroundSettings: {
      selectedBackgroundId: selectedBackgroundId || undefined,
      selectedBackgroundName: backgroundImages.find((bg) => bg.id === selectedBackgroundId)?.name,
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
    if (!canCreateLink || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setSubmitError("")
    setCreatedLink(null)

    try {
      const link = await createLink(buildCreatePayload())
      setCreatedLink(link)
      window.dispatchEvent(
        new CustomEvent("Rekonise:link-created", {
          detail: link,
        }),
      )
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Create link failed")
    } finally {
      setIsSubmitting(false)
    }
  }
const isAllExpanded =
  expandedPlatforms.size === Object.keys(socialPlatforms).length;
  return (

    <div
      className={`${embedded ? "w-full" : "max-w-6xl mx-auto"} grid grid-cols-1 lg:grid-cols-2 gap-6`}
    >
      {/* Left Panel - Form */}
      <div className="space-y-6">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <Tabs value={inputType} onValueChange={(value) => setInputType(value as "url" | "file" | "snippet")} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                <TabsTrigger value="url" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <Link className="w-4 h-4 mr-2" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="file" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <FileImage className="w-4 h-4 mr-2" />
                  File
                </TabsTrigger>
                <TabsTrigger value="snippet" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <FileImage className="w-4 h-4 mr-2" />
                  Snippet
                </TabsTrigger>
              </TabsList>

              {/* URL Tab */}
              <TabsContent value="url" className="space-y-4 mt-4">
                <div>
                  <Input
                    placeholder="Enter a destination URL*"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className={`h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${destinationUrl.length > 0 && !isDestinationUrlValid ? "border-red-500" : ""
                      }`}
                  />
                  {destinationUrl.length > 0 && !isDestinationUrlValid && (
                    <p className="text-red-500 text-sm mt-1">Please enter a valid URL</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Enter a title*"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </TabsContent>

              {/* File Tab */}
              <TabsContent value="file" className="space-y-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFileDialogOpen(true)}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100"
                >
                  <FileImage className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <span className="text-gray-600 font-medium">
                    {selectedFileName ? "Change file" : "Select file"}
                  </span>
                </button>
                {selectedFileName && (
                  <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-green-700 ring-1 ring-green-200">
                      <FileImage className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-green-900">{selectedFileName}</p>
                      <p className="text-xs text-green-700">{selectedFileSize}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={clearSelectedFile}
                      className="text-green-700 hover:bg-green-100 hover:text-green-900"
                      aria-label="Clear selected file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div>
                  <Input
                    placeholder="Enter a title*"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </TabsContent>

              {/* Snippet Tab */}
              <TabsContent value="snippet" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100">
                    <FileImage className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <span className="text-gray-600 font-medium">Select snippet</span>
                  </button>
                  {selectedSnippet && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Selected: {snippets.find((s) => s.id === selectedSnippet)?.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Snippet List */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Available Snippets</label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {snippets.map((snippet) => (
                      <button
                        key={snippet.id}
                        onClick={() => setSelectedSnippet(snippet.id)}
                        className={`p-3 rounded-lg text-left transition-colors ${selectedSnippet === snippet.id
                          ? "bg-green-100 border-2 border-green-500 text-green-900"
                          : "bg-gray-50 border border-gray-200 text-gray-900 hover:border-gray-300"
                          }`}
                      >
                        <p className="font-medium text-sm">{snippet.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{snippet.content}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Input
                    placeholder="Enter a title*"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
          <DialogContent
            className="sm:max-w-5xl"
          >
            <DialogHeader>
              <DialogTitle>
                Select or upload file
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 overflow-y-auto">
              <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2">
                {fileUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {fileUploading ? "Uploading..." : "Upload file"}
                <input
                  type="file"
                  className="sr-only"
                  onChange={handleUploadFile}
                  disabled={fileUploading}
                />
              </label>

              {fileError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {fileError}
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-170 text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr className="border-b border-gray-200">
                        <th className="w-20 px-5 py-3 font-semibold">Type</th>
                        <th className="px-5 py-3 font-semibold">Name</th>
                        <th className="w-36 px-5 py-3 font-semibold">Size</th>
                        <th className="w-44 px-5 py-3 font-semibold">
                          <span className="inline-flex items-center gap-1">
                            Uploaded
                            <ArrowDown className="h-4 w-4" />
                          </span>
                        </th>
                        <th className="w-28 px-5 py-3 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filesLoading ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                            Loading files...
                          </td>
                        </tr>
                      ) : availableFiles.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                            No files yet. Upload one to use as destination.
                          </td>
                        </tr>
                      ) : (
                        availableFiles.map((file) => (
                          <tr
                            key={file.id}
                            className={`border-b border-gray-100 transition-colors last:border-b-0 ${selectedFile === file.id ? "bg-green-50" : "hover:bg-gray-50"
                              }`}
                          >
                            <td className="px-5 py-4">
                              <div className="flex h-9 w-12 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-500">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="max-w-105 truncate font-medium text-gray-900">
                                {file.name}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-gray-600">{file.sizeLabel}</td>
                            <td className="px-5 py-4 text-gray-600">
                              {new Intl.DateTimeFormat("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }).format(new Date(file.createdAt))}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => selectStoredFile(file)}
                                className="bg-green-600 text-white hover:bg-green-700"
                              >
                                Select
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span>Items per page:</span>
                    <button
                      type="button"
                      className="flex h-9 min-w-16 items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-gray-900"
                    >
                      10
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                  <span className="sm:ml-6">
                    {availableFiles.length > 0 ? `1 - ${availableFiles.length} of ${availableFiles.length}` : "0 of 0"}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Button type="button" variant="ghost" size="icon-sm" disabled>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFileDialogOpen(false)}
                className="h-10 px-4 font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Actions Section */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-gray-700">
              <Settings className="w-5 h-5" />
              <h3 className="font-semibold">ACTIONS</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {actions.map((action, index) => {
              const platform = socialPlatforms[action.platform]
              const Icon = getActionIcon(action.platform, action.action)
              return (
                <div key={action.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-gray-500">{index + 1}.</span>
                      <button
                        onClick={() => handleEditAction(action.id)}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg flex-1 transition-colors text-left"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{getActionLabel(action.platform, action.action)}</span>
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(action.id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <Input
                      placeholder={`Enter a ${platform.name.toLowerCase()} URL`}
                      value={action.url}
                      onChange={(e) => updateActionUrl(action.id, e.target.value)}
                      className={`h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${action.url.length > 0 && !action.isValid ? "border-red-500" : ""
                        }`}
                    />
                    {action.url.length > 0 && !action.isValid && (
                      <p className="text-red-500 text-sm mt-1">This input is invalid</p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Edit Action Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent
                className="[&>button]:hidden z-210 bg-white md:max-w-2xl border-gray-200 text-gray-900 max-w-md shadow-[0_18px_50px_rgba(15,23,42,0.22)]"
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    Change action
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={toggleExpandAllPlatforms}
                    >
                      {expandedPlatforms.size === Object.keys(socialPlatforms).length ? <ChevronsUpDown /> : <ChevronsDown/>}

                      {expandedPlatforms.size === Object.keys(socialPlatforms).length ? "Collapse all" : "Expand all"}
                    </Button>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(socialPlatforms).map(([key, platform]) => {
                    const Icon = platform.icon
                    const isExpanded = expandedPlatforms.has(key)
                    return (
                      <div key={key}>
                        <button
                          onClick={() => togglePlatformExpanded(key)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5" />
                            <span>{platform.name}</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 grid grid-cols-2 gap-2 px-3">
                            {platform.actions.map((action) => (
                              <Button
                                key={action.id}
                                onClick={() => handleChangeActionType(key as keyof typeof socialPlatforms, action.id)}
                                className={`${platform.color} hover:opacity-80 text-white text-sm`}
                                size="sm"
                              >
                                <Icon className="w-4 h-4 mr-1" />
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="w-full">
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
              <Button
                variant="ghost"
                className="h-11 w-full text-gray-600 hover:text-gray-900 border-dashed border-2 border-gray-300 hover:border-gray-400"
                onClick={() => setIsActionModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add action
              </Button>
              <DialogContent
                className="[&>button]:hidden z-210 bg-white border-gray-200 text-gray-900 md:max-w-2xl shadow-[0_18px_50px_rgba(15,23,42,0.22)]"
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    Select your action
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={toggleExpandAllPlatforms}
                    >
                      
                      {isAllExpanded ? (
                        <ChevronsDownUp className="size-5" strokeWidth={2.4} />
                      ) : (
                        <ChevronsUpDown className="size-5" strokeWidth={2.4} />
                      )}

                      {isAllExpanded ? "Collapse all" : "Expand all"}
                    </Button>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    <Input
                      placeholder="Search actions or platforms"
                      value={actionSearch}
                      onChange={(e) => setActionSearch(e.target.value)}
                      className="h-10"
                    />

                    <div className="flex gap-2 flex-wrap">
                      {actionCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActionCategory(cat)}
                          className={`px-3 py-1 rounded-full text-sm ${actionCategory === cat ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
                        >
                          {cat === "all" ? "All" : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* All Platforms */}
                  {filteredPlatforms.map(({ key, platform }) => {
                    const PlatformIcon = platform.icon
                    const isExpanded = expandedPlatforms.has(key)
                    return (
                      <div key={key}>
                        <button
                          onClick={() => togglePlatformExpanded(key)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <PlatformIcon className="w-5 h-5" />
                            <span>{platform.name} ({platform.actions.length})</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 grid grid-cols-2 gap-2 px-3">
                            {platform.actions.map((action) => (
                              <Button
                                key={action.id}
                                onClick={() => addAction(key as keyof typeof socialPlatforms, action.id)}
                                className={`${platform.color} hover:opacity-80 text-white text-sm`}
                                size="sm"
                              >
                                <action.icon className="w-4 h-4 mr-1" />
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsActionModalOpen(false)} className="w-full">
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Collapsible open={layoutOpen} onOpenChange={setLayoutOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-semibold">LAYOUT</span>
              </div>
              {layoutOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 bg-white border border-gray-200 rounded-lg mt-1 space-y-6">
              {/* Background Section */}
              <div>
                <h4 className="text-gray-700 font-medium mb-3">Background</h4>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (!coverImageUrl) return
                      setSameAsCoverImage(!sameAsCoverImage)
                    }}
                    disabled={!coverImageUrl}
                    aria-disabled={!coverImageUrl}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sameAsCoverImage ? "bg-green-600" : "bg-gray-300"} ${!coverImageUrl ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sameAsCoverImage ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                  <span className="text-gray-600">Same as cover image</span>
                </div>
              </div>

              {/* Gallery Section */}
              {!sameAsCoverImage && (

                <div>
                  <h4 className="text-gray-700 dark:text-gray-200 font-medium mb-3">Gallery</h4>
                  <Tabs defaultValue="images" className="w-full">
                    <TabsList variant="line">
                      <TabsTrigger value="images">Images</TabsTrigger>
                      <TabsTrigger value="videos">Videos</TabsTrigger>
                      <TabsTrigger value="my-files">My files</TabsTrigger>
                      <TabsTrigger value="embed">Embed YT</TabsTrigger>
                    </TabsList>

                    <TabsContent value="images">
                      <div className="rounded-lg border border-gray-200/40 dark:border-slate-800/40 bg-white/50 dark:bg-transparent p-3">
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {/* example category chips (optional) */}
                          <button className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-semibold">All</button>
                          <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-300">Texture</button>
                          <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-300">Geometric</button>
                          <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-300">Nature</button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-90 overflow-y-auto pr-2">
                          {backgroundImages.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => setSelectedBackgroundId(bg.id)}
                              title={bg.name}
                              className={`relative aspect-square w-full overflow-hidden rounded-xl transition-transform transform will-change-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400/60 ${selectedBackgroundId === bg.id
                                ? "ring-4 ring-green-500 shadow-[0_10px_30px_rgba(16,185,129,0.12)] scale-100"
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
                  </Tabs>

                </div>
              )}

              {/* Effects Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-gray-700 font-medium">Effects</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700 text-xs h-6"
                    onClick={resetEffects}
                  >
                    Reset
                  </Button>
                </div>

                {/* Opacity Slider */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600">Opacity</label>
                      <span className="text-sm text-gray-600">{opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                  </div>

                  {/* Blur Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600">Blur</label>
                      <span className="text-sm text-gray-600">{blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={blur}
                      onChange={(e) => setBlur(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                  </div>

                  {/* Saturation Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600">Saturation</label>
                      <span className="text-sm text-gray-600">{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                  </div>

                  {/* Contrast Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600">Contrast</label>
                      <span className="text-sm text-gray-600">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                  </div>

                  {/* Grayscale Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600">Grayscale</label>
                      <span className="text-sm text-gray-600">{grayscale}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={grayscale}
                      onChange={(e) => setGrayscale(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={extraOptionsOpen} onOpenChange={setExtraOptionsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-semibold">EXTRA OPTIONS</span>
              </div>
              {extraOptionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 bg-white border border-gray-200 rounded-lg mt-1 space-y-4">
              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <Input
                  placeholder="Enter subtitle (optional)"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="h-11 border-gray-200"
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                <div className="space-y-2">
                  {coverImageUrl && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={coverImageUrl}
                        alt="Cover"
                        width={1200}
                        height={800}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setCoverImageUrl("")}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {coverImageUrl ? "Change image" : "Upload cover image"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setCoverImageUrl(event.target?.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Custom Alias */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Alias</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3">
                    <span className="text-gray-600 text-sm">yoursite.com/</span>
                    <Input
                      placeholder="custom-alias"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      className="h-11 border-0 bg-transparent text-sm"
                    />
                  </div>
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
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-semibold">EXPIRES</span>
              </div>
              {expiresOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 bg-white border border-gray-200 rounded-lg mt-1 space-y-4">
              {/* Enable Expiry Toggle */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setExpiryEnabled(!expiryEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${expiryEnabled ? "bg-green-600" : "bg-gray-300"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${expiryEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
                <span className="text-gray-600">Enable link expiration</span>
              </div>

              {expiryEnabled && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* Expiry Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpiryType("date")}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${expiryType === "date"
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                      >
                        By Date
                      </button>
                      <button
                        onClick={() => setExpiryType("clicks")}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${expiryType === "clicks"
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                      >
                        By Clicks
                      </button>
                    </div>
                  </div>

                  {/* Date & Time Expiry */}
                  {expiryType === "date" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <Input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="h-11 border-gray-200"
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Time</label>
                        <Input
                          type="time"
                          value={expiryTime}
                          onChange={(e) => setExpiryTime(e.target.value)}
                          className="h-11 border-gray-200"
                        />
                      </div>
                      {expiryDate && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            Link will expire on {new Date(expiryDate).toLocaleDateString()} at {expiryTime}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clicks Limit Expiry */}
                  {expiryType === "clicks" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Clicks</label>
                        <Input
                          type="number"
                          placeholder="e.g., 100"
                          value={maxClicks}
                          onChange={(e) => setMaxClicks(e.target.value)}
                          className="h-11 border-gray-200"
                          min="1"
                        />
                      </div>
                      {maxClicks && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            Link will expire after {maxClicks} clicks
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-700">PREVIEW</h2>

          <Button
            className={`h-11 text-white ${canCreateLink ? "bg-gray-900 hover:bg-gray-800" : "bg-gray-300"
              }`}
            disabled={!canCreateLink || isSubmitting}
            onClick={handleCreateLink}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>

        <Card className="relative z-10 overflow-hidden rounded-2xl p-7">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: "white",
              backgroundImage: sameAsCoverImage
                ? coverImageUrl
                  ? `url(${coverImageUrl})`
                  : "linear-gradient(135deg, #f8f9fa, #e9ecef)"
                : selectedBackground?.imageUrl
                  ? `url(${selectedBackground.imageUrl})`
                  : "none",
              backgroundSize:
                (sameAsCoverImage && coverImageUrl) || selectedBackground?.imageUrl ? "cover" : "auto",
              backgroundPosition:
                (sameAsCoverImage && coverImageUrl) || selectedBackground?.imageUrl ? "center" : "initial",
              backgroundRepeat: "no-repeat",
              filter: `opacity(${opacity / 100}) blur(${blur}px) saturate(${saturation / 100}) contrast(${contrast / 100}) grayscale(${grayscale / 100})`,
            }}
          />

          <Card className="relative gap-2 overflow-hidden rounded-2xl border border-white/30 bg-white/55 p-6 text-center shadow-xl backdrop-blur-md">
            {coverImageUrl && (
              <div className="mb-2 h-40 w-full overflow-hidden rounded-lg">
                <Image
                  src={coverImageUrl}
                  alt="Cover"
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <h3
              className={
                title
                  ? "text-xl font-semibold text-gray-900"
                  : "text-base font-normal text-gray-500"
              }
            >
              {title || "Unlock link"}
            </h3>

            <p className="text-gray-600">{subtitle ? `${subtitle} ` : 'Complete the actions to unlock'}</p>

            {actions.length > 0 && (
              <div className="space-y-3">
                {actions.map((action) => {
                  const platform = socialPlatforms[action.platform];
                  const Icon = getActionIcon(action.platform, action.action);

                  return (
                    <Button
                      key={action.id}
                      className={`w-full ${platform.color} text-white hover:opacity-80`}
                      disabled={!action.isValid}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {getActionLabel(action.platform, action.action)}
                    </Button>
                  );
                })}
              </div>
            )}

            <div className="text-sm text-gray-500">
              unlock progress {completedActions}/{totalActions}
            </div>

            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-green-500 transition-all duration-300"
                style={{
                  width:
                    totalActions > 0
                      ? `${(completedActions / totalActions) * 100}%`
                      : "0%",
                }}
              />
            </div>

            <Button
              className={`h-11 w-full text-white ${isDestinationValid
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-300"
                }`}
              disabled={!isDestinationValid}
              onClick={() => {
                if (!isDestinationValid) return;

                window.open(inputType === "file" ? selectedFileUrl : destinationUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <Lock />{inputType === "file" ? "Unlock file" : "Unlock link"}
            </Button>

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {submitError}
              </div>
            )}

            {createdLink && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-left text-sm text-green-800">
                <p className="font-semibold">Link created successfully</p>

                <a
                  href={`/l/${createdLink.slug}`}
                  className="mt-1 block break-all font-medium text-green-700 underline underline-offset-4"
                >
                  /l/{createdLink.slug}
                </a>
              </div>
            )}

            {!canCreateLink && (
              <div className="space-y-1 text-sm text-gray-500">
                {!isTitleValid && <p>• Title is required</p>}
                {inputType === "url" && !isDestinationUrlValid && <p>• Valid destination URL is required</p>}
                {inputType === "file" && !isFileDestinationValid && <p>• Select a destination file</p>}
                {inputType === "snippet" && !isSnippetDestinationValid && <p>• Select a snippet</p>}
                {totalActions === 0 && <p>• At least one action is required</p>}
                {totalActions > 0 && completedActions < totalActions && (
                  <p>• Complete all actions</p>
                )}
              </div>
            )}
          </Card>
        </Card>
      </div>
    </div>

  )
}
