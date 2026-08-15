import { Prisma } from "@prisma/client";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  loginAs,
  prisma,
  request,
} from "../e2e-harness";

describe("Admin stu access logs E2E", () => {
  it("lists, filters, masks, reviews and analyzes without mutating tracking data", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: "auth@example.com" },
    });
    const link = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: `access-log-analysis-${process.pid}`,
        title: "Access Log Analysis Test",
        destinationType: "url",
        destinationUrl: "https://example.com/access-analysis",
      },
    });
    const agentHash = `access-analysis-agent-${process.pid}`;
    await prisma.userAgent.create({
      data: {
        hash: agentHash,
        raw: "Access Analysis Test Agent",
        browser: "test",
        os: "test",
        deviceType: 2,
      },
    });
    const to = new Date();
    const from = new Date(to.getTime() - 60 * 60 * 1_000);
    const previousFrom = new Date(from.getTime() - 60 * 60 * 1_000);
    const currentLogs = Array.from({ length: 70 }, (_, index) => ({
      id: `access-analysis-current-${process.pid}-${index}`,
      linkId: link.id,
      userId: owner.id,
      agentHash,
      ipAddress: "203.0.113.10",
      country: ["VN", "US", "DE"][index % 3]!,
      device: 2,
      payoutCpm: new Prisma.Decimal(1_000),
      revenue: new Prisma.Decimal(1),
      isEarn: true,
      detectionMask: index === 0 ? 4 : 0,
      rejectReasonMask: index === 1 ? 1 : 0,
      completedAt: new Date(from.getTime() + index * 500),
      processedAt: new Date(from.getTime() + index * 500 + 100),
      createdAt: new Date(from.getTime() + index * 500),
    }));
    const previousLogs = Array.from({ length: 10 }, (_, index) => ({
      id: `access-analysis-previous-${process.pid}-${index}`,
      linkId: link.id,
      userId: owner.id,
      agentHash,
      ipAddress: "198.51.100.20",
      country: "VN",
      device: 2,
      createdAt: new Date(previousFrom.getTime() + index * 1_000),
    }));
    await prisma.linkAccessLog.createMany({
      data: [...currentLogs, ...previousLogs],
    });

    const memberEmail = `access-log-member-${process.pid}@example.com`;
    assert.equal(
      (
        await request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: "Access Log Member",
            email: memberEmail,
            password: "Member123",
          }),
        })
      ).status,
      201,
    );
    const memberLogin = await loginAs(memberEmail, "Member123");
    assert.equal(
      (
        await request("/api/admin/stu-access-logs", {
          headers: {
            Authorization: `Bearer ${memberLogin.body.accessToken}`,
          },
        })
      ).status,
      403,
    );

    const listQuery = new URLSearchParams({
      from: from.toISOString(),
      to: new Date(to.getTime() + 60_000).toISOString(),
      userId: String(owner.id),
      linkId: String(link.id),
      ip: "203.0.113.10",
      isEarn: "true",
      page: "1",
      perPage: "10",
    });
    const listResponse = await request(
      `/api/admin/stu-access-logs?${listQuery}`,
      { headers: authorization },
    );
    assert.equal(listResponse.status, 200, await listResponse.clone().text());
    const list = (await listResponse.json()) as {
      total: number;
      pageCount: number;
      items: Array<{ id: string; ipAddress: string; userId: number; linkId: number }>;
    };
    assert.equal(list.total, 70);
    assert.equal(list.pageCount, 7);
    assert.equal(list.items[0]?.userId, owner.id);
    assert.equal(list.items[0]?.linkId, link.id);
    assert.equal(list.items[0]?.ipAddress, "203.0.113.10");

    const filterCases: Array<Record<string, string>> = [
      { user: owner.email },
      { link: link.slug },
      { country: "VN" },
      { device: "2" },
      { hasRevenue: "true" },
      { detectionMask: "4" },
      { rejectReasonMask: "1" },
      { state: "normal" },
      { state: "rejected" },
      { state: "suspicious" },
      { reviewStatus: "unreviewed" },
      { sortBy: "revenue", sortOrder: "desc" },
    ];
    for (const filter of filterCases) {
      const query = new URLSearchParams({
        from: from.toISOString(),
        to: new Date(to.getTime() + 60_000).toISOString(),
        page: "1",
        perPage: "10",
        ...filter,
      });
      const response = await request(
        `/api/admin/stu-access-logs?${query}`,
        { headers: authorization },
      );
      assert.equal(
        response.status,
        200,
        `Access-log filter failed for ${query}: ${await response.clone().text()}`,
      );
    }

    const targetId = currentLogs[0]!.id;
    const before = await prisma.linkAccessLog.findUniqueOrThrow({
      where: { id: targetId },
    });
    const detailResponse = await request(
      `/api/admin/stu-access-logs/${targetId}`,
      { headers: authorization },
    );
    assert.equal(detailResponse.status, 200, await detailResponse.clone().text());
    const detail = (await detailResponse.json()) as {
      related: { sameIp1h: number; distinctLinkOwnerCount: number };
      userAgent: { raw: string };
    };
    assert.equal(detail.related.sameIp1h, 1);
    assert.equal(detail.related.distinctLinkOwnerCount, 1);
    assert.equal(detail.userAgent.raw, "Access Analysis Test Agent");

    const reviewResponse = await request(
      `/api/admin/stu-access-logs/${targetId}/review`,
      {
        method: "POST",
        headers: authorization,
        body: JSON.stringify({ status: "follow_up", note: "Needs evidence" }),
      },
    );
    assert.equal(reviewResponse.status, 201, await reviewResponse.clone().text());
    assert.equal(
      (
        (await reviewResponse.json()) as {
          review: { status: string };
        }
      ).review.status,
      "follow_up",
    );
    const after = await prisma.linkAccessLog.findUniqueOrThrow({
      where: { id: targetId },
    });
    assert.deepEqual(after, before);
    assert.equal(
      await prisma.accessLogReview.count({ where: { accessLogId: targetId } }),
      1,
    );

    const analysisQuery = new URLSearchParams({
      from: from.toISOString(),
      to: new Date(to.getTime() + 60_000).toISOString(),
    });
    const analysisResponse = await request(
      `/api/admin/users/${owner.id}/access-analysis?${analysisQuery}`,
      { headers: authorization },
    );
    assert.equal(
      analysisResponse.status,
      200,
      await analysisResponse.clone().text(),
    );
    const analysis = (await analysisResponse.json()) as {
      summary: {
        totalRequests: number;
        earnedRequests: number;
        totalRevenue: string;
        uniqueIps: number;
        uniqueAgents: number;
      };
      risk: { score: number };
      reasons: Array<{ code: string }>;
    };
    assert.equal(analysis.summary.totalRequests, 70);
    assert.equal(analysis.summary.earnedRequests, 70);
    assert.equal(Number(analysis.summary.totalRevenue), 70);
    assert.equal(analysis.summary.uniqueIps, 1);
    assert.equal(analysis.summary.uniqueAgents, 1);
    assert.ok(analysis.risk.score <= 100);
    assert.equal(
      analysis.reasons.some((reason) => reason.code === "IP_HIGH_VELOCITY"),
      true,
    );
    assert.equal(
      analysis.reasons.some(
        (reason) => reason.code === "IP_REVENUE_CONCENTRATION",
      ),
      true,
    );
    assert.equal(
      analysis.reasons.some((reason) => reason.code === "RAPID_COUNTRY_CHANGE"),
      true,
    );
    assert.equal(
      analysis.reasons.some((reason) => reason.code === "TRAFFIC_SPIKE"),
      true,
    );

    const invalidPeriod = new URLSearchParams({
      from: new Date(to.getTime() - 31 * 86_400_000).toISOString(),
      to: to.toISOString(),
    });
    assert.equal(
      (
        await request(
          `/api/admin/users/${owner.id}/access-analysis?${invalidPeriod}`,
          { headers: authorization },
        )
      ).status,
      400,
    );

    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { key: "admin" },
    });
    const sensitivePermission = await prisma.permission.findUniqueOrThrow({
      where: { key: "stu_access_logs.view_sensitive" },
    });
    await prisma.roleHasPermission.delete({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: sensitivePermission.id,
        },
      },
    });
    try {
      const maskedResponse = await request(
        `/api/admin/stu-access-logs?${listQuery}`,
        { headers: authorization },
      );
      assert.equal(maskedResponse.status, 200);
      assert.equal(
        (
          (await maskedResponse.json()) as {
            items: Array<{ ipAddress: string }>;
          }
        ).items[0]?.ipAddress,
        "203.0.xxx.xxx",
      );
    } finally {
      await prisma.roleHasPermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: sensitivePermission.id,
        },
      });
    }

    await prisma.link.delete({ where: { id: link.id } });
    await prisma.userAgent.delete({ where: { hash: agentHash } });
  });
});

