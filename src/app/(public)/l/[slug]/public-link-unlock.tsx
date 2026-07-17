"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BellRing,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  Loader2,
  LockKeyhole,
  MessageCircle,
  MousePointerClick,
  Repeat2,
  Reply,
  ThumbsUp,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { PublicCreatorLayout } from "@/components/public-creator-layout";
import type { LinkDto } from "@/lib/api-client";

const ACTION_DELAY_SECONDS = 6;

const backgroundImages = [
  {
    id: "1",
    imageUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "2",
    imageUrl:
      "https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "3",
    imageUrl:
      "https://images.unsplash.com/photo-1465101178521-c1a9136a3f11?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "4",
    imageUrl:
      "https://images.unsplash.com/photo-1505483531331-5095d1f4b0f5?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "5",
    imageUrl:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "6",
    imageUrl:
      "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "7",
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "8",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
  },
] as const;

const actionLabels: Record<string, string> = {
  subscribe: "Subscribe to channel",
  "subscribe-notifications": "Subscribe & turn on notifications",
  like: "Like",
  comment: "Comment",
  "like-comment": "Like & comment",
  watch: "Watch",
  follow: "Follow user",
  "tiktok-follow": "Follow user",
  repost: "Repost",
  reply: "Reply",
  "join-server": "Join server",
  "join-channel": "Join channel",
  "follow-artist": "Follow artist",
  "follow-streamer": "Follow streamer",
  "visit-page": "Visit page",
  "other-visit": "Visit website",
};

const actionIcons: Record<string, LucideIcon> = {
  subscribe: UserPlus,
  "subscribe-notifications": BellRing,
  like: ThumbsUp,
  comment: MessageCircle,
  "like-comment": MessageCircle,
  watch: Eye,
  follow: UserPlus,
  "tiktok-follow": UserPlus,
  repost: Repeat2,
  reply: Reply,
  "join-server": Users,
  "join-channel": Users,
  "follow-artist": UserPlus,
  "follow-streamer": UserPlus,
  "visit-page": Globe2,
  "other-visit": Globe2,
};

const platformColors: Record<string, string> = {
  popular: "bg-red-600 hover:bg-red-700",
  youtube: "bg-red-600 hover:bg-red-700",

  twitter: "bg-black hover:bg-slate-900",
  x: "bg-black hover:bg-slate-900",

  instagram:
    "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-95",

  tiktok: "bg-black hover:bg-slate-900",

  facebook: "bg-blue-600 hover:bg-blue-700",
  discord: "bg-indigo-600 hover:bg-indigo-700",
  telegram: "bg-sky-500 hover:bg-sky-600",
  spotify: "bg-green-500 hover:bg-green-600",
  twitch: "bg-purple-600 hover:bg-purple-700",
  vimeo: "bg-sky-500 hover:bg-sky-600",
  threads: "bg-black hover:bg-slate-900",
  linkedin: "bg-blue-700 hover:bg-blue-800",
  pinterest: "bg-red-600 hover:bg-red-700",
  snapchat: "bg-yellow-400 hover:bg-yellow-500",
  reddit: "bg-orange-600 hover:bg-orange-700",
  whatsapp: "bg-green-500 hover:bg-green-600",
  bluesky: "bg-sky-500 hover:bg-sky-600",
  soundcloud: "bg-orange-500 hover:bg-orange-600",
  deezer: "bg-purple-600 hover:bg-purple-700",
  kick: "bg-lime-500 hover:bg-lime-600",
  rumble: "bg-green-600 hover:bg-green-700",
  roblox: "bg-gray-900 hover:bg-black",
  steam: "bg-slate-800 hover:bg-slate-900",
  behance: "bg-blue-600 hover:bg-blue-700",
  dribbble: "bg-pink-500 hover:bg-pink-600",
  deviantart: "bg-green-600 hover:bg-green-700",

  appleMusic: "bg-pink-500 hover:bg-pink-600",
  "apple-music": "bg-pink-500 hover:bg-pink-600",

  audiomack: "bg-yellow-500 hover:bg-yellow-600",
  beatstars: "bg-red-600 hover:bg-red-700",
  bandcamp: "bg-sky-600 hover:bg-sky-700",
  tidal: "bg-black hover:bg-slate-900",
  onlyfans: "bg-sky-500 hover:bg-sky-600",
  github: "bg-gray-900 hover:bg-black",

  productHunt: "bg-orange-600 hover:bg-orange-700",
  "product-hunt": "bg-orange-600 hover:bg-orange-700",

  googlePlay: "bg-green-600 hover:bg-green-700",
  "google-play": "bg-green-600 hover:bg-green-700",

  appStore: "bg-blue-600 hover:bg-blue-700",
  "app-store": "bg-blue-600 hover:bg-blue-700",

  other: "bg-gray-700 hover:bg-gray-800",
};

