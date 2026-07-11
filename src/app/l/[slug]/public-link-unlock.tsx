"use client";

import Link from "next/link";
import {
  type MouseEvent,
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

import type { LinkDto } from "@/lib/api-client";
const ACTION_DELAY_SECONDS = 3;
const backgroundImages = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1465101178521-c1a9136a3f11?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "4",
    imageUrl: "https://images.unsplash.com/photo-1505483531331-5095d1f4b0f5?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "5",
    imageUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "6",
    imageUrl: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "7",
    imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "8",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
  },
];

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
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90",
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
  audiomack: "bg-yellow-500 hover:bg-yellow-600",
  beatstars: "bg-red-600 hover:bg-red-700",
  bandcamp: "bg-sky-600 hover:bg-sky-700",
  tidal: "bg-black hover:bg-slate-900",
  onlyfans: "bg-sky-500 hover:bg-sky-600",
  github: "bg-gray-900 hover:bg-black",
  productHunt: "bg-orange-600 hover:bg-orange-700",
  googlePlay: "bg-green-600 hover:bg-green-700",
  appStore: "bg-blue-600 hover:bg-blue-700",
  other: "bg-gray-700 hover:bg-gray-800",
};

function getActionIcon(action: string): LucideIcon {
  return actionIcons[action] ?? MousePointerClick;
}

function getPlatformColor(platform: string) {
  return platformColors[platform] ?? platformColors.other;
}

function formatAction(action: LinkDto["actions"][number]) {
  const label = actionLabels[action.action] || action.action;

  return `${label}`;
}

