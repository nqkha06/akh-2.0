import { PrismaClient } from "@prisma/client";
import { permissionCatalog } from "@stu/contracts";
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
    destinationUrl: "/api/backend/files/demo-pack/download",
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

const defaultMonetizationLevels = [
  {
    key: "clean",
    status: "published",
    isDefault: false,
    sortOrder: 10,
    profitBps: 100,
    stepCount: 1,
    densities: {
      popup: "limited",
      banner: "none",
      interstitial: "none",
      notification: "none",
    },
    translations: {
      vi: {
        name: "Sạch",
        description:
          "Trải nghiệm nhẹ, chỉ có quảng cáo pop-up mật độ giới hạn.",
      },
      en: {
        name: "Clean",
        description: "A light experience with limited popup advertising.",
      },
    },
  },
  {
    key: "balanced",
    status: "published",
    isDefault: true,
    sortOrder: 20,
    profitBps: 300,
    stepCount: 2,
    densities: {
      popup: "limited",
      banner: "limited",
      interstitial: "limited",
      notification: "none",
    },
    translations: {
      vi: {
        name: "Cân bằng",
        description: "Cân bằng doanh thu và trải nghiệm của người truy cập.",
      },
      en: {
        name: "Balanced",
        description: "Balances revenue with the visitor experience.",
      },
    },
  },
  {
    key: "maximum",
    status: "published",
    isDefault: false,
    sortOrder: 30,
    profitBps: 500,
    stepCount: 3,
    densities: {
      popup: "maximum",
      banner: "maximum",
      interstitial: "maximum",
      notification: "limited",
    },
    translations: {
      vi: {
        name: "Tối đa",
        description: "Ưu tiên doanh thu với mật độ quảng cáo cao.",
      },
      en: {
        name: "Maximum",
        description: "Prioritizes revenue with a higher advertising density.",
      },
    },
  },
] as const;

const loyaltyBenefitCatalog = [
  { key: "cpm_bonus", vi: "Thưởng CPM", en: "CPM bonus" },
  {
    key: "analytics_history",
    vi: "Lịch sử phân tích",
    en: "Analytics history",
  },
  { key: "custom_slugs", vi: "Custom slug", en: "Custom slugs" },
  {
    key: "link_scheduling",
    vi: "Lập lịch bật hoặc tắt link",
    en: "Link scheduling",
  },
  { key: "csv_export", vi: "Xuất báo cáo CSV", en: "CSV report export" },
  {
    key: "storage_bonus",
    vi: "Tăng dung lượng lưu trữ",
    en: "Additional storage",
  },
  { key: "custom_qr", vi: "Tùy chỉnh QR code", en: "Custom QR codes" },
  {
    key: "priority_support",
    vi: "Hỗ trợ ưu tiên",
    en: "Priority support",
  },
] as const;

type LoyaltyBenefitKey = (typeof loyaltyBenefitCatalog)[number]["key"];
type LoyaltyBenefitValues = Partial<
  Record<LoyaltyBenefitKey, string | null>
>;

function loyaltyBenefits(
  locale: "vi" | "en",
  included: LoyaltyBenefitValues,
) {
  return loyaltyBenefitCatalog.map((benefit) => ({
    key: benefit.key,
    label: benefit[locale],
    included: Object.prototype.hasOwnProperty.call(included, benefit.key),
    value: included[benefit.key] ?? null,
  }));
}

