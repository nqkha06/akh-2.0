"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FilePickerCredenza } from "@/components/file-picker-credenza"
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
  COVER_IMAGE_MAX_SIZE,
  formatSnippetSize,
  getYouTubeEmbedUrl,
  isImageFile,
  isVideoFile,
} from "../lib/media"
import {
  checkLinkAliasAvailability,
  createSnippet,
  createLink,
  getFileDownloadUrl,
  getFilePreviewUrl,
  getFiles,
  getSnippets,
  uploadFile,
  updateLink,
  type LinkDto,
  type ManagedFileDto,
  type SnippetDto,
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
  ChevronDown,
  ChevronUp,
  Settings,
  Clock,
  X,
  Check,
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

const baseSocialPlatforms: Record<string, SocialPlatform> = {
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

const socialPlatforms: Record<string, SocialPlatform> = Object.fromEntries(
  Object.entries(baseSocialPlatforms).map(([key, platform]) => [
    key,
    { ...platform, category: platformCategories[key] ?? "Other" },
  ]),
)

interface SocialAction {
  id: string
  platform: keyof typeof socialPlatforms
  action: string
  url: string
  isValid: boolean
}

type AliasCheckStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error"

function toPlatformKey(platform: string): keyof typeof socialPlatforms {
  return platform in socialPlatforms
    ? (platform as keyof typeof socialPlatforms)
    : "other"
}

function isValidUrl(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
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
  {
    id: "18",
    name: "Creator Desk",
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "19",
    name: "Glass Geometry",
    imageUrl: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "20",
    name: "Aurora Gradient",
    imageUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "21",
    name: "Minimal Studio",
    imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "22",
    name: "Digital Workspace",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
  },
]

type BackgroundMediaType = "image" | "video" | "youtube"

const backgroundImageCategoryMap: Record<string, string[]> = {
  "1": ["Abstract", "Gradient"],
  "2": ["Gradient", "Nature"],
  "3": ["Abstract", "Tech"],
  "4": ["Abstract", "Gradient"],
  "5": ["Texture", "Abstract"],
  "6": ["Gradient", "Abstract"],
  "7": ["Abstract", "Geometric"],
  "8": ["Gradient", "Tech"],
  "9": ["Texture", "Abstract"],
  "10": ["Gradient", "Minimal"],
  "11": ["Abstract", "Texture"],
  "12": ["Abstract", "Gradient"],
  "13": ["Gradient", "Texture"],
  "14": ["Nature", "Texture"],
  "15": ["Nature", "Abstract"],
  "16": ["Nature", "Minimal"],
  "17": ["Nature"],
  "18": ["Creator", "Workspace"],
  "19": ["Geometric", "Professional"],
  "20": ["Gradient", "Abstract"],
  "21": ["Workspace", "Professional"],
  "22": ["Tech", "Workspace"],
}

const backgroundVideos = [
  {
    id: "coverr-ai-gradient",
    name: "Soft AI Gradient",
    source: "Coverr",
    sourceUrl: "https://coverr.co/stock-video-footage/abstract",
    videoUrl: "https://cdn.coverr.co/videos/user-ai-generation-kv9zE4fNgqFS/1080p.mp4",
    categories: ["Abstract", "Gradient"],
  },
  {
    id: "coverr-luminous-flow",
    name: "Luminous Flow",
    source: "Coverr",
    sourceUrl: "https://coverr.co/stock-video-footage/abstract",
    videoUrl: "https://cdn.coverr.co/videos/user-ai-generation-VlzTMEbjgVkr/1080p.mp4",
    categories: ["Abstract", "Gradient"],
  },
  {
    id: "coverr-mountain-focus",
    name: "Creator Journey",
    source: "Coverr",
    sourceUrl: "https://coverr.co/stock-video-footage/background",
    videoUrl: "https://cdn.coverr.co/videos/coverr-walking-to-the-mountain-top-8360/1080p.mp4",
    categories: ["Creator", "Nature"],
  },
  {
    id: "coverr-water-calm",
    name: "Calm Reflection",
    source: "Coverr",
    sourceUrl: "https://coverr.co/stock-video-footage/background",
    videoUrl: "https://cdn.coverr.co/videos/coverr-tree-reflection-in-the-water-8825/360p.mp4",
    categories: ["Nature", "Minimal"],
  },
  {
    id: "coverr-phone-focus",
    name: "Mobile Creator",
    source: "Coverr",
    sourceUrl: "https://coverr.co/stock-video-footage/technology",
    videoUrl: "https://cdn.coverr.co/videos/coverr-close-up-of-man-using-iphone-15/360p.mp4",
    categories: ["Tech", "Creator"],
  },
  {
    id: "coverr-industrial-grid",
    name: "Grid Reflection",
    source: "Coverr",
    sourceUrl: "https://coverr.co/stock-video-footage/industrial",
    videoUrl: "https://cdn.coverr.co/videos/coverr-river-viewed-through-a-square-grid-6554/1080p.mp4",
    categories: ["Geometric", "Texture"],
  },
  {
    id: "coverr-studio-phone",
    name: "Studio Tech",
    source: "Coverr",
    sourceUrl: "https://coverr.co/stock-video-footage/technology",
    videoUrl: "https://cdn.coverr.co/videos/coverr-close-up-of-iphone-15/360p.mp4",
    categories: ["Tech", "Professional"],
  },
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
  const t = useTranslations("CreateLink")
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
  const [selectedFileName, setSelectedFileName] = useState(initialLink?.selectedFile || "")
  const [selectedFileUrl, setSelectedFileUrl] = useState(initialInputType === "file" ? initialLink?.destinationUrl || "" : "")
  const [availableFiles, setAvailableFiles] = useState<ManagedFileDto[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)
  const [coverImageUploading, setCoverImageUploading] = useState(false)
  const [fileError, setFileError] = useState("")
  const [coverFileError, setCoverFileError] = useState("")
  const [snippets, setSnippets] = useState<SnippetDto[]>([])
  const [snippetsLoading, setSnippetsLoading] = useState(false)
  const [selectedSnippet, setSelectedSnippet] = useState<string>(initialLink?.selectedSnippet || "")
  const [snippetDraftId, setSnippetDraftId] = useState<string>(initialLink?.selectedSnippet || "")
  const [isSnippetDialogOpen, setIsSnippetDialogOpen] = useState(false)
  const [isCoverImageDialogOpen, setIsCoverImageDialogOpen] = useState(false)
  const [snippetDialogTab, setSnippetDialogTab] = useState<"existing" | "create">("existing")
  const [newSnippetName, setNewSnippetName] = useState("")
  const [newSnippetContent, setNewSnippetContent] = useState("")
  const [actions, setActions] = useState<SocialAction[]>(initialActions)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set(["youtube"]))
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [createdLink, setCreatedLink] = useState<LinkDto | null>(null)
  const isEditing = Boolean(initialLink)

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

  useEffect(() => {
    let mounted = true

    async function loadSnippets() {
      try {
        setSnippetsLoading(true)
        const data = await getSnippets()
        if (mounted) setSnippets(data)
      } catch (error) {
        if (mounted) toast.error(error instanceof Error ? error.message : t("snippetLoadFailed"))
      } finally {
        if (mounted) setSnippetsLoading(false)
      }
    }

    void loadSnippets()
    return () => {
      mounted = false
    }
  }, [t])

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
    const fallback = socialPlatforms[platform].actions.find((a) => a.id === actionId)?.label || actionId
    return t.has(`actionLabels.${actionId}`) ? t(`actionLabels.${actionId}`) : fallback
  }

  const getActionIcon = (platform: keyof typeof socialPlatforms, actionId: string) => {
    return socialPlatforms[platform].actions.find((action) => action.id === actionId)?.icon ?? socialPlatforms[platform].icon
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
    setSelectedFileUrl(getFileDownloadUrl(file))
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

  const handleCoverUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || ""

    if (!file.type.startsWith("image/") && !COVER_IMAGE_EXTENSIONS.includes(extension)) {
      setCoverFileError(t("coverMustImage"))
      event.target.value = ""
      return
    }

    if (file.size > COVER_IMAGE_MAX_SIZE) {
      setCoverFileError(t("coverMaxSize"))
      event.target.value = ""
      return
    }

    try {
      setCoverImageUploading(true)
      const uploaded = await uploadFile(file, { purpose: "cover" })
      setAvailableFiles((current) => [uploaded, ...current])
      setCoverImageUrl(getFilePreviewUrl(uploaded))
      setCoverFileError("")
      setIsCoverImageDialogOpen(false)
      window.dispatchEvent(new CustomEvent("STU:file-created", { detail: uploaded }))
    } catch (error) {
      setCoverFileError(error instanceof Error ? error.message : t("uploadCoverFailed"))
    } finally {
      setCoverImageUploading(false)
      event.target.value = ""
    }
  }

  const openSnippetDialog = () => {
    setSnippetDraftId(selectedSnippet)
    setSnippetDialogTab("existing")
    setIsSnippetDialogOpen(true)
  }

  const useExistingSnippet = () => {
    if (!snippetDraftId) {
      return
    }

    setSelectedSnippet(snippetDraftId)
    setIsSnippetDialogOpen(false)
  }

  const createAndUseSnippet = async () => {
    const content = newSnippetContent.trim()
    const name = newSnippetName.trim() || content.slice(0, 36) || "Untitled snippet"

    if (!content) {
      return
    }

    try {
      const snippet = await createSnippet({ name, content })
      setSnippets((current) => [snippet, ...current])
      setSelectedSnippet(snippet.id)
      setSnippetDraftId(snippet.id)
      setNewSnippetName("")
      setNewSnippetContent("")
      setIsSnippetDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("snippetCreateFailed"))
    }
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
      setSelectedFileUrl(getFileDownloadUrl(uploaded))
      setIsFileDialogOpen(false)
      setFileError("")
      window.dispatchEvent(new CustomEvent("STU:file-created", { detail: uploaded }))
    } catch (error) {
      setFileError(error instanceof Error ? error.message : t("uploadFileFailed"))
    } finally {
      setFileUploading(false)
      event.target.value = ""
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile("")
    setSelectedFileName("")
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
  const selectedSnippetData = snippets.find((snippet) => snippet.id === selectedSnippet)
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
    ...Array.from(new Set(Object.values(backgroundImageCategoryMap).flat())).sort(),
  ]
  const backgroundVideoCategories = [
    "All",
    ...Array.from(new Set(backgroundVideos.flatMap((video) => video.categories))).sort(),
  ]
  const filteredBackgroundImages = backgroundImages.filter((background) => (
    backgroundImageCategory === "All" ||
    backgroundImageCategoryMap[background.id]?.includes(backgroundImageCategory)
  ))
  const filteredBackgroundVideos = backgroundVideos.filter((video) => (
    backgroundVideoCategory === "All" || video.categories.includes(backgroundVideoCategory)
  ))

  // Derived data for action picker filtering
  const actionPlatformEntries = Object.entries(socialPlatforms)
  const filteredPlatforms = actionPlatformEntries
    .map(([key, platform]) => ({ key, platform }))
    .filter(({ platform }) => {
      if (actionCategory !== "all" && (platform.category || "Other") !== actionCategory) return false
      if (!actionSearch) return true
      const q = actionSearch.toLowerCase()
      if (platform.name.toLowerCase().includes(q)) return true
      return platform.actions.some((action) => action.label.toLowerCase().includes(q))
    })

  const selectedBackgroundName =
    backgroundMediaType === "video"
      ? backgroundVideos.find((bg) => bg.id === selectedBackgroundId)?.name
      : backgroundMediaType === "youtube"
        ? "YouTube video"
        : selectedBackgroundId.startsWith("file:")
          ? backgroundFileMedia.find((file) => `file:${file.id}` === selectedBackgroundId)?.name
          : backgroundImages.find((bg) => bg.id === selectedBackgroundId)?.name

  const buildCreatePayload = () => ({
    title,
    destinationUrl:
      inputType === "file"
        ? selectedFileUrl
        : inputType === "snippet"
          ? ""
          : destinationUrl,
    inputType,
    selectedSnippet: selectedSnippet || undefined,
    selectedFile: selectedFile || undefined,
    subtitle: subtitle || undefined,
    customAlias: !isEditing && customAlias ? customAlias : undefined,
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
    if (!canCreateLink || isSubmitting) {
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
        new CustomEvent("Rekonise:link-created", {
          detail: link,
        }),
      )
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("createFailed"))
    } finally {
      setIsSubmitting(false)
    }
  }
  const isAllExpanded =
    expandedPlatforms.size === Object.keys(socialPlatforms).length;
  return (

    <div
      className={`${embedded ? "w-full" : "max-w-6xl mx-auto"} grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`}
    >
      {/* Left Panel - Form */}
      <div className="min-w-0 space-y-6">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="space-y-4">

            <Tabs
              value={inputType}
              onValueChange={(value) =>
                setInputType(value as "url" | "file" | "snippet")
              }
              className="w-full min-w-0 !gap-0"
            >
              <TabsList className="!grid !h-12 !w-full !min-w-0 !grid-cols-3 !items-stretch !justify-stretch gap-1 overflow-hidden rounded-xl bg-slate-100 p-1">
                <TabsTrigger
                  value="url"
                  className="!m-0 !flex !h-10 !w-auto !min-w-0 !flex-none !items-center !justify-center gap-2 !rounded-lg !border-0 !px-2 !py-0 text-sm font-medium text-slate-500 !shadow-none transition-colors [&::after]:!hidden hover:bg-transparent hover:text-slate-900 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0 data-[state=active]:!bg-slate-950 data-[state=active]:!text-white data-[state=active]:!shadow-none"
                >
                  <Link className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{t("tabs.url")}</span>
                </TabsTrigger>

                <TabsTrigger
                  value="file"
                  className="!m-0 !flex !h-10 !w-auto !min-w-0 !flex-none !items-center !justify-center gap-2 !rounded-lg !border-0 !px-2 !py-0 text-sm font-medium text-slate-500 !shadow-none transition-colors [&::after]:!hidden hover:bg-transparent hover:text-slate-900 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0 data-[state=active]:!bg-slate-950 data-[state=active]:!text-white data-[state=active]:!shadow-none"
                >
                  <FileImage className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{t("tabs.file")}</span>
                </TabsTrigger>

                <TabsTrigger
                  value="snippet"
                  className="!m-0 !flex !h-10 !w-auto !min-w-0 !flex-none !items-center !justify-center gap-2 !rounded-lg !border-0 !px-2 !py-0 text-sm font-medium text-slate-500 !shadow-none transition-colors [&::after]:!hidden hover:bg-transparent hover:text-slate-900 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0 data-[state=active]:!bg-slate-950 data-[state=active]:!text-white data-[state=active]:!shadow-none"
                >
                  <MessageSquare className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{t("tabs.snippet")}</span>
                </TabsTrigger>
              </TabsList>




              {/* URL Tab */}
              <TabsContent value="url" className="space-y-4 mt-4">
                <div>
                  <Input
                    placeholder={t("destinationUrlPlaceholder")}
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className={`h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${destinationUrl.length > 0 && !isDestinationUrlValid ? "border-red-500" : ""
                      }`}
                  />
                  {destinationUrl.length > 0 && !isDestinationUrlValid && (
                    <p className="text-red-500 text-sm mt-1">{t("invalidUrl")}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder={t("titlePlaceholder")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </TabsContent>

              {/* File Tab */}
              <TabsContent value="file" className="space-y-4 mt-4">
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFileDialogOpen(true)}
                    className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-left text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                      <FileImage className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">
                        {selectedFileName ? t("fileSelected") : t("selectFile")}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-gray-500">
                        {selectedFileName
                          ? selectedFileName
                          : t("fileHint")}
                      </span>
                    </span>
                    {selectedFileName && (
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
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                </div>
                <div>
                  <Input
                    placeholder={t("titlePlaceholder")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </TabsContent>

              {/* Snippet Tab */}
              <TabsContent value="snippet" className="space-y-4 mt-4">
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={openSnippetDialog}
                    className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-left text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                      <MessageSquare className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">
                        {selectedSnippetData ? t("snippetSelected") : t("selectSnippet")}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-gray-500">
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
                          setSnippetDraftId("")
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            event.stopPropagation()
                            setSelectedSnippet("")
                            setSnippetDraftId("")
                          }
                        }}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                </div>

                <div>
                  <Input
                    placeholder={t("titlePlaceholder")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
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
          files={availableFiles}
          isLoading={filesLoading}
          error={fileError}
          selectedFileId={selectedFile}
          onSelect={selectStoredFile}
          upload={{
            isUploading: fileUploading,
            label: t("uploadNewFile"),
            uploadingLabel: t("uploading"),
            onChange: handleUploadFile,
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
          }}
        />

        <FilePickerCredenza
          open={isCoverImageDialogOpen}
          onOpenChange={setIsCoverImageDialogOpen}
          title={t("coverDialogTitle")}
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
          }}
        />

        <Credenza open={isSnippetDialogOpen} onOpenChange={setIsSnippetDialogOpen}>
          <CredenzaContent >
            <CredenzaHeader>
              <CredenzaTitle>{t("snippetDialogTitle")}</CredenzaTitle>
            </CredenzaHeader>

            <CredenzaBody>
            <Tabs
              value={snippetDialogTab}
              onValueChange={(value) => setSnippetDialogTab(value as "existing" | "create")}
              className="min-h-96 w-full"
            >
              <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
                <TabsTrigger
                  value="existing"
                  className="min-h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
                >
                  {t("useExisting")}
                </TabsTrigger>
                <TabsTrigger
                  value="create"
                  className="min-h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
                >
                  {t("createNew")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="mt-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-3 text-gray-900 shadow-sm">
                  <div className="mb-3 grid grid-cols-1 gap-2 text-xs uppercase tracking-wide text-gray-500 sm:grid-cols-[minmax(0,1.7fr)_auto_auto_auto] sm:px-2">
                    <span>{t("preview")}</span>
                    <span className="hidden sm:block">{t("size")}</span>
                    <span className="hidden sm:block">{t("copies")}</span>
                    <span className="hidden sm:block">{t("created")}</span>
                  </div>

                  <div className="max-h-[50vh] overflow-y-auto rounded-xl">
                    <div className="divide-y divide-white/5">
                      {snippetsLoading ? (
                        <div className="px-3 py-8 text-center text-sm text-gray-500">
                          {t("loading")}
                        </div>
                      ) : snippets.length === 0 ? (
                        <div className="px-3 py-8 text-center text-sm text-gray-500">
                          {t("snippetHint")}
                        </div>
                      ) : snippets.map((snippet) => {
                        const selected = snippetDraftId === snippet.id

                        return (
                          <button
                            key={snippet.id}
                            type="button"
                            onClick={() => setSnippetDraftId(snippet.id)}
                            className={`grid w-full grid-cols-1 gap-3 px-3 py-4 text-left transition sm:grid-cols-[minmax(0,1.7fr)_auto_auto_auto] sm:items-center sm:gap-4 ${selected ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-gray-50"
                              }`}
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${selected ? "bg-emerald-500" : "bg-gray-300"}`} />
                              <div className="min-w-0">
                                <p className="truncate font-mono text-xs text-gray-900">
                                  {snippet.content}
                                </p>
                                <p className="mt-1 text-xs font-medium text-gray-500">
                                  {snippet.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 sm:text-xs">
                              <span className="sm:hidden text-gray-500">{t("size")}: </span>
                              {formatSnippetSize(snippet.content)}
                            </div>
                            <div className="text-sm text-gray-600 sm:text-xs">
                              <span className="sm:hidden text-gray-500">{t("copies")}: </span>
                              {snippet.copies}
                            </div>
                            <div className="text-sm text-gray-600 sm:text-xs">
                              <span className="sm:hidden text-gray-500">{t("created")}: </span>
                              {new Intl.DateTimeFormat("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }).format(new Date(snippet.createdAt))}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="create" className="mt-4">
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      {t("snippetName")}
                    </label>
                    <Input
                      value={newSnippetName}
                      onChange={(event) => setNewSnippetName(event.target.value)}
                      placeholder={t("snippetNamePlaceholder")}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      {t("codeOrText")}
                    </label>
                    <Textarea
                      value={newSnippetContent}
                      onChange={(event) => setNewSnippetContent(event.target.value)}
                      placeholder={t("snippetContentPlaceholder")}
                      className="min-h-48 resize-y font-mono text-sm"
                    />
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      Size: {formatSnippetSize(newSnippetContent)}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            </CredenzaBody>

            <CredenzaFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSnippetDialogOpen(false)}
                className="h-10 px-4 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              >
                {t("cancel")}
              </Button>
              {snippetDialogTab === "existing" ? (
                <Button
                  type="button"
                  onClick={useExistingSnippet}
                  disabled={!snippetDraftId}
                  className="h-10 bg-slate-950 px-4 font-bold text-white hover:bg-slate-800"
                >
                  {t("useSnippet")}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={createAndUseSnippet}
                  disabled={!newSnippetContent.trim()}
                  className="h-10 bg-slate-950 px-4 font-bold text-white hover:bg-slate-800"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("createAndUse")}
                </Button>
              )}
            </CredenzaFooter>
          </CredenzaContent>
        </Credenza>

        {/* Actions Section */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-gray-700">
              <Settings className="w-5 h-5" />
              <h3 className="font-semibold">{t("actions")}</h3>
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
                      placeholder={t("enterPlatformUrl", { platform: platform.name.toLowerCase() })}
                      value={action.url}
                      onChange={(e) => updateActionUrl(action.id, e.target.value)}
                      className={`h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${action.url.length > 0 && !action.isValid ? "border-red-500" : ""
                        }`}
                    />
                    {action.url.length > 0 && !action.isValid && (
                      <p className="text-red-500 text-sm mt-1">{t("invalidInput")}</p>
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
                      className="text-gray-500 hover:text-gray-700"
                      onClick={toggleExpandAllPlatforms}
                    >
                      {expandedPlatforms.size === Object.keys(socialPlatforms).length ? <ChevronsUpDown /> : <ChevronsDown />}

                      {expandedPlatforms.size === Object.keys(socialPlatforms).length ? t("collapseAll") : t("expandAll")}
                    </Button>
                  </CredenzaTitle>
                </CredenzaHeader>
                <CredenzaBody className="space-y-3 max-h-[65dvh]">
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
                className="h-11 w-full text-gray-600 hover:text-gray-900 border-dashed border-2 border-gray-300 hover:border-gray-400"
                onClick={() => setIsActionModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add action
              </Button>
              <CredenzaContent>
                <CredenzaHeader>
                  <CredenzaTitle className="flex items-center justify-between">
                    {t("selectAction")}
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
                          className={`px-3 py-1 rounded-full text-sm ${actionCategory === cat ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
                        >
                          {cat === "all" ? t("all") : cat}
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
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Collapsible open={layoutOpen} onOpenChange={setLayoutOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-semibold">{t("layout")}</span>
              </div>
              {layoutOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 bg-white border border-gray-200 rounded-lg mt-1 space-y-6">
              {/* Background Section */}
              <div>
                <h4 className="text-gray-700 font-medium mb-3">{t("background")}</h4>
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
                  <span className="text-gray-600">{t("sameAsCover")}</span>
                </div>
              </div>

              {/* Gallery Section */}
              {!sameAsCoverImage && (

                <div>
                  <h4 className="text-gray-700 dark:text-gray-200 font-medium mb-3">{t("gallery")}</h4>
                  <Tabs defaultValue="images" className="w-full">
                    <TabsList variant="line">
                      <TabsTrigger value="images">{t("images")}</TabsTrigger>
                      <TabsTrigger value="videos">{t("videos")}</TabsTrigger>
                      <TabsTrigger value="my-files">{t("myFiles")}</TabsTrigger>
                      <TabsTrigger value="embed">{t("embedYoutube")}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="images">
                      <div className="rounded-lg border border-gray-200/40 dark:border-slate-800/40 bg-white/50 dark:bg-transparent p-3">
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {backgroundImageCategories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setBackgroundImageCategory(category)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${backgroundImageCategory === category
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300"
                                }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>

                        <div className="mb-3 text-xs font-medium text-gray-500">
                          {t("imageCountShort", { count: filteredBackgroundImages.length })}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-90 overflow-y-auto pr-2">
                          {filteredBackgroundImages.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => selectBackgroundImage(bg)}
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
                    <TabsContent value="videos">
                      <div className="rounded-lg border border-gray-200/40 bg-white/50 p-3 dark:border-slate-800/40 dark:bg-transparent">
                        <div className="mb-3 flex flex-wrap gap-2">
                          {backgroundVideoCategories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setBackgroundVideoCategory(category)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${backgroundVideoCategory === category
                                ? "bg-slate-950 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300"
                                }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>

                        <div className="mb-3 text-xs font-medium text-gray-500">
                          {t("videoCountShort", { count: filteredBackgroundVideos.length })}
                        </div>

                        <div className="grid max-h-90 grid-cols-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
                          {filteredBackgroundVideos.map((video) => (
                            <button
                              key={video.id}
                              type="button"
                              onClick={() => selectBackgroundVideo(video)}
                              title={video.name}
                              className={`group relative aspect-video overflow-hidden rounded-xl text-left transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400/60 ${selectedBackgroundId === video.id
                                ? "ring-4 ring-green-500 shadow-[0_10px_30px_rgba(16,185,129,0.12)]"
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
                      <div className="rounded-lg border border-gray-200/40 bg-white/50 p-3 dark:border-slate-800/40 dark:bg-transparent">
                        {filesLoading ? (
                          <div className="flex items-center justify-center gap-2 py-8 text-sm font-medium text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("loadingFiles")}
                          </div>
                        ) : backgroundFileMedia.length === 0 ? (
                          <div className="py-8 text-center text-sm text-gray-500">
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
                                  className={`group overflow-hidden rounded-xl border bg-gray-50 text-left transition hover:bg-white ${selected ? "border-green-500 ring-4 ring-green-500/20" : "border-gray-200 hover:border-gray-300"}`}
                                >
                                  <div className="relative aspect-square bg-gray-100">
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
                                    <p className="truncate text-sm font-semibold text-gray-900">{file.name}</p>
                                    <p className="truncate text-xs text-gray-500">{file.sizeLabel}</p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="embed">
                      <div className="space-y-3 rounded-lg border border-gray-200/40 bg-white/50 p-3 dark:border-slate-800/40 dark:bg-transparent">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={youtubeBackgroundUrl}
                            onChange={(event) => setYoutubeBackgroundUrl(event.target.value)}
                            placeholder={t("youtubePlaceholder")}
                            className="h-11 bg-white"
                          />
                          <Button
                            type="button"
                            onClick={useYouTubeBackground}
                            className="h-11 bg-slate-950 px-4 font-bold text-white hover:bg-slate-800"
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
                          <div className="relative aspect-video overflow-hidden rounded-xl border border-gray-200 bg-black">
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
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-gray-700 font-medium">{t("effects")}</h4>
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
                      <label className="text-sm text-gray-600">{t("opacity")}</label>
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
                      <label className="text-sm text-gray-600">{t("blur")}</label>
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
                      <label className="text-sm text-gray-600">{t("saturation")}</label>
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
                      <label className="text-sm text-gray-600">{t("contrast")}</label>
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
                      <label className="text-sm text-gray-600">{t("grayscale")}</label>
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
                <span className="text-gray-700 font-semibold">{t("extraOptions")}</span>
              </div>
              {extraOptionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 bg-white border border-gray-200 rounded-lg mt-1 space-y-4">
              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("subtitle")}</label>
                <Input
                  placeholder={t("subtitlePlaceholder")}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="h-11 border-gray-200"
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("coverImage")}</label>
                <div className="space-y-2">
                  {coverImageUrl && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
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
                    className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-left text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                      <FileImage className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">
                        {coverImageUrl ? t("coverSelected") : t("selectCover")}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-gray-500">
                        {coverImageUrl || t("coverSelectHint")}
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Custom Alias */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("customAlias")}</label>
                <div className="space-y-2">
                  <div className={`flex flex-1 items-center rounded-lg border bg-gray-50 px-3 ${
                    aliasCheckStatus === "available"
                      ? "border-emerald-300"
                      : aliasCheckStatus === "taken" || aliasCheckStatus === "invalid" || aliasCheckStatus === "error"
                        ? "border-red-300"
                        : "border-gray-200"
                  } ${isEditing ? "opacity-70" : ""}`}>
                    <span className="text-gray-600 text-sm">yoursite.com/</span>
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
                          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
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
                            : "text-gray-500"
                      }`}
                    >
                      {aliasCheckMessage}
                    </p>
                  ) : null}
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
                <span className="text-gray-700 font-semibold">{t("expires")}</span>
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
                <span className="text-gray-600">{t("enableExpiry")}</span>
              </div>

              {expiryEnabled && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* Expiry Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t("expiryType")}</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpiryType("date")}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${expiryType === "date"
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                      >
                        {t("byDate")}
                      </button>
                      <button
                        onClick={() => setExpiryType("clicks")}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${expiryType === "clicks"
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("expiryDate")}</label>
                        <Input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="h-11 border-gray-200"
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("expiryTime")}</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("maximumClicks")}</label>
                        <Input
                          type="number"
                          placeholder={t("maximumClicksPlaceholder")}
                          value={maxClicks}
                          onChange={(e) => setMaxClicks(e.target.value)}
                          className="h-11 border-gray-200"
                          min="1"
                        />
                      </div>
                      {maxClicks && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
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
      <div className="min-w-0 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-700">{t("previewTitle")}</h2>

          <Button
            className={`h-11 text-white ${canCreateLink ? "bg-gray-900 hover:bg-gray-800" : "bg-gray-300"
              }`}
            disabled={!canCreateLink || isSubmitting}
            onClick={handleCreateLink}
          >
            {isSubmitting ? (isEditing ? t("saving") : t("creating")) : isEditing ? t("saveChanges") : t("create")}
          </Button>
        </div>

        <Card className="relative z-10 overflow-hidden rounded-2xl p-7">
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
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: "white",
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

          <Card className="relative gap-2 overflow-hidden rounded-2xl border border-white/30 bg-white/55 p-6 text-center shadow-xl backdrop-blur-md">
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
              className={
                title
                  ? "text-xl font-semibold text-gray-900"
                  : "text-base font-normal text-gray-500"
              }
            >
              {title || t("unlockLink")}
            </h3>

            <p className="text-gray-600">{subtitle ? `${subtitle} ` : t("completeActionsHint")}</p>

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
              {t("unlockProgress", { completed: completedActions, total: totalActions })}
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
                if (inputType === "snippet") return;

                window.open(inputType === "file" ? selectedFileUrl : destinationUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <Lock />{inputType === "file" ? t("unlockFile") : inputType === "snippet" ? t("revealSnippet") : t("unlockLink")}
            </Button>

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {submitError}
              </div>
            )}

            {createdLink && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-left text-sm text-green-800">
                <p className="font-semibold">{isEditing ? t("updated") : t("createdSuccess")}</p>

                <a
                  href={`/l/${createdLink.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all font-medium text-green-700 underline underline-offset-4"
                >
                  /l/{createdLink.slug}
                </a>
              </div>
            )}

            {!canCreateLink && (
              <div className="space-y-1 text-sm text-gray-500">
                {!isTitleValid && <p>• {t("titleRequired")}</p>}
                {inputType === "url" && !isDestinationUrlValid && <p>• {t("destinationRequired")}</p>}
                {inputType === "file" && !isFileDestinationValid && <p>• {t("fileRequired")}</p>}
                {inputType === "snippet" && !isSnippetDestinationValid && <p>• {t("snippetRequired")}</p>}
                {totalActions === 0 && <p>• {t("actionRequired")}</p>}
                {totalActions > 0 && completedActions < totalActions && (
                  <p>• {t("completeAllActions")}</p>
                )}
              </div>
            )}
          </Card>
        </Card>
      </div>
    </div>

  )
}