function getYouTubeEmbedUrl(value: string | null | undefined, muted = true) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    let id = "";

    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
        id = url.pathname.split("/").filter(Boolean)[1] || "";
      } else {
        id = url.searchParams.get("v") || "";
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      return "";
    }

    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=${
      muted ? "1" : "0"
    }&controls=0&loop=1&playlist=${id}&playsinline=1&modestbranding=1&rel=0&enablejsapi=1`;
  } catch {
    return "";
  }
}

export function PublicLinkUnlock({ link }: { link: LinkDto }) {
  const [remainingSecondsById, setRemainingSecondsById] = useState<
    Record<string, number>
  >({});

  const pendingActionIdsRef = useRef<Set<string>>(new Set());
  const countdownSecondsByIdRef = useRef<Record<string, number>>({});
  const youtubeBackgroundRef = useRef<HTMLIFrameElement | null>(null);
  const storageKey = `stu-unlock:${link.slug}`;

  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [snippetRevealed, setSnippetRevealed] = useState(false);
  const [youtubeMuted, setYoutubeMuted] = useState(true);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        const parsed = stored ? JSON.parse(stored) : [];

        setCompletedIds(
          Array.isArray(parsed)
            ? parsed.filter((value): value is string => typeof value === "string")
            : [],
        );
      } catch {
        setCompletedIds([]);
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [storageKey]);

  const actionIds = useMemo(
    () => link.actions.map((action, index) => action.id || `${index}`),
    [link.actions],
  );

  const completedCount = actionIds.filter((id) =>
    completedIds.includes(id),
  ).length;

  const totalActions = actionIds.length;
  const unlocked = totalActions === 0 || completedCount === totalActions;
  const progress =
    totalActions > 0 ? (completedCount / totalActions) * 100 : 100;

  const selectedBackground = backgroundImages.find(
    (background) =>
      background.id === link.backgroundSettings.selectedBackgroundId,
  );

  const backgroundMediaType = link.backgroundSettings.sameAsCoverImage
    ? "image"
    : link.backgroundSettings.backgroundMediaType;
  const backgroundMediaUrl = link.backgroundSettings.sameAsCoverImage
    ? link.coverImageUrl || selectedBackground?.imageUrl || null
    : link.backgroundSettings.backgroundMediaUrl || selectedBackground?.imageUrl || null;
  const backgroundImageUrl =
    backgroundMediaType === "image" ? backgroundMediaUrl : null;
  const backgroundVideoUrl =
    backgroundMediaType === "video" ? backgroundMediaUrl : null;
  const backgroundYouTubeUrl =
    backgroundMediaType === "youtube"
      ? getYouTubeEmbedUrl(backgroundMediaUrl, youtubeMuted)
      : "";

  const toggleYouTubeAudio = () => {
    const nextMuted = !youtubeMuted;
    setYoutubeMuted(nextMuted);

    youtubeBackgroundRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: nextMuted ? "mute" : "unMute",
        args: [],
      }),
      "https://www.youtube.com",
    );

    if (!nextMuted) {
      youtubeBackgroundRef.current?.contentWindow?.postMessage(
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
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Không chặn UI nếu trình duyệt không cho phép localStorage.
      }

      return next;
    });
  };

  const handleActionClick = (
    event: MouseEvent<HTMLAnchorElement>,
    id: string,
    url: string,
  ) => {
    const completed = completedIds.includes(id);

    // Action đã hoàn thành thì cho phép mở link ngay như bình thường.
    if (completed) {
      return;
    }

    // Chặn thẻ <a> mở URL ngay lập tức.
    event.preventDefault();

    // Ngăn người dùng click liên tục trước khi React kịp cập nhật state.
    if (pendingActionIdsRef.current.has(id)) {
      return;
    }

    pendingActionIdsRef.current.add(id);

    setLoadingIds((current) =>
      current.includes(id) ? current : [...current, id],
    );

    setRemainingSecondsById((current) => ({
      ...current,
      [id]: ACTION_DELAY_SECONDS,
    }));
    countdownSecondsByIdRef.current[id] = ACTION_DELAY_SECONDS;

    /*
     * Phải mở tab ngay trong sự kiện click.
     * Nếu gọi window.open sau setTimeout, trình duyệt có thể chặn popup.
     */
    const pendingTab = window.open("about:blank", "_blank");

    if (pendingTab) {
      try {
        pendingTab.document.write(`
        <!doctype html>
        <html lang="vi">
          <head>
            <meta charset="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <title>Vui lòng đợi...</title>

            <style>
              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                padding: 24px;
                background:
                  radial-gradient(circle at top, #eff6ff, transparent 45%),
                  #f8fafc;
                color: #0f172a;
                font-family:
                  Inter,
                  ui-sans-serif,
                  system-ui,
                  -apple-system,
                  BlinkMacSystemFont,
                  "Segoe UI",
                  sans-serif;
              }

              .card {
                width: min(100%, 380px);
                padding: 32px;
                text-align: center;
                border: 1px solid #e2e8f0;
                border-radius: 24px;
                background: rgba(255, 255, 255, 0.94);
                box-shadow: 0 20px 50px rgba(15, 23, 42, 0.1);
              }

              .spinner {
                width: 48px;
                height: 48px;
                margin: 0 auto 20px;
                border: 4px solid #dbeafe;
                border-top-color: #0284c7;
                border-radius: 9999px;
                animation: spin 0.8s linear infinite;
              }

              h1 {
                margin: 0;
                font-size: 22px;
              }

              p {
                margin: 10px 0 0;
                color: #64748b;
                font-size: 14px;
                line-height: 1.6;
              }

              @keyframes spin {
                to {
                  transform: rotate(360deg);
                }
              }
            </style>
          </head>

          <body>
            <div class="card">
              <div class="spinner"></div>
              <h1>Vui lòng đợi...</h1>
              <p>Hành động đang được chuẩn bị và sẽ tự động mở sau vài giây.</p>
            </div>
          </body>
        </html>
      `);

        pendingTab.document.close();

        // Không cho trang đích truy cập lại window.opener.
        pendingTab.opener = null;
      } catch {
        // Không chặn quy trình nếu trình duyệt không cho sửa about:blank.
      }
    }

    const countdownTimer = window.setInterval(() => {
      const secondsLeft = (countdownSecondsByIdRef.current[id] ?? ACTION_DELAY_SECONDS) - 1;
      countdownSecondsByIdRef.current[id] = secondsLeft;

      if (secondsLeft > 0) {
        setRemainingSecondsById((current) => ({
          ...current,
          [id]: secondsLeft,
        }));
      }
    }, 1000);

    window.setTimeout(() => {
      window.clearInterval(countdownTimer);

      markCompleted(id);

      setLoadingIds((current) =>
        current.filter((loadingId) => loadingId !== id),
      );

      setRemainingSecondsById((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      delete countdownSecondsByIdRef.current[id];

      pendingActionIdsRef.current.delete(id);

      if (pendingTab && !pendingTab.closed) {
        pendingTab.location.replace(url);
        return;
      }

      /*
       * Popup bị chặn: chuyển trang hiện tại sau thời gian chờ
       * để bảo đảm action vẫn được mở.
       */
      window.location.assign(url);
    }, ACTION_DELAY_SECONDS * 1000);
  };
  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-b from-slate-50 via-white to-slate-100 px-4 py-6 text-slate-900 sm:py-10">
      {backgroundImageUrl ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      ) : backgroundVideoUrl ? (
        <video
          aria-hidden="true"
          src={backgroundVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      ) : backgroundYouTubeUrl ? (
        <iframe
          ref={youtubeBackgroundRef}
          aria-hidden="true"
          src={backgroundYouTubeUrl}
          title="Background video"
          allow="autoplay; encrypted-media; picture-in-picture"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[266%] -translate-x-1/2 -translate-y-1/2 sm:h-[130%] sm:w-[231%]"
        />
      ) : null}

      <div className="absolute inset-0 bg-white/45" aria-hidden="true" />

      {backgroundYouTubeUrl ? (
        <button
          type="button"
          onClick={toggleYouTubeAudio}
          aria-label={youtubeMuted ? "Bật âm thanh nền" : "Tắt âm thanh nền"}
          title={youtubeMuted ? "Bật âm thanh nền" : "Tắt âm thanh nền"}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/50 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/60"
        >
          {youtubeMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>
      ) : null}

      <section className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-white/30 bg-white/55 shadow-xl backdrop-blur-md">
        <div className="p-4 sm:p-5">
          {link.coverImageUrl ? (
            <div className="mb-3 h-32 w-full overflow-hidden rounded-lg sm:h-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={link.coverImageUrl}
                alt={link.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <div className="text-center">

            <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950">
              {link.title}
            </h1>
            {link.subtitle ? (
              <p className="mt-1.5 text-sm font-medium leading-5 text-slate-500">
                {link.subtitle}
              </p>
            ) : <p className="mt-1.5 text-sm font-medium leading-5 text-slate-500">
              Complete the required actions to unlock the link.
            </p>}
          </div>

          <div className="mt-3 space-y-2.5">
            {link.actions.map((action, index) => {
              const id = action.id || `${index}`;
              const completed = completedIds.includes(id);
              const loading = loadingIds.includes(id);
              const ActionIcon = getActionIcon(action.action);
              const platformColor = getPlatformColor(action.platform);

              return (
                <a
                  key={id}
                  href={action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-busy={loading}
                  onClick={(event) =>
                    handleActionClick(event, id, action.url)
                  }
                  className={[
                    "group relative flex min-h-10 w-full items-center justify-between gap-3 overflow-hidden rounded-md px-3.5 py-2.5 text-sm font-bold text-white shadow-sm",
                    "transition-all duration-200 active:scale-[0.985]",
                    completed
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : loading
                        ? "cursor-wait bg-sky-600"
                        : platformColor,
                  ].join(" ")}
                >
                  {loading ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-sky-100"
                    >
                      <span className="block h-full w-1/2 animate-pulse rounded-full bg-sky-500" />
                    </span>
                  ) : null}

                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={[
                        "grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/20 text-white transition group-hover:bg-white/25",
                      ].join(" ")}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <ActionIcon className="h-5 w-5" />
                      )}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate">
                        {loading
                          ? `Vui lòng đợi ${
                              remainingSecondsById[id] ?? ACTION_DELAY_SECONDS
                            } giây...`
                          : formatAction(action)}
                      </span>
                    </span>
                  </span>

                  {loading ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-white/85">
                      <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                      Wait
                    </span>
                  ) : completed ? (
                    <span className="shrink-0 text-xs font-bold text-white/85">
                      Done
                    </span>
                  ) : (
                    <ExternalLink className="h-4 w-4 shrink-0 text-white/80 transition group-hover:text-white" />
                  )}
                </a>
              );
            })}
          </div>

          <div className="mt-4 p-1">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
              <span>Progress</span>
              <span className="text-emerald-600">
                {completedCount}/{totalActions || 0} done
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {link.inputType === "snippet" ? (
            <div className="mt-5">
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => setSnippetRevealed(true)}
                className={[
                  "flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-black text-white transition",
                  unlocked
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-300 text-white",
                ].join(" ")}
              >
                <FileText className="h-5 w-5" />
                Reveal snippet
              </button>
              {snippetRevealed && unlocked ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium leading-6 text-slate-800 shadow-sm">
                  {link.destinationUrl}
                </div>
              ) : null}
            </div>
          ) : (
            <a
              href={unlocked ? link.destinationUrl : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!unlocked}
              className={[
                "mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-black text-white transition",
                unlocked
                  ? "bg-green-600 hover:bg-green-700"
                  : "pointer-events-none bg-gray-300 text-white",
              ].join(" ")}
            >
              <LockKeyhole className="h-5 w-5" />
              {link.inputType === "file" ? "Unlock file" : "Unlock link"}
            </a>
          )}

          <Link
            href="/"
            className="mt-4 block text-center text-sm font-bold text-slate-500 transition hover:text-slate-950"
          >
            Create your own link
          </Link>
        </div>
      </section>
    </main>
  );
}
