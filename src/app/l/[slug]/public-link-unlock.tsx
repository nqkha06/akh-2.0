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

    const completionTimeoutId =
      window.setTimeout(() => {
        finishAction(id);
      }, ACTION_DELAY_SECONDS * 1000);

    completionTimeoutIdsRef.current.set(
      id,
      completionTimeoutId,
    );
  };

  return (
    <PublicCreatorLayout
      background={
        backgroundImageUrl ||
        backgroundVideoUrl ||
        backgroundYouTubeUrl ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            {backgroundImageUrl ? (
              <div
                className="absolute inset-0 scale-105 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${backgroundImageUrl})`,
                }}
              />
            ) : backgroundVideoUrl ? (
              <video
                src={backgroundVideoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 size-full object-cover"
              />
            ) : backgroundYouTubeUrl ? (
              <iframe
                ref={youtubeBackgroundRef}
                src={backgroundYouTubeUrl}
                title="Background video"
                allow="autoplay; encrypted-media; picture-in-picture"
                className="absolute left-1/2 top-1/2 h-[150%] w-[267%] -translate-x-1/2 -translate-y-1/2 sm:h-[135%] sm:w-[240%]"
              />
            ) : null}

            <div className="absolute inset-0 bg-slate-950/45" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_42%)]" />

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/30" />
          </div>
        ) : null
      }
      topAction={
        backgroundYouTubeUrl ? (
          <button
            type="button"
            onClick={toggleYouTubeAudio}
            aria-label={
              youtubeMuted
                ? "Enable background audio"
                : "Mute background audio"
            }
            title={
              youtubeMuted
                ? "Enable background audio"
                : "Mute background audio"
            }
            className="grid size-11 place-items-center rounded-full border border-white/30 bg-slate-950/55 text-white shadow-xl backdrop-blur-xl transition duration-200 hover:scale-105 hover:bg-slate-950/70 active:scale-95"
          >
            {youtubeMuted ? (
              <VolumeX className="size-5" />
            ) : (
              <Volume2 className="size-5" />
            )}
          </button>
        ) : undefined
      }
    >
      <main className="mx-auto w-full max-w-[460px] px-3 py-4 sm:px-0">
        <section className="overflow-hidden rounded-[28px] border border-white/40 bg-white/95 shadow-[0_28px_90px_rgba(15,23,42,0.32)] backdrop-blur-2xl">
          <div className="p-4 sm:p-5">
            {link.coverImageUrl ? (
              <div className="relative mb-5 overflow-hidden rounded-[22px] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={link.coverImageUrl}
                  alt={link.title}
                  className="aspect-[16/7] w-full object-cover sm:aspect-[16/8]"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
              </div>
            ) : null}

            <header className="text-center">
              

              <h1 className="mt-3 text-balance text-2xl font-black tracking-tight text-slate-950 sm:text-[28px]">
                {link.title}
              </h1>

              <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500">
                {link.subtitle ||
                  "Complete the required actions to unlock the content."}
              </p>
            </header>

            <div className="mt-4 space-y-2.5">
              {link.actions.map(
                (action, index) => {
                  const id =
                    action.id || `${index}`;

                  const completed =
                    completedIdSet.has(id);

                  const loading =
                    loadingIdSet.has(id);

                  const ActionIcon =
                    getActionIcon(action.action);

                  const platformColor =
                    getPlatformColor(
                      action.platform,
                    );

                  const remainingSeconds =
                    remainingSecondsById[id] ??
                    ACTION_DELAY_SECONDS;

                  const countdownProgress =
                    ((ACTION_DELAY_SECONDS -
                      remainingSeconds +
                      1) /
                      ACTION_DELAY_SECONDS) *
                    100;

                  return (
                    <a
                      key={id}
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-busy={loading}
                      aria-disabled={loading}
                      onClick={() =>
                        handleActionClick(id)
                      }
                      className={[
                        "group relative flex min-h-[58px] w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-2.5 text-left text-white",
                        "shadow-sm ring-1 ring-inset ring-white/15 transition-all duration-200",
                        "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.985]",
                        completed
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : loading
                            ? "cursor-wait bg-slate-900"
                            : platformColor,
                      ].join(" ")}
                    >
                      {loading ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-white/15"
                        >
                          <span
                            className="block h-full rounded-full bg-white/80 transition-[width] duration-1000 ease-linear"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  countdownProgress,
                                  0,
                                ),
                                100,
                              )}%`,
                            }}
                          />
                        </span>
                      ) : null}

                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 shadow-inner ring-1 ring-white/15 transition group-hover:bg-white/20">
                        {loading ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : completed ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <ActionIcon className="size-5" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold">
                          {loading
                            ? "Preparing action..."
                            : formatAction(action)}
                        </span>

                        <span className="mt-0.5 block truncate text-[11px] font-semibold text-white/70">
                          {loading
                            ? "The page will open automatically"
                            : completed
                              ? "Completed — tap to open again"
                              : "Opens in a new tab"}
                        </span>
                      </span>

                      {loading ? (
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-black tabular-nums">
                          {remainingSeconds}s
                        </span>
                      ) : completed ? (
                        <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-extrabold">
                          Done
                        </span>
                      ) : (
                        <ExternalLink className="size-4 shrink-0 text-white/75 transition duration-200 group-hover:translate-x-0.5 group-hover:text-white" />
                      )}
                    </a>
                  );
                },
              )}
            </div>
            

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    Your progress
                  </p>

                  
                </div>

                <span
                  className={[
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-black",
                    unlocked
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200",
                  ].join(" ")}
                >
                  {completedCount}/{totalActions}
                </span>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={[
                    "h-full rounded-full transition-[width] duration-700 ease-out",
                    unlocked
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-sky-500 to-blue-600",
                  ].join(" ")}
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
            
            {link.inputType === "snippet" ? (
              <div className="mt-5">
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() =>
                    setSnippetRevealed(true)
                  }
                  className={[
                    "flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition-all duration-200",
                    unlocked
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.985]"
                      : "cursor-not-allowed bg-slate-200 text-slate-500",
                  ].join(" ")}
                >
                  {unlocked ? (
                    <FileText className="size-5" />
                  ) : (
                    <LockKeyhole className="size-5" />
                  )}

                  {unlocked
                    ? snippetRevealed
                      ? "Snippet revealed"
                      : "Reveal snippet"
                    : `Unlock snippet`}
                </button>

                {snippetRevealed &&
                unlocked ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-lg">
                    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                      <FileText className="size-4 text-slate-400" />

                      <span className="text-xs font-bold text-slate-300">
                        Unlocked content
                      </span>
                    </div>

                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-slate-100">
                      {link.destinationUrl}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : (
              <a
                href={
                  unlocked
                    ? link.destinationUrl
                    : undefined
                }
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!unlocked}
                className={[
                  "mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition-all duration-200",
                  unlocked
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.985]"
                    : "pointer-events-none cursor-not-allowed bg-slate-200 text-slate-500",
                ].join(" ")}
              >
                {unlocked ? (
                  <ExternalLink className="size-5" />
                ) : (
                  <LockKeyhole className="size-5" />
                )}

                {unlocked
                  ? link.inputType === "file"
                    ? "Open file"
                    : "Continue to link"
                  : `Unlock link`}
              </a>
            )}
          </div>

          
        </section>

        <Link
          href="/member/create"
          className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full border border-white/30 bg-white/80 px-4 py-2 text-xs font-extrabold text-slate-700 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
        >
          <MousePointerClick className="size-3.5" />
          Create your own link
        </Link>
      </main>
    </PublicCreatorLayout>
  );
}