function getActionIcon(action: string): LucideIcon {
  return actionIcons[action] ?? MousePointerClick;
}

function getPlatformColor(platform: string | null | undefined): string {
  if (!platform) {
    return platformColors.other;
  }

  const value = platform.trim();

  return (
    platformColors[value] ??
    platformColors[value.toLowerCase()] ??
    platformColors.other
  );
}

function formatAction(action: LinkDto["actions"][number]): string {
  return actionLabels[action.action] || action.action;
}

function formatPlatform(platform: string): string {
  return platform
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getYouTubeEmbedUrl(
  value: string | null | undefined,
  muted = true,
): string {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");

    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      if (
        url.pathname.startsWith("/shorts/") ||
        url.pathname.startsWith("/embed/")
      ) {
        videoId =
          url.pathname.split("/").filter(Boolean)[1] || "";
      } else {
        videoId = url.searchParams.get("v") || "";
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return "";
    }

    const params = new URLSearchParams({
      autoplay: "1",
      mute: muted ? "1" : "0",
      controls: "0",
      loop: "1",
      playlist: videoId,
      playsinline: "1",
      modestbranding: "1",
      rel: "0",
      enablejsapi: "1",
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  } catch {
    return "";
  }
}

export function PublicLinkUnlock({
  link,
}: {
  link: LinkDto;
}) {
  const t = useTranslations("PublicLink");
  const createT = useTranslations("CreateLink");
  const storageKey = `stu-unlock:${link.slug}`;

  const countdownIntervalIdsRef = useRef<
    Map<string, number>
  >(new Map());

  const completionTimeoutIdsRef = useRef<
    Map<string, number>
  >(new Map());

  const youtubeBackgroundRef =
    useRef<HTMLIFrameElement | null>(null);

  const [completedIds, setCompletedIds] = useState<
    string[]
  >([]);

  const [loadingIds, setLoadingIds] = useState<
    string[]
  >([]);

  const [
    remainingSecondsById,
    setRemainingSecondsById,
  ] = useState<Record<string, number>>({});

  const [snippetRevealed, setSnippetRevealed] =
    useState(false);

  const [youtubeMuted, setYoutubeMuted] =
    useState(true);

  const actionIds = useMemo(
    () =>
      link.actions.map(
        (action, index) => action.id || `${index}`,
      ),
    [link.actions],
  );

  const validActionIdSet = useMemo(
    () => new Set(actionIds),
    [actionIds],
  );

  const completedIdSet = useMemo(
    () => new Set(completedIds),
    [completedIds],
  );

  const loadingIdSet = useMemo(
    () => new Set(loadingIds),
    [loadingIds],
  );

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      try {
        const stored =
          window.localStorage.getItem(storageKey);

        const parsed: unknown = stored
          ? JSON.parse(stored)
          : [];

        if (!Array.isArray(parsed)) {
          setCompletedIds([]);
          return;
        }

        const validStoredIds = parsed.filter(
          (value): value is string =>
            typeof value === "string" &&
            validActionIdSet.has(value),
        );

        setCompletedIds(validStoredIds);
      } catch {
        setCompletedIds([]);
      }
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [storageKey, validActionIdSet]);

  useEffect(() => {
    const countdownIntervalIds =
      countdownIntervalIdsRef.current;

    const completionTimeoutIds =
      completionTimeoutIdsRef.current;

    return () => {
      countdownIntervalIds.forEach((intervalId) => {
        window.clearInterval(intervalId);
      });

      completionTimeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });

      countdownIntervalIds.clear();
      completionTimeoutIds.clear();
    };
  }, []);

  const completedCount = useMemo(
    () =>
      actionIds.reduce(
        (total, id) =>
          completedIdSet.has(id)
            ? total + 1
            : total,
        0,
      ),
    [actionIds, completedIdSet],
  );

  const totalActions = actionIds.length;

  const unlocked =
    totalActions === 0 ||
    completedCount === totalActions;

  const progress =
    totalActions > 0
      ? (completedCount / totalActions) * 100
      : 100;

  const selectedBackground = useMemo(
    () =>
      backgroundImages.find(
        (background) =>
          background.id ===
          link.backgroundSettings
            .selectedBackgroundId,
      ),
    [
      link.backgroundSettings
        .selectedBackgroundId,
    ],
  );

  const backgroundMediaType =
    link.backgroundSettings.sameAsCoverImage
      ? "image"
      : link.backgroundSettings
          .backgroundMediaType;

  const backgroundMediaUrl =
    link.backgroundSettings.sameAsCoverImage
      ? link.coverImageUrl ||
        selectedBackground?.imageUrl ||
        null
      : link.backgroundSettings
          .backgroundMediaUrl ||
        selectedBackground?.imageUrl ||
        null;

  const backgroundImageUrl =
    backgroundMediaType === "image"
      ? backgroundMediaUrl
      : null;

  const backgroundVideoUrl =
    backgroundMediaType === "video"
      ? backgroundMediaUrl
      : null;

  const backgroundYouTubeUrl =
    backgroundMediaType === "youtube"
      ? getYouTubeEmbedUrl(
          backgroundMediaUrl,
          youtubeMuted,
        )
      : "";

  const backgroundEffects = link.backgroundSettings.effects;
  const backgroundFilter = [
    `opacity(${backgroundEffects.opacity / 100})`,
    `blur(${backgroundEffects.blur}px)`,
    `saturate(${backgroundEffects.saturation / 100})`,
    `contrast(${backgroundEffects.contrast / 100})`,
    `grayscale(${backgroundEffects.grayscale / 100})`,
  ].join(" ");

  const toggleYouTubeAudio = () => {
    const nextMuted = !youtubeMuted;

    setYoutubeMuted(nextMuted);

    const iframeWindow =
      youtubeBackgroundRef.current?.contentWindow;

    iframeWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: nextMuted ? "mute" : "unMute",
        args: [],
      }),
      "https://www.youtube.com",
    );

    if (!nextMuted) {
      iframeWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "playVideo",
          args: [],
        }),
        "https://www.youtube.com",
      );
    }
  };

  const markCompleted = (id: string) => {
    setCompletedIds((current) => {
      if (current.includes(id)) {
        return current;
      }

      const next = [...current, id];

      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify(next),
        );
      } catch {
        // Không chặn UI nếu localStorage bị vô hiệu hóa.
      }

      return next;
    });
  };

  const clearActionTimers = (id: string) => {
    const intervalId =
      countdownIntervalIdsRef.current.get(id);

    const timeoutId =
      completionTimeoutIdsRef.current.get(id);

    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
      countdownIntervalIdsRef.current.delete(id);
    }

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      completionTimeoutIdsRef.current.delete(id);
    }
  };

  const finishAction = (id: string) => {
    clearActionTimers(id);
    markCompleted(id);

    setLoadingIds((current) =>
      current.filter(
        (loadingId) => loadingId !== id,
      ),
    );

    setRemainingSecondsById((current) => {
      const next = { ...current };

      delete next[id];

      return next;
    });
  };

  const handleActionClick = (id: string) => {
    if (
      completedIdSet.has(id) ||
      loadingIdSet.has(id)
    ) {
      return;
    }

    setLoadingIds((current) =>
      current.includes(id)
        ? current
        : [...current, id],
    );

    setRemainingSecondsById((current) => ({
      ...current,
      [id]: ACTION_DELAY_SECONDS,
    }));

    const countdownIntervalId =
      window.setInterval(() => {
        setRemainingSecondsById((current) => {
          const nextSeconds = Math.max(
            (current[id] ?? ACTION_DELAY_SECONDS) - 1,
            0,
          );

          return {
            ...current,
            [id]: nextSeconds,
          };
        });
      }, 1000);

    countdownIntervalIdsRef.current.set(
      id,
      countdownIntervalId,
    );

    const completionTimeoutId = window.setTimeout(() => {
      finishAction(id);
    }, ACTION_DELAY_SECONDS * 1000);

    completionTimeoutIdsRef.current.set(id, completionTimeoutId);
  };

  return (
    <PublicCreatorLayout
      variant="linear"
      className="items-start"
      background={
        backgroundImageUrl || backgroundVideoUrl || backgroundYouTubeUrl ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            {backgroundImageUrl ? (
              <div
                className="absolute inset-0 scale-105 bg-cover bg-center"
                style={{ backgroundImage: "url(" + backgroundImageUrl + ")", filter: backgroundFilter }}
              />
            ) : backgroundVideoUrl ? (
              <video
                src={backgroundVideoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 size-full scale-[1.03] object-cover"
                style={{ filter: backgroundFilter }}
              />
            ) : backgroundYouTubeUrl ? (
              <iframe
                ref={youtubeBackgroundRef}
                src={backgroundYouTubeUrl}
                title={t("backgroundVideo")}
                allow="autoplay; encrypted-media; picture-in-picture"
                className="absolute left-1/2 top-1/2 h-[150%] w-[267%] -translate-x-1/2 -translate-y-1/2 sm:h-[135%] sm:w-[240%]"
                style={{ filter: backgroundFilter }}
              />
            ) : null}
          </div>
        ) : null
      }
      topAction={
        backgroundYouTubeUrl ? (
          <button
            type="button"
            onClick={toggleYouTubeAudio}
            aria-label={youtubeMuted ? t("enableAudio") : t("muteAudio")}
            title={youtubeMuted ? t("enableAudio") : t("muteAudio")}
            className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white/90 text-slate-600 backdrop-blur-xl transition-colors hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-[#0f1011]/90 dark:text-[#d0d6e0] dark:hover:bg-[#18191a] dark:hover:text-white"
          >
            {youtubeMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        ) : undefined
      }
    >
      <div className="mx-auto w-full max-w-[1040px]" data-testid="public-link-shell">
        <section className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1011]/95 dark:shadow-none lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)]">
          <div className="border-b border-slate-200 dark:border-white/10 lg:border-b-0 lg:border-r">
            {link.coverImageUrl ? (
              <div className="border-b border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#141516] sm:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={link.coverImageUrl}
                  alt={link.title}
                  className="aspect-[16/9] w-full rounded-lg object-cover"
                />
              </div>
            ) : null}

            <div className="p-5 sm:p-7 lg:p-8">
              <div className="flex items-center gap-2 text-xs font-medium tracking-[0.04em] text-slate-600 dark:text-[#8a8f98]">
                <span className="grid size-7 place-items-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-[#141516] dark:text-[#8a8f98]">
                  <LockKeyhole className="size-3.5" />
                </span>
                {t("protectedContent")}
              </div>

              <h1 className="mt-5 text-balance text-[28px] font-semibold leading-[1.16] tracking-[-0.035em] text-slate-950 dark:text-[#f7f8f8] sm:text-[34px]">
                {link.title}
              </h1>

              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-[#8a8f98] sm:text-[15px]">
                {link.subtitle || t("defaultDescription")}
              </p>

              <div className="mt-7 grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-[#010102]/45">
                <div className="border-r border-slate-200 px-3.5 py-3 dark:border-white/10">
                  <p className="text-[11px] text-slate-500 dark:text-[#62666d]">{t("requirements")}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-[#d0d6e0]">
                    {t("actionCount", { count: totalActions })}
                  </p>
                </div>
                <div className="px-3.5 py-3">
                  <p className="text-[11px] text-slate-500 dark:text-[#62666d]">{t("destination")}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-[#d0d6e0]">
                    {link.inputType === "file"
                      ? t("destinationFile")
                      : link.inputType === "snippet"
                        ? t("destinationSnippet")
                        : t("destinationLink")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="border-b border-slate-200 px-5 py-5 dark:border-white/10 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-950 dark:text-[#f7f8f8]">
                    {unlocked ? t("readyTitle") : t("progressTitle")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-[#8a8f98]">
                    {unlocked
                      ? t("readyDescription")
                      : t("progressDescription", { completed: completedCount, total: totalActions })}
                  </p>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-md border px-2 py-1 font-mono text-xs font-medium tabular-nums",
                    unlocked
                      ? "border-[#27a644]/30 bg-[#27a644]/10 text-emerald-700 dark:text-[#6fd486]"
                      : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-[#141516] dark:text-[#d0d6e0]",
                  ].join(" ")}
                  data-testid="unlock-progress-count"
                >
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-[#23252a]" data-testid="unlock-progress">
                <div
                  className={unlocked ? "h-full rounded-full bg-[#27a644] transition-[width] duration-500" : "h-full rounded-full bg-[#5e6ad2] transition-[width] duration-500"}
                  style={{ width: progress + "%" }}
                />
              </div>
            </div>

            <div className="flex-1 space-y-2 px-4 py-4 sm:px-5 sm:py-5">
              {link.actions.map((action, index) => {
                const id = action.id || String(index);
                const completed = completedIdSet.has(id);
                const loading = loadingIdSet.has(id);
                const ActionIcon = getActionIcon(action.action);
                const platformColor = getPlatformColor(action.platform);
                const remainingSeconds = remainingSecondsById[id] ?? ACTION_DELAY_SECONDS;
                const countdownProgress =
                  ((ACTION_DELAY_SECONDS - remainingSeconds) / ACTION_DELAY_SECONDS) * 100;
                const actionLabel = createT.has("actionLabels." + action.action)
                  ? createT("actionLabels." + action.action)
                  : formatAction(action);

                return (
                  <a
                    key={id}
                    href={action.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-busy={loading}
                    aria-disabled={loading || undefined}
                    data-testid={"public-action-" + index}
                    onClick={(event) => {
                      if (loading) {
                        event.preventDefault();
                        return;
                      }
                      handleActionClick(id);
                    }}
                    className={[
                      "group relative flex min-h-16 w-full items-center gap-3 overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-colors",
                      completed
                        ? "border-[#27a644]/30 bg-[#27a644]/10"
                        : loading
                          ? "cursor-wait border-slate-300 bg-slate-100 dark:border-white/15 dark:bg-[#18191a]"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-[#141516] dark:hover:border-white/20 dark:hover:bg-[#18191a]",
                    ].join(" ")}
                  >
                    {loading ? (
                      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-200 dark:bg-white/5">
                        <span
                          className="block h-full bg-[#5e6ad2] transition-[width] duration-1000 ease-linear"
                          style={{ width: Math.min(Math.max(countdownProgress, 0), 100) + "%" }}
                        />
                      </span>
                    ) : null}

                    <span
                      className={[
                        "grid size-10 shrink-0 place-items-center rounded-md text-white",
                        completed ? "bg-[#27a644]" : loading ? "bg-slate-400 dark:bg-[#23252a]" : platformColor,
                      ].join(" ")}
                    >
                      {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : completed ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <ActionIcon className="size-4" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-950 dark:text-[#f7f8f8]">
                        {loading ? t("recordingAction") : actionLabel}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-600 dark:text-[#8a8f98]">
                        {loading
                          ? t("keepPageOpen")
                          : completed
                            ? t("completedAction")
                            : t("opensNewTab", { platform: formatPlatform(action.platform) })}
                      </span>
                    </span>

                    {loading ? (
                      <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-slate-700 dark:text-[#d0d6e0]">
                        {remainingSeconds}s
                      </span>
                    ) : completed ? (
                      <span className="shrink-0 rounded-md border border-[#27a644]/25 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-[#6fd486]">
                        {t("done")}
                      </span>
                    ) : (
                      <ExternalLink className="size-4 shrink-0 text-slate-400 transition-colors group-hover:text-slate-700 dark:text-[#62666d] dark:group-hover:text-[#d0d6e0]" />
                    )}
                  </a>
                );
              })}
            </div>

            <div className="border-t border-slate-200 p-4 dark:border-white/10 sm:p-5">
              {link.inputType === "snippet" ? (
                <>
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => setSnippetRevealed(true)}
                    data-testid="unlock-cta"
                    className={[
                      "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
                      unlocked
                        ? "bg-[#5e6ad2] text-white hover:bg-[#828fff]"
                        : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-[#18191a] dark:text-[#62666d]",
                    ].join(" ")}
                  >
                    {unlocked ? <FileText className="size-4" /> : <LockKeyhole className="size-4" />}
                    {unlocked
                      ? snippetRevealed
                        ? t("snippetRevealed")
                        : t("revealSnippet")
                      : t("unlockSnippet")}
                  </button>

                  {snippetRevealed && unlocked ? (
                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#010102]">
                      <div className="flex items-center gap-2 border-b border-slate-200 px-3.5 py-2.5 dark:border-white/10">
                        <FileText className="size-3.5 text-slate-600 dark:text-[#8a8f98]" />
                        <span className="text-xs font-medium text-slate-700 dark:text-[#d0d6e0]">{t("unlockedContent")}</span>
                      </div>
                      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-slate-700 dark:text-[#d0d6e0]">
                        {link.destinationUrl}
                      </pre>
                    </div>
                  ) : null}
                </>
              ) : (
                <a
                  href={unlocked ? link.destinationUrl : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!unlocked}
                  data-testid="unlock-cta"
                  className={[
                    "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
                    unlocked
                      ? "bg-[#5e6ad2] text-white hover:bg-[#828fff]"
                      : "pointer-events-none cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-[#18191a] dark:text-[#62666d]",
                  ].join(" ")}
                >
                  {unlocked ? <ExternalLink className="size-4" /> : <LockKeyhole className="size-4" />}
                  {unlocked
                    ? link.inputType === "file"
                      ? t("openFile")
                      : t("continueToLink")
                    : t("unlockLink")}
                </a>
              )}

              <p className="mt-3 text-center text-[11px] leading-5 text-slate-500 dark:text-[#62666d]">
                {unlocked ? t("destinationReady") : t("destinationProtected")}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-4 flex flex-col items-center justify-between gap-3 text-xs text-slate-500 dark:text-[#62666d] sm:flex-row">
          <span>{t("protectedBy")}</span>
          <Link
            href="/member/create"
            className="rounded-md px-2 py-1.5 font-medium text-slate-600 transition-colors hover:bg-black/5 hover:text-slate-950 dark:text-[#8a8f98] dark:hover:bg-white/5 dark:hover:text-[#d0d6e0]"
          >
            {t("createOwn")}
          </Link>
        </div>
      </div>
    </PublicCreatorLayout>
  );
}