const defaultLoyaltyTiers = [
  {
    key: "started",
    minimumValidViews: 0,
    sortOrder: 10,
    iconKey: "sparkles",
    translations: {
      vi: {
        name: "Khởi đầu",
        description: "Các công cụ cơ bản để bắt đầu tích lũy lượt xem hợp lệ.",
        included: { analytics_history: "7 ngày" },
      },
      en: {
        name: "Starter",
        description: "Core tools for starting to collect valid views.",
        included: { analytics_history: "7 days" },
      },
    },
  },
  {
    key: "bronze",
    minimumValidViews: 1_000,
    sortOrder: 20,
    iconKey: "shield-check",
    translations: {
      vi: {
        name: "Đồng",
        description: "Dành cho creator đang xây dựng lưu lượng ổn định.",
        included: {
          cpm_bonus: "+1%",
          analytics_history: "30 ngày",
          custom_slugs: "5 mỗi tháng",
        },
      },
      en: {
        name: "Bronze",
        description: "For creators building a consistent traffic base.",
        included: {
          cpm_bonus: "+1%",
          analytics_history: "30 days",
          custom_slugs: "5 per month",
        },
      },
    },
  },
  {
    key: "gold",
    minimumValidViews: 5_000,
    sortOrder: 30,
    iconKey: "trophy",
    translations: {
      vi: {
        name: "Vàng",
        description: "Bộ quyền lợi hiển thị cho creator có lưu lượng tăng trưởng.",
        included: {
          cpm_bonus: "+3%",
          analytics_history: "90 ngày",
          custom_slugs: "5 mỗi tháng",
          link_scheduling: null,
          csv_export: null,
          storage_bonus: null,
        },
      },
      en: {
        name: "Gold",
        description: "Displayed benefits for creators with growing traffic.",
        included: {
          cpm_bonus: "+3%",
          analytics_history: "90 days",
          custom_slugs: "5 per month",
          link_scheduling: null,
          csv_export: null,
          storage_bonus: null,
        },
      },
    },
  },
  {
    key: "diamond",
    minimumValidViews: 10_000,
    sortOrder: 40,
    iconKey: "gem",
    translations: {
      vi: {
        name: "Kim cương",
        description: "Hạng cao nhất trong danh mục Loyalty hiện tại.",
        included: {
          cpm_bonus: "+5%",
          analytics_history: "90 ngày",
          custom_slugs: "Tăng giới hạn",
          link_scheduling: null,
          csv_export: null,
          storage_bonus: null,
          custom_qr: null,
          priority_support: null,
        },
      },
      en: {
        name: "Diamond",
        description: "The highest tier in the current Loyalty catalog.",
        included: {
          cpm_bonus: "+5%",
          analytics_history: "90 days",
          custom_slugs: "Higher limit",
          link_scheduling: null,
          csv_export: null,
          storage_bonus: null,
          custom_qr: null,
          priority_support: null,
        },
      },
    },
  },
] as const;

