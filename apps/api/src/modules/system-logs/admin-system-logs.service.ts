import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { BulkDeleteSystemLogsDto, CleanupSystemLogsDto } from "./dto/delete-system-logs.dto";
import type { ListSystemLogsQueryDto } from "./dto/list-system-logs-query.dto";
import { SystemLogRepository } from "./system-log.repository";

@Injectable()
export class AdminSystemLogsService {
  constructor(private readonly repository: SystemLogRepository) {}

  findAll(query: ListSystemLogsQueryDto) {
    this.validateRange(query.from, query.to);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    const log = await this.repository.findOne(id);
    if (!log) throw new NotFoundException("System log không tồn tại.");
    return log;
  }

  stats() {
    return this.repository.stats();
  }

  async deleteOne(id: string) {
    const result = await this.repository.deleteOne(id);
    if (!result.count) throw new NotFoundException("System log không tồn tại.");
    return { deletedCount: result.count };
  }

  async bulkDelete(dto: BulkDeleteSystemLogsDto) {
    const ids = [...new Set(dto.ids.map((id) => id.trim()).filter(Boolean))];
    if (!ids.length) throw new BadRequestException("Chưa chọn log để xóa.");
    const result = await this.repository.deleteMany(ids);
    return { requestedCount: ids.length, deletedCount: result.count };
  }

  async cleanup(dto: CleanupSystemLogsDto) {
    const where = this.cleanupWhere(dto);
    const matchedCount = await this.repository.count(where);
    if (dto.dryRun) return { dryRun: true, matchedCount, deletedCount: 0 };
    const result = await this.repository.deleteWhereInBatches(where);
    return {
      dryRun: false,
      matchedCount,
      deletedCount: result.count,
    };
  }

  private cleanupWhere(dto: CleanupSystemLogsDto): Prisma.SystemLogWhereInput {
    if (dto.mode === "older_than") {
      if (dto.days && dto.before) {
        throw new BadRequestException("Chỉ chọn số ngày hoặc ngày tùy chỉnh.");
      }
      const before = dto.before
        ? new Date(dto.before)
        : dto.days
          ? new Date(Date.now() - dto.days * 24 * 60 * 60 * 1_000)
          : null;
      if (!before || Number.isNaN(before.getTime())) {
        throw new BadRequestException("Mốc thời gian cleanup không hợp lệ.");
      }
      return { createdAt: { lt: before } };
    }

    if (!dto.from || !dto.to) {
      throw new BadRequestException("Khoảng thời gian cleanup chưa đầy đủ.");
    }
    const from = new Date(dto.from);
    const to = new Date(dto.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      throw new BadRequestException("Khoảng thời gian cleanup không hợp lệ.");
    }
    return { createdAt: { gte: from, lte: to } };
  }

  private validateRange(fromInput?: string, toInput?: string) {
    if (!fromInput || !toInput) return;
    const from = new Date(fromInput);
    const to = new Date(toInput);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      throw new BadRequestException("Khoảng thời gian lọc không hợp lệ.");
    }
  }
}
