import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const demoSnippets = [
  {
    id: "demo-snippet-welcome",
    name: "Welcome Message",
    content: "Welcome to our exclusive content!",
  },
  {
    id: "demo-snippet-coupon",
    name: "Limited Offer",
    content: "Get 50% off on your first purchase",
  },
  {
    id: "demo-snippet-newsletter",
    name: "Newsletter Signup",
    content: "Subscribe to our newsletter for updates",
  },
];

const demoLinks = [
  {
    slug: "music-drop",
    destinationUrl: "https://open.spotify.com/artist/demo",
    title: "Music drop unlock",
    inputType: "url",
    subtitle: "Follow and watch to unlock the new track.",
    customAlias: "music-drop",
    coverImageUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    clicks: 1820,
    status: "active",
    selectedBackgroundId: "1",
    selectedBackgroundName: "Neon Flow",
    backgroundMediaType: "image",
    backgroundMediaUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80",
    actions: [
      {
        platform: "youtube",
        action: "watch",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        platform: "spotify",
        action: "follow-artist",
        url: "https://open.spotify.com/artist/demo",
      },
    ],
  },
  {
    slug: "creator-pack",
    destinationUrl: "/api/files/demo-pack/download",
    title: "Creator preset pack",
    inputType: "file",
    selectedFile: "demo-file-pack",
    subtitle: "Complete social actions to download the preset pack.",
    customAlias: "creator-pack",
    coverImageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
    expiryEnabled: true,
    expiryType: "clicks",
    maxClicks: 5000,
    clicks: 742,
    status: "active",
    selectedBackgroundId: "6",
    selectedBackgroundName: "Chromatic Wave",
    backgroundMediaType: "image",
    backgroundMediaUrl:
      "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1400&q=80",
    actions: [
      {
        platform: "instagram",
        action: "follow",
        url: "https://instagram.com/demo",
      },
      {
        platform: "tiktok",
        action: "follow",
        url: "https://tiktok.com/@demo",
      },
    ],
  },
  {
    slug: "summer-code",
    destinationUrl: "SUMMER-25-OFF",
    title: "Summer coupon code",
    inputType: "snippet",
    selectedSnippet: "demo-snippet-coupon",
    subtitle: "Reveal a limited coupon after joining the community.",
    customAlias: "summer-code",
    expiryEnabled: true,
    expiryType: "date",
    expiryDate: new Date("2026-08-01T00:00:00.000Z"),
    expiryTime: "23:59",
    clicks: 96,
    status: "paused",
    selectedBackgroundId: "youtube",
    selectedBackgroundName: "YouTube video",
    backgroundMediaType: "youtube",
    backgroundMediaUrl: "https://www.youtube.com/watch?v=3EEnvO0yMHY",
    actions: [
      {
        platform: "discord",
        action: "join-server",
        url: "https://discord.gg/demo",
      },
    ],
  },
  {
    slug: "launch-upvote",
    destinationUrl: "https://www.producthunt.com/posts/demo",
    title: "Product launch boost",
    inputType: "url",
    subtitle: "Upvote and follow the maker to unlock the bonus.",
    customAlias: "launch-upvote",
    coverImageUrl:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    clicks: 311,
    status: "inactive",
    selectedBackgroundId: "15",
    selectedBackgroundName: "Midnight Bloom",
    backgroundMediaType: "image",
    backgroundMediaUrl:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80",
    actions: [
      {
        platform: "productHunt",
        action: "upvote-product",
        url: "https://www.producthunt.com/posts/demo",
      },
      {
        platform: "twitter",
        action: "follow",
        url: "https://x.com/demo",
      },
    ],
  },
  {
    slug: "join-channel",
    destinationUrl: "https://t.me/demo",
    title: "Telegram community invite",
    inputType: "url",
    subtitle: "Join the channel and unlock the private resource.",
    customAlias: "join-channel",
    clicks: 58,
    status: "active",
    selectedBackgroundId: "17",
    selectedBackgroundName: "Tropical Echo",
    backgroundMediaType: "image",
    backgroundMediaUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    actions: [
      {
        platform: "telegram",
        action: "join-channel",
        url: "https://t.me/demo",
      },
    ],
  },
];

async function main() {
  const demoPasswordHash = await hash("Demo123!", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@linkicom.local" },
    update: {
      name: "Linkicom Demo",
      passwordHash: demoPasswordHash,
      status: "active",
      role: "member",
    },
    create: {
      name: "Linkicom Demo",
      email: "demo@linkicom.local",
      passwordHash: demoPasswordHash,
      emailVerifiedAt: new Date(),
      status: "active",
      role: "member",
    },
  });

  for (const snippet of demoSnippets) {
    await prisma.snippet.upsert({
      where: { id: snippet.id },
      update: snippet,
      create: snippet,
    });
  }

  for (const link of demoLinks) {
    const { actions } = link;
    const appearanceJson = JSON.stringify({
      coverImageUrl: "coverImageUrl" in link ? link.coverImageUrl ?? null : null,
      backgroundSettings: {
        selectedBackgroundId: link.selectedBackgroundId ?? null,
        selectedBackgroundName: link.selectedBackgroundName ?? null,
        backgroundMediaType: link.backgroundMediaType ?? null,
        backgroundMediaUrl: link.backgroundMediaUrl ?? null,
        sameAsCoverImage: false,
        effects: {
          opacity: 100,
          blur: 0,
          saturation: 100,
          contrast: 100,
          grayscale: 0,
        },
      },
    });
    const destinationSnippetId =
      link.inputType === "snippet" && "selectedSnippet" in link
        ? link.selectedSnippet
        : null;
    const expiresAt =
      "expiryEnabled" in link && link.expiryEnabled && link.expiryType === "date"
        ? link.expiryDate
        : null;
    const maxClicks =
      "expiryEnabled" in link && link.expiryEnabled && link.expiryType === "clicks"
        ? link.maxClicks
        : null;
    const data = {
      userId: demoUser.id,
      slug: link.slug,
      title: link.title,
      subtitle: link.subtitle,
      destinationType: link.inputType,
      destinationUrl: link.inputType === "snippet" && destinationSnippetId ? null : link.destinationUrl,
      destinationFileId: null,
      destinationSnippetId,
      appearanceJson,
      expiresAt,
      maxClicks,
      clicks: link.clicks,
      status: link.status,
    };

    await prisma.link.upsert({
      where: {
        slug: link.slug,
      },
      update: {
        ...data,
        actions: {
          deleteMany: {},
          create: actions.map((action, position) => ({ ...action, position })),
        },
      },
      create: {
        ...data,
        actions: {
          create: actions.map((action, position) => ({ ...action, position })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    throw error;
  });