async function main() {
  const demoPasswordHash = await hash("Demo123!", 12);

  await prisma.language.upsert({
    where: { locale: "vi" },
    update: {
      name: "Vietnamese",
      nativeName: "Tiếng Việt",
      code: "vi",
      regional: "vi-VN",
      flag: "VN",
      status: "published",
      sortOrder: 10,
      isRtl: false,
    },
    create: {
      name: "Vietnamese",
      nativeName: "Tiếng Việt",
      locale: "vi",
      code: "vi",
      regional: "vi-VN",
      flag: "VN",
      isDefault: true,
      status: "published",
      sortOrder: 10,
      isRtl: false,
    },
  });
  await prisma.language.upsert({
    where: { locale: "en" },
    update: {
      name: "English",
      nativeName: "English",
      code: "en",
      regional: "en-US",
      flag: "US",
      status: "published",
      sortOrder: 20,
      isRtl: false,
    },
    create: {
      name: "English",
      nativeName: "English",
      locale: "en",
      code: "en",
      regional: "en-US",
      flag: "US",
      status: "published",
      sortOrder: 20,
      isRtl: false,
    },
  });

  for (const permission of permissionCatalog) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: permission,
      create: permission,
    });
  }
  const adminRole = await prisma.role.upsert({
    where: { key: "admin" },
    update: { isSystem: true },
    create: {
      key: "admin",
      name: "Administrator",
      description: "Toàn quyền quản trị hệ thống.",
      isSystem: true,
    },
  });
  const memberRole = await prisma.role.upsert({
    where: { key: "member" },
    update: { isSystem: true },
    create: {
      key: "member",
      name: "Member",
      description: "Tài khoản thành viên mặc định.",
      isSystem: true,
    },
  });
  const permissions = await prisma.permission.findMany({
    select: { id: true },
  });
  for (const permission of permissions) {
    await prisma.roleHasPermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const monetizationLevelCount = await prisma.monetizationLevel.count();
  if (monetizationLevelCount === 0) {
    for (const level of defaultMonetizationLevels) {
      await prisma.monetizationLevel.create({
        data: {
          key: level.key,
          status: level.status,
          isDefault: level.isDefault,
          sortOrder: level.sortOrder,
          routesJson: "[]",
          ratesJson: "[]",
          metaDataJson: JSON.stringify({
            version: 1,
            profitBps: level.profitBps,
            stepCount: level.stepCount,
            visitorExperience: level.densities,
          }),
          translations: {
            create: Object.entries(level.translations).map(
              ([locale, translation]) => ({
                locale,
                ...translation,
              }),
            ),
          },
        },
      });
    }
  }

  for (const tier of defaultLoyaltyTiers) {
    const loyaltyTier = await prisma.loyaltyTier.upsert({
      where: { key: tier.key },
      update: {
        minimumValidViews: tier.minimumValidViews,
        sortOrder: tier.sortOrder,
        iconKey: tier.iconKey,
        status: "published",
      },
      create: {
        key: tier.key,
        minimumValidViews: tier.minimumValidViews,
        sortOrder: tier.sortOrder,
        iconKey: tier.iconKey,
        status: "published",
      },
    });

    for (const locale of ["vi", "en"] as const) {
      const translation = tier.translations[locale];
      await prisma.loyaltyTierTranslation.upsert({
        where: {
          tierId_locale: { tierId: loyaltyTier.id, locale },
        },
        update: {
          name: translation.name,
          description: translation.description,
          benefitsJson: JSON.stringify(
            loyaltyBenefits(locale, translation.included),
          ),
        },
        create: {
          tierId: loyaltyTier.id,
          locale,
          name: translation.name,
          description: translation.description,
          benefitsJson: JSON.stringify(
            loyaltyBenefits(locale, translation.included),
          ),
        },
      });
    }
  }

  const defaultMonetizationLevel = await prisma.monetizationLevel.findFirst({
    where: { isDefault: true, status: "published" },
    select: { id: true },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@linkicom.local" },
    update: {
      name: "Linkicom Demo",
      passwordHash: demoPasswordHash,
      status: "active",
    },
    create: {
      name: "Linkicom Demo",
      email: "demo@linkicom.local",
      passwordHash: demoPasswordHash,
      emailVerifiedAt: new Date(),
      status: "active",
      monetizationLevelId: defaultMonetizationLevel?.id,
    },
  });
  if (demoUser.monetizationLevelId === null && defaultMonetizationLevel) {
    await prisma.user.update({
      where: { id: demoUser.id },
      data: { monetizationLevelId: defaultMonetizationLevel.id },
    });
  }
  await prisma.userHasRole.upsert({
    where: {
      roleId_userId: { roleId: memberRole.id, userId: demoUser.id },
    },
    update: {},
    create: { roleId: memberRole.id, userId: demoUser.id },
  });

  const demoSnippetIds = new Map<string, number>();
  for (const snippet of demoSnippets) {
    const existing = await prisma.snippet.findFirst({
      where: { userId: demoUser.id, name: snippet.name },
      orderBy: { id: "asc" },
    });
    const record = existing
      ? await prisma.snippet.update({
          where: { id: existing.id },
          data: {
            name: snippet.name,
            content: snippet.content,
            deletedAt: null,
          },
        })
      : await prisma.snippet.create({
          data: {
            userId: demoUser.id,
            name: snippet.name,
            content: snippet.content,
          },
        });
    demoSnippetIds.set(snippet.id, record.id);
  }

  for (const link of demoLinks) {
    const { actions } = link;
    const appearanceJson = JSON.stringify({
      coverImageUrl:
        "coverImageUrl" in link ? (link.coverImageUrl ?? null) : null,
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
    const destinationSnippetKey =
      link.inputType === "snippet" && "selectedSnippet" in link
        ? link.selectedSnippet
        : null;
    const destinationSnippetId = destinationSnippetKey
      ? demoSnippetIds.get(destinationSnippetKey) ?? null
      : null;
    const expiresAt =
      "expiryEnabled" in link &&
      link.expiryEnabled &&
      link.expiryType === "date"
        ? link.expiryDate
        : null;
    const maxClicks =
      "expiryEnabled" in link &&
      link.expiryEnabled &&
      link.expiryType === "clicks"
        ? link.maxClicks
        : null;
    const data = {
      userId: demoUser.id,
      slug: link.slug,
      title: link.title,
      subtitle: link.subtitle,
      destinationType: link.inputType,
      destinationUrl:
        link.inputType === "snippet" && destinationSnippetId
          ? null
          : link.destinationUrl,
      destinationFileId: null,
      destinationSnippetId,
      destinationSnippetContent:
        link.inputType === "snippet" && destinationSnippetKey
          ? demoSnippets.find((snippet) => snippet.id === destinationSnippetKey)
              ?.content ?? null
          : null,
      appearanceJson,
      expiresAt,
      maxClicks,
      views: link.clicks,
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
