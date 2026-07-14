"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FilePickerCredenza } from "@/components/file-picker-credenza"
import { SnippetPickerCredenza } from "./snippet-picker-credenza"
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
  deleteSnippet,
  createLink,
  getFileDownloadUrl,
  getFilePreviewUrl,
  getFiles,
  getSnippets,
  uploadFile,
  updateSnippet,
  updateLink,
  type LinkDto,
  type ManagedFileDto,
  type SnippetDto,
} from "@/lib/api-client"
import {
  Link,
  FileCode2,
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
  const [snippetsLoaded, setSnippetsLoaded] = useState(false)
  const [snippetError, setSnippetError] = useState("")
  const [selectedSnippet, setSelectedSnippet] = useState<string>(initialLink?.selectedSnippet || "")
  const [isSnippetDialogOpen, setIsSnippetDialogOpen] = useState(false)
  const [isCoverImageDialogOpen, setIsCoverImageDialogOpen] = useState(false)
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

  const uploadCoverFiles = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    const extension = file.name.split(".").pop()?.toLowerCase() || ""

    if (!file.type.startsWith("image/") && !COVER_IMAGE_EXTENSIONS.includes(extension)) {
      setCoverFileError(t("coverMustImage"))
      return
    }

    if (file.size > COVER_IMAGE_MAX_SIZE) {
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
      window.dispatchEvent(new CustomEvent("STU:file-created", { detail: uploaded }))
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

  const updateSnippetItem = async (
    id: string,
    payload: { name?: string; content?: string },
  ) => {
    const snippet = await updateSnippet(id, payload)
    setSnippets((current) => current.map((item) => item.id === id ? snippet : item))
    return snippet
  }

  const deleteSnippetItem = async (id: string) => {
    await deleteSnippet(id)
    setSnippets((current) => current.filter((snippet) => snippet.id !== id))
    if (selectedSnippet === id) setSelectedSnippet("")
  }

  const uploadDestinationFiles = async (files: File[]) => {
    if (files.length === 0) return

    try {
      setFileUploading(true)
      const uploadedFiles: ManagedFileDto[] = []

      for (const file of files) {
        const uploaded = await uploadFile(file)
        uploadedFiles.push(uploaded)
        window.dispatchEvent(new CustomEvent("STU:file-created", { detail: uploaded }))
      }

      const selectedUpload = uploadedFiles[0]
      setAvailableFiles((current) => [...uploadedFiles, ...current])
      setSelectedFile(selectedUpload.id)
      setSelectedFileName(selectedUpload.name)
      setSelectedFileUrl(getFileDownloadUrl(selectedUpload))
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
      className={`${embedded ? "w-full" : "mx-auto max-w-6xl"} grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-start`}
    >
      {/* Left Panel - Form */}
      <div className="min-w-0 space-y-4">
        <Card className="gap-0 overflow-hidden rounded-xl border-border bg-card py-0 shadow-none">
          <CardHeader className="space-y-4 px-4 py-4 sm:px-5">

            <Tabs
              value={inputType}
              onValueChange={(value) => {
                setInputType(value as "url" | "file" | "snippet")
                if (value === "snippet" && !snippetsLoaded && !snippetsLoading) {
                  void loadSnippets()
                }
              }}
              className="w-full min-w-0 !gap-0"
            >
              <TabsList variant="line" className="!grid !h-10 !w-full !min-w-0 !grid-cols-3 !items-stretch !justify-stretch gap-0 rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger
                  value="url"
                  className="!m-0 !flex !h-10 !w-auto !min-w-0 !flex-none !items-center !justify-center gap-2 !rounded-none !border-0 !px-2 !py-0 text-sm font-medium text-muted-foreground !shadow-none transition-colors hover:bg-transparent hover:text-foreground focus-visible:!border-0 data-[state=active]:!bg-transparent data-[state=active]:!text-foreground data-[state=active]:!shadow-none"
                >
                  <Link className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{t("tabs.url")}</span>
                </TabsTrigger>

                <TabsTrigger
                  value="file"
                  className="!m-0 !flex !h-10 !w-auto !min-w-0 !flex-none !items-center !justify-center gap-2 !rounded-none !border-0 !px-2 !py-0 text-sm font-medium text-muted-foreground !shadow-none transition-colors hover:bg-transparent hover:text-foreground focus-visible:!border-0 data-[state=active]:!bg-transparent data-[state=active]:!text-foreground data-[state=active]:!shadow-none"
                >
                  <FileImage className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{t("tabs.file")}</span>
                </TabsTrigger>

                <TabsTrigger
                  value="snippet"
                  className="!m-0 !flex !h-10 !w-auto !min-w-0 !flex-none !items-center !justify-center gap-2 !rounded-none !border-0 !px-2 !py-0 text-sm font-medium text-muted-foreground !shadow-none transition-colors hover:bg-transparent hover:text-foreground focus-visible:!border-0 data-[state=active]:!bg-transparent data-[state=active]:!text-foreground data-[state=active]:!shadow-none"
                >
                  <MessageSquare className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{t("tabs.snippet")}</span>
                </TabsTrigger>
              </TabsList>




              {/* URL Tab */}
              <TabsContent value="url" className="mt-4 space-y-3">
                <div>
                  <Input
                    placeholder={t("destinationUrlPlaceholder")}
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className={`h-10 rounded-lg border-border bg-background text-foreground shadow-none placeholder:text-muted-foreground ${destinationUrl.length > 0 && !isDestinationUrlValid ? "border-destructive" : ""
                      }`}
                  />
                  {destinationUrl.length > 0 && !isDestinationUrlValid && (
                    <p className="mt-1 text-sm text-destructive">{t("invalidUrl")}</p>
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
                    className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-background px-3 text-left text-foreground transition-colors hover:border-foreground/20 hover:bg-muted/30"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                      <FileImage className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {selectedFileName ? t("fileSelected") : t("selectFile")}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
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
                        className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
                    className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-background px-3 text-left text-foreground transition-colors hover:border-foreground/20 hover:bg-muted/30"
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
          onUpdate={updateSnippetItem}
          onDelete={deleteSnippetItem}
        />
        {/* Actions Section */}
        <Card className="gap-0 overflow-hidden rounded-xl border-border bg-card py-0 shadow-none">
          <CardHeader className="border-b border-border px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2 text-foreground">
              <Settings className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">{t("actions")}</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 py-4 sm:px-5">
            {actions.map((action, index) => {
              const platform = socialPlatforms[action.platform]
              const Icon = getActionIcon(action.platform, action.action)
              return (
                <div key={action.id} className="space-y-2 rounded-lg border border-border bg-muted/15 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">{index + 1}.</span>
                      <button
                        onClick={() => handleEditAction(action.id)}
                        className="flex flex-1 items-center gap-2 rounded-md bg-muted px-3 py-2 text-left text-foreground transition-colors hover:bg-accent"
                      >
                        <Icon className="w-4 h-4" />
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
                      placeholder={t("enterPlatformUrl", { platform: platform.name.toLowerCase() })}
                      value={action.url}
                      onChange={(e) => updateActionUrl(action.id, e.target.value)}
                      className={`h-10 rounded-lg border-border bg-background text-foreground shadow-none placeholder:text-muted-foreground ${action.url.length > 0 && !action.isValid ? "border-destructive" : ""
                        }`}
                    />
                    {action.url.length > 0 && !action.isValid && (
                      <p className="mt-1 text-sm text-destructive">{t("invalidInput")}</p>
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
                  {Object.entries(socialPlatforms).map(([key, platform]) => {
                    const Icon = platform.icon
                    const isExpanded = expandedPlatforms.has(key)
                    return (
                      <div key={key}>
                        <button
                          onClick={() => togglePlatformExpanded(key)}
                          className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/25 p-3 transition-colors hover:bg-accent/60"
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
                className="h-10 w-full rounded-lg border border-dashed border-border text-muted-foreground shadow-none hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
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
                  {filteredPlatforms.map(({ key, platform }) => {
                    const PlatformIcon = platform.icon
                    const isExpanded = expandedPlatforms.has(key)
                    return (
                      <div key={key}>
                        <button
                          onClick={() => togglePlatformExpanded(key)}
                          className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/25 p-3 transition-colors hover:bg-accent/60"
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
            <CollapsibleTrigger className="flex h-12 w-full items-center justify-between rounded-lg border border-border bg-card px-4 transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{t("layout")}</span>
              </div>
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
            <CollapsibleTrigger className="flex h-12 w-full items-center justify-between rounded-lg border border-border bg-card px-4 transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{t("extraOptions")}</span>
              </div>
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
                    <span className="text-sm text-muted-foreground">yoursite.com/</span>
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
            <CollapsibleTrigger className="flex h-12 w-full items-center justify-between rounded-lg border border-border bg-card px-4 transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{t("expires")}</span>
              </div>
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
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="h-10 rounded-lg border-border bg-background shadow-none"
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">{t("expiryTime")}</label>
                        <Input
                          type="time"
                          value={expiryTime}
                          onChange={(e) => setExpiryTime(e.target.value)}
                          className="h-10 rounded-lg border-border bg-background shadow-none"
                        />
                      </div>
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
                          type="number"
                          placeholder={t("maximumClicksPlaceholder")}
                          value={maxClicks}
                          onChange={(e) => setMaxClicks(e.target.value)}
                          className="h-10 rounded-lg border-border bg-background shadow-none"
                          min="1"
                        />
                      </div>
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
            disabled={!canCreateLink || isSubmitting}
            onClick={handleCreateLink}
          >
            {isSubmitting ? (isEditing ? t("saving") : t("creating")) : isEditing ? t("saveChanges") : t("create")}
          </Button>
        </div>

        <Card className="relative z-10 min-h-[420px] overflow-hidden rounded-xl border-border bg-muted/20 p-4 shadow-none sm:p-5 lg:min-h-[560px]">
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

          <Card className="relative gap-3 overflow-hidden rounded-xl border border-border/80 bg-background/90 p-5 text-center shadow-none backdrop-blur-md">
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
                  ? "text-lg font-semibold text-foreground"
                  : "text-base font-normal text-muted-foreground"
              }
            >
              {title || t("unlockLink")}
            </h3>

            <p className="text-sm text-muted-foreground">{subtitle ? `${subtitle} ` : t("completeActionsHint")}</p>

            {inputType === "snippet" && selectedSnippetData ? (
              <div className="overflow-hidden rounded-lg border border-border bg-muted/20 text-left">
                <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium text-foreground">{selectedSnippetData.name}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatSnippetSize(selectedSnippetData.content)}</span>
                </div>
                <div className="relative h-20 overflow-hidden px-3 py-2.5">
                  <pre className="select-none whitespace-pre-wrap break-words font-mono text-xs leading-5 text-muted-foreground blur-[3px]">
                    {selectedSnippetData.content}
                  </pre>
                  <div className="absolute inset-0 grid place-items-center bg-background/45 backdrop-blur-[1px]">
                    <span className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {t("snippetContentLocked")}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

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

            <div className="text-xs text-muted-foreground">
              {t("unlockProgress", { completed: completedActions, total: totalActions })}
            </div>

            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                style={{
                  width:
                    totalActions > 0
                      ? `${(completedActions / totalActions) * 100}%`
                      : "0%",
                }}
              />
            </div>

            <Button
              className={`h-10 w-full rounded-lg font-medium shadow-none ${isDestinationValid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground"
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
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {submitError}
              </div>
            )}

            {createdLink && (
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-left text-sm text-emerald-700 dark:text-emerald-400">
                <p className="font-semibold">{isEditing ? t("updated") : t("createdSuccess")}</p>

                <a
                  href={`/l/${createdLink.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all font-medium underline underline-offset-4"
                >
                  /l/{createdLink.slug}
                </a>
              </div>
            )}

            {!canCreateLink && (
              <div className="space-y-1 text-left text-xs text-muted-foreground">
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
