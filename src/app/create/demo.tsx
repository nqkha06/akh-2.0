"use client"

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Link,
  FileImage,
  Camera,
  MessageCircle,
  Music,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  Clock,
  Video,
  X,
} from "lucide-react"

const socialPlatforms = {
  youtube: {
    name: "YouTube",
    icon: Video,
    color: "bg-red-600",
    actions: [
      { id: "subscribe", label: "Subscribe to channel", requiresUrl: true },
      { id: "like", label: "Like a video", requiresUrl: true },
      { id: "comment", label: "Comment on a video", requiresUrl: true },
      { id: "watch", label: "Watch video", requiresUrl: true },
    ],
  },
  instagram: {
    name: "Instagram",
    icon: Camera,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    actions: [
      { id: "follow", label: "Follow account", requiresUrl: true },
      { id: "like", label: "Like a post", requiresUrl: true },
      { id: "story", label: "View story", requiresUrl: true },
      { id: "reel", label: "Watch reel", requiresUrl: true },
    ],
  },
  facebook: {
    name: "Facebook",
    icon: MessageCircle,
    color: "bg-blue-600",
    actions: [
      { id: "like", label: "Like page", requiresUrl: true },
      { id: "follow", label: "Follow page", requiresUrl: true },
      { id: "share", label: "Share post", requiresUrl: true },
      { id: "join", label: "Join group", requiresUrl: true },
    ],
  },
  twitter: {
    name: "X/Twitter",
    icon: X,
    color: "bg-black",
    actions: [
      { id: "follow", label: "Follow account", requiresUrl: true },
      { id: "like", label: "Like tweet", requiresUrl: true },
      { id: "retweet", label: "Retweet", requiresUrl: true },
      { id: "reply", label: "Reply to tweet", requiresUrl: true },
    ],
  },
  tiktok: {
    name: "TikTok",
    icon: Music,
    color: "bg-black",
    actions: [
      { id: "follow", label: "Follow account", requiresUrl: true },
      { id: "like", label: "Like video", requiresUrl: true },
      { id: "share", label: "Share video", requiresUrl: true },
      { id: "comment", label: "Comment on video", requiresUrl: true },
    ],
  },
  spotify: {
    name: "Spotify",
    icon: Music,
    color: "bg-green-500",
    actions: [
      { id: "follow", label: "Follow artist", requiresUrl: true },
      { id: "playlist", label: "Follow playlist", requiresUrl: true },
      { id: "album", label: "Save album", requiresUrl: true },
      { id: "track", label: "Save track", requiresUrl: true },
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

const backgroundImages = [
  { id: "1", name: "Mint Fresh", gradient: "linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 100%)" },
  { id: "2", name: "Warm Earth", gradient: "linear-gradient(135deg, #d4a574 0%, #8b4513 100%)" },
  { id: "3", name: "Sky Blue", gradient: "linear-gradient(135deg, #e6f3ff 0%, #b3d9ff 100%)" },
  { id: "4", name: "Dark Slate", gradient: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)" },
  { id: "5", name: "Pink Dream", gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)" },
  { id: "6", name: "Sunset", gradient: "linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)" },
  { id: "7", name: "Charcoal", gradient: "linear-gradient(135deg, #636e72 0%, #2d3436 100%)" },
  { id: "8", name: "Ocean Blue", gradient: "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)" },
  { id: "9", name: "Purple Night", gradient: "linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)" },
  { id: "10", name: "Magenta Pop", gradient: "linear-gradient(135deg, #fd79a8 0%, #e84393 100%)" },
  { id: "11", name: "Green Nature", gradient: "linear-gradient(135deg, #00b894 0%, #00a085 100%)" },
  { id: "12", name: "Fire Red", gradient: "linear-gradient(135deg, #e17055 0%, #d63031 100%)" },
  { id: "13", name: "Coral Vibes", gradient: "linear-gradient(135deg, #ff7675 0%, #fd79a8 100%)" },
  { id: "14", name: "Honey Gold", gradient: "linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)" },
  { id: "15", name: "Deep Ocean", gradient: "linear-gradient(135deg, #55a3ff 0%, #003d82 100%)" },
  { id: "16", name: "Desert Sand", gradient: "linear-gradient(135deg, #c7a17a 0%, #8b4513 100%)" },
  { id: "17", name: "Tropical", gradient: "linear-gradient(135deg, #81ecec 0%, #00b894 100%)" },
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
}: {
  embedded?: boolean
} = {}) {
  const actionIdRef = useRef(0)
  const [destinationUrl, setDestinationUrl] = useState("")
  const [title, setTitle] = useState("")
  const [inputType, setInputType] = useState<"url" | "file" | "snippet">("url")
  const [selectedFile] = useState<string>("")
  const [selectedSnippet, setSelectedSnippet] = useState<string>("")
  const [actions, setActions] = useState<SocialAction[]>([])
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
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

  const popularActions = [
    { platform: "youtube" as keyof typeof socialPlatforms, actionId: "subscribe" },
    { platform: "facebook" as keyof typeof socialPlatforms, actionId: "like" },
    { platform: "instagram" as keyof typeof socialPlatforms, actionId: "follow" },
    { platform: "twitter" as keyof typeof socialPlatforms, actionId: "follow" },
  ]

  const isDestinationUrlValid = destinationUrl.length > 0 && isValidUrl(destinationUrl)
  const isTitleValid = title.length > 0
  const completedActions = actions.filter((a) => a.isValid).length
  const totalActions = actions.length
  const allActionsCompleted = totalActions > 0 && completedActions === totalActions
  const canUnlock = isDestinationUrlValid && isTitleValid && allActionsCompleted

  return (
    <div
      className={`${embedded ? "" : "min-h-screen"} bg-gray-50 text-gray-900 p-4`}
    >
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
                      className={`h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${
                        destinationUrl.length > 0 && !isDestinationUrlValid ? "border-red-500" : ""
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
                  <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100">
                    <FileImage className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <span className="text-gray-600 font-medium">Select file</span>
                  </button>
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
                          className={`p-3 rounded-lg text-left transition-colors ${
                            selectedSnippet === snippet.id
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
                const Icon = platform.icon
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
                        className={`h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${
                          action.url.length > 0 && !action.isValid ? "border-red-500" : ""
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
                  overlayClassName="z-[200] bg-black/35 backdrop-blur-sm"
                  className="z-[210] bg-white border-gray-200 text-gray-900 max-w-md shadow-[0_18px_50px_rgba(15,23,42,0.22)]"
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
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="w-full mt-4">
                    Close
                  </Button>
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
                  overlayClassName="z-[200] bg-black/35 backdrop-blur-sm"
                  className="z-[210] bg-white border-gray-200 text-gray-900 max-w-md shadow-[0_18px_50px_rgba(15,23,42,0.22)]"
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
                        {expandedPlatforms.size === Object.keys(socialPlatforms).length ? "Collapse all" : "Expand all"}
                      </Button>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {/* Popular Actions Section */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">Popular</h4>
                      <div className="grid grid-cols-2 gap-2 px-3">
                        {popularActions.map((item) => {
                          const platform = socialPlatforms[item.platform]
                          const Icon = platform.icon
                          const action = platform.actions.find(a => a.id === item.actionId)
                          return (
                            <Button
                              key={`${item.platform}-${item.actionId}`}
                              onClick={() => addAction(item.platform, item.actionId)}
                              className={`${platform.color} hover:opacity-80 text-white text-xs h-8`}
                              size="sm"
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              {action?.label}
                            </Button>
                          )
                        })}
                      </div>
                      <div className="border-b border-gray-200 my-3" />
                    </div>

                    {/* All Platforms */}
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
                                  onClick={() => addAction(key as keyof typeof socialPlatforms, action.id)}
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
                  <Button variant="outline" onClick={() => setIsActionModalOpen(false)} className="w-full mt-4">
                    Close
                  </Button>
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
                      onClick={() => setSameAsCoverImage(!sameAsCoverImage)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        sameAsCoverImage ? "bg-green-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          sameAsCoverImage ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-gray-600">Same as cover image</span>
                  </div>
                </div>

                {/* Gallery Section */}
                {!sameAsCoverImage && (
                  <div>
                    <h4 className="text-gray-700 font-medium mb-3">Gallery</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {backgroundImages.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => setSelectedBackgroundId(bg.id)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                            selectedBackgroundId === bg.id
                              ? "border-green-500 ring-2 ring-green-200"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          title={bg.name}
                        >
                          <div
                            className="w-full h-full"
                            style={{
                              background: bg.gradient,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          />
                        </button>
                      ))}
                    </div>
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
                        <img
                          src={coverImageUrl}
                          alt="Cover"
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      expiryEnabled ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        expiryEnabled ? "translate-x-6" : "translate-x-1"
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
                          className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                            expiryType === "date"
                              ? "bg-blue-50 border-blue-300 text-blue-700"
                              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          By Date
                        </button>
                        <button
                          onClick={() => setExpiryType("clicks")}
                          className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                            expiryType === "clicks"
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
            <Button className="h-11 bg-gray-900 text-white hover:bg-gray-800">Create</Button>
          </div>

          <Card
            className="bg-white border-gray-200 shadow-sm p-6 relative overflow-hidden"
          >
            {/* Background with effects */}
            <div
              className="absolute inset-0"
              style={{
                background: sameAsCoverImage
                  ? "linear-gradient(135deg, #f8f9fa, #e9ecef)"
                  : selectedBackgroundId
                    ? backgroundImages.find((bg) => bg.id === selectedBackgroundId)?.gradient || "white"
                    : "white",
                filter: `opacity(${opacity / 100}) blur(${blur}px) saturate(${saturation / 100}) contrast(${contrast / 100}) grayscale(${grayscale / 100})`,
                pointerEvents: "none",
              }}
            />
            <div className="relative z-10">
              <div className="text-center space-y-4">
                {/* Cover Image */}
                {coverImageUrl && (
                  <div className="w-full h-40 rounded-lg overflow-hidden mb-2">
                    <img
                      src={coverImageUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {title ? (
                  <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                ) : (
                  <h3 className="text-gray-500">Enter a title to see preview</h3>
                )}

                {subtitle && (
                  <p className="text-sm text-gray-600">{subtitle}</p>
                )}

                {destinationUrl && isDestinationUrlValid && (
                  <p className="text-xs text-gray-500 break-all">Destination: {destinationUrl}</p>
                )}

                <p className="text-gray-600">Complete the actions to unlock</p>

                {actions.length > 0 && (
                  <div className="space-y-3">
                    {actions.map((action) => {
                      const platform = socialPlatforms[action.platform]
                      const Icon = platform.icon
                      return (
                        <Button
                          key={action.id}
                          className={`w-full ${platform.color} hover:opacity-80 text-white`}
                          disabled={!action.isValid}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {getActionLabel(action.platform, action.action)}
                        </Button>
                      )
                    })}
                  </div>
                )}

                <div className="text-gray-500 text-sm">
                  unlock progress {completedActions}/{totalActions}
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: totalActions > 0 ? `${(completedActions / totalActions) * 100}%` : "0%",
                    }}
                  />
                </div>

                <Button
                  className={`h-11 w-full ${canUnlock ? "bg-green-600 hover:bg-green-700" : "bg-gray-300"} text-white`}
                  disabled={!canUnlock}
                  onClick={() => {
                    console.log("[v0] Creating social link with data:", {
                      title,
                      destinationUrl,
                      inputType,
                      selectedSnippet,
                      selectedFile,
                      subtitle,
                      customAlias,
                      coverImageUrl,
                      expiryEnabled,
                      expiryType,
                      expiryDate,
                      expiryTime,
                      maxClicks,
                      actions: actions.map(a => ({
                        platform: a.platform,
                        action: a.action,
                        url: a.url
                      })),
                      backgroundSettings: {
                        selectedBackgroundId,
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
                  }}
                >
                  🔓 Unlock link
                </Button>

                {!canUnlock && (
                  <div className="text-sm text-gray-500 space-y-1">
                    {!isTitleValid && <p>• Title is required</p>}
                    {!isDestinationUrlValid && <p>• Valid destination URL is required</p>}
                    {totalActions === 0 && <p>• At least one action is required</p>}
                    {totalActions > 0 && completedActions < totalActions && <p>• Complete all actions</p>}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
