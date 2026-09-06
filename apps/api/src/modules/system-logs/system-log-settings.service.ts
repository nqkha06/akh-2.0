import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import type {
  CreateSystemLogCategoryDto,
  UpdateSystemLogCategoryDto,
} from "./dto/system-log-category.dto";
import type { UpdateSystemLogSettingsDto } from "./dto/update-system-log-settings.dto";
import { DEFAULT_SYSTEM_LOG_CATEGORIES } from "./system-log.constants";
import { SystemLogRepository } from "./system-log.repository";

const defaultCategoryDescriptions: Record<string, string> = {
  SYSTEM: "Lifecycle và vận hành lõi của hệ thống.",
  HTTP: "Sự kiện ở lớp HTTP và request pipeline.",
  AUTH: "Đăng nhập, phiên và xác thực.",
  ADMIN: "Thao tác vận hành của quản trị viên.",
  QUEUE: "Producer, worker và trạng thái job.",
  CRON: "Scheduled jobs và cleanup.",
  DATABASE: "Kết nối và lỗi persistence.",
  API: "Tích hợp và hành vi API ứng dụng.",
  INTEGRATION: "Dịch vụ bên thứ ba.",
  SECURITY: "Sự kiện bảo mật cần lưu giữ dài hạn.",
  BUSINESS: "Sự kiện nghiệp vụ quan trọng.",
  ERROR: "Exception và lỗi hệ thống quan trọng.",
};

const defaultRetentionRules = [
  ["GLOBAL", 30],
  ["CATEGORY:HTTP", 7],
  ["LEVEL:DEBUG", 7],
  ["CATEGORY:SYSTEM", 30],
  ["CATEGORY:ERROR", 90],
  ["CATEGORY:SECURITY", 180],
] as const;

@Injectable()
export class SystemLogSettingsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logs: SystemLogRepository,
  ) {}

  async onModuleInit() {
    await this.prisma.$transaction(async (transaction) => {
      for (const [index, key] of DEFAULT_SYSTEM_LOG_CATEGORIES.entries()) {
        await transaction.systemLogCategory.upsert({
          where: { key },
          update: {},
          create: {
            key,
            name: titleCase(key),
            description: defaultCategoryDescriptions[key],
            sortOrder: (index + 1) * 10,
          },
        });
      }
      for (const [scope, retentionDays] of defaultRetentionRules) {
        await transaction.systemLogRetentionSetting.upsert({
          where: { scope },
          update: {},
          create: { scope, retentionDays },
        });
      }
    });
  }

  async getSettings() {
    const [settings, categories] = await Promise.all([
      this.prisma.systemLogRetentionSetting.findMany({
        orderBy: [{ scope: "asc" }],
      }),
      this.listCategories(),
    ]);
    const global = settings.find((setting) => setting.scope === "GLOBAL");
    return {
      globalRetentionDays: global?.retentionDays ?? 30,
      rules: settings.filter((setting) => setting.scope !== "GLOBAL"),
      categories,
    };
  }

  async updateSettings(dto: UpdateSystemLogSettingsDto, adminId: number) {
    const scopes = dto.rules.map((rule) => rule.scope);
    if (scopes.includes("GLOBAL") || new Set(scopes).size !== scopes.length) {
      throw new BadRequestException("Retention scope bị trùng hoặc không hợp lệ.");
    }
    const categoryKeys = scopes
      .filter((scope) => scope.startsWith("CATEGORY:"))
      .map((scope) => scope.slice("CATEGORY:".length));
    if (categoryKeys.length) {
      const count = await this.prisma.systemLogCategory.count({
        where: { key: { in: categoryKeys } },
      });
      if (count !== new Set(categoryKeys).size) {
        throw new BadRequestException("Retention chứa category không tồn tại.");
      }
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.systemLogRetentionSetting.upsert({
        where: { scope: "GLOBAL" },
        update: { retentionDays: dto.globalRetentionDays, enabled: true, updatedById: adminId },
        create: { scope: "GLOBAL", retentionDays: dto.globalRetentionDays, enabled: true, updatedById: adminId },
      });
      await transaction.systemLogRetentionSetting.deleteMany({
        where: { scope: { not: "GLOBAL", notIn: scopes } },
      });
      for (const rule of dto.rules) {
        await transaction.systemLogRetentionSetting.upsert({
          where: { scope: rule.scope },
          update: { retentionDays: rule.retentionDays, enabled: rule.enabled, updatedById: adminId },
          create: { ...rule, updatedById: adminId },
        });
      }
    });
    return this.getSettings();
  }

  listCategories() {
    return this.prisma.systemLogCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
    });
  }

  async createCategory(dto: CreateSystemLogCategoryDto) {
    try {
      return await this.prisma.systemLogCategory.create({
        data: {
          key: dto.key.trim().toUpperCase(),
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          isActive: dto.isActive,
          sortOrder: dto.sortOrder,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Category key đã tồn tại.");
      }
      throw error;
    }
  }

  async updateCategory(id: number, dto: UpdateSystemLogCategoryDto) {
    const existing = await this.prisma.systemLogCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("System log category không tồn tại.");
    return this.prisma.systemLogCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async cleanupExpired(now = new Date()) {
    const rules = await this.prisma.systemLogRetentionSetting.findMany({
      where: { enabled: true },
    });
    const categoryRules = rules.filter((rule) => rule.scope.startsWith("CATEGORY:"));
    const levelRules = rules.filter((rule) => rule.scope.startsWith("LEVEL:"));
    const explicitCategories = categoryRules.map((rule) => rule.scope.slice(9));
    const explicitLevels = levelRules.map((rule) => rule.scope.slice(6).toLowerCase());
    const results: Array<{ scope: string; deletedCount: number }> = [];

    for (const rule of categoryRules) {
      const result = await this.logs.deleteWhereInBatches({
          category: rule.scope.slice(9),
          createdAt: { lt: cutoff(now, rule.retentionDays) },
      });
      results.push({ scope: rule.scope, deletedCount: result.count });
    }
    for (const rule of levelRules) {
      const result = await this.logs.deleteWhereInBatches({
          level: rule.scope.slice(6).toLowerCase(),
          ...(explicitCategories.length
            ? { category: { notIn: explicitCategories } }
            : {}),
          createdAt: { lt: cutoff(now, rule.retentionDays) },
      });
      results.push({ scope: rule.scope, deletedCount: result.count });
    }
    const global = rules.find((rule) => rule.scope === "GLOBAL");
    if (global) {
      const result = await this.logs.deleteWhereInBatches({
          ...(explicitCategories.length
            ? { category: { notIn: explicitCategories } }
            : {}),
          ...(explicitLevels.length ? { level: { notIn: explicitLevels } } : {}),
          createdAt: { lt: cutoff(now, global.retentionDays) },
      });
      results.push({ scope: global.scope, deletedCount: result.count });
    }
    return {
      deletedCount: results.reduce((sum, result) => sum + result.deletedCount, 0),
      results,
    };
  }
}

function cutoff(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1_000);
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
