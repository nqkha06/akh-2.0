import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  loginAs,
  prisma,
  request,
} from "../e2e-harness";

describe("System announcements E2E", () => {
  it("supports targeting, lifecycle, member state, analytics and acknowledgement", async () => {
    assert.ok(adminAccessToken);
    const adminAuthorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    const password = "Announcement123";
    const memberEmail = `announcement-member-${process.pid}@example.com`;
    const otherEmail = `announcement-other-${process.pid}@example.com`;

    for (const [name, email] of [
      ["Announcement Member", memberEmail],
      ["Announcement Other", otherEmail],
    ]) {
      const response = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      assert.equal(response.status, 201, await response.clone().text());
    }

    const member = await loginAs(memberEmail, password);
    const other = await loginAs(otherEmail, password);
    const memberAuthorization = {
      Authorization: `Bearer ${member.body.accessToken}`,
    };
    const otherAuthorization = {
      Authorization: `Bearer ${other.body.accessToken}`,
    };
    const memberRecord = await prisma.user.findUniqueOrThrow({
      where: { email: memberEmail },
    });

    assert.equal((await request("/api/admin/announcements")).status, 401);
    assert.equal((await request("/api/member/announcements")).status, 401);

    const scheduledStart = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const createResponse = await request("/api/admin/announcements", {
      method: "POST",
      headers: adminAuthorization,
      body: JSON.stringify({
        title: "Bảo trì khu vực thành viên",
        slug: `member-maintenance-${process.pid}`,
        summary: "Thông báo dành riêng cho một thành viên.",
        content: "**Bảo trì định kỳ**\n- Thời gian dự kiến 15 phút.",
        type: "warning",
        priority: "high",
        displayType: "notification",
        status: "active",
        targetType: "users",
        targetRules: { userIds: [memberRecord.id] },
        actionLabel: "Mở tài khoản",
        actionUrl: "/member/account",
        isDismissible: true,
        requiresAcknowledgement: false,
        startsAt: scheduledStart,
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    });
    assert.equal(createResponse.status, 201, await createResponse.clone().text());
    const created = (await createResponse.json()) as {
      id: number;
      status: string;
      startsAt: string | null;
      analytics: { eligible: number };
    };
    assert.equal(created.status, "draft");
    assert.equal(created.analytics.eligible, 1);

    const beforePublish = await request("/api/member/announcements", {
      headers: memberAuthorization,
    });
    assert.equal(beforePublish.status, 200);
    assert.equal(
      ((await beforePublish.json()) as { items: unknown[] }).items.length,
      0,
    );

    const clearSchedule = await request(
      `/api/admin/announcements/${created.id}`,
      {
        method: "PATCH",
        headers: adminAuthorization,
        body: JSON.stringify({ startsAt: null, endsAt: null }),
      },
    );
    assert.equal(clearSchedule.status, 200, await clearSchedule.clone().text());
    assert.equal(
      ((await clearSchedule.json()) as { startsAt: string | null }).startsAt,
      null,
    );

    const publishResponse = await request(
      `/api/admin/announcements/${created.id}/publish`,
      { method: "POST", headers: adminAuthorization },
    );
    assert.equal(publishResponse.status, 201, await publishResponse.clone().text());
    assert.equal(
      ((await publishResponse.json()) as { status: string }).status,
      "active",
    );

    const activeAdminList = await request(
      `/api/admin/announcements?status=active&dateFrom=${encodeURIComponent(new Date(Date.now() - 60_000).toISOString())}&dateTo=${encodeURIComponent(new Date(Date.now() + 60_000).toISOString())}`,
      { headers: adminAuthorization },
    );
    assert.equal(activeAdminList.status, 200);
    assert.ok(
      ((await activeAdminList.json()) as { items: Array<{ id: number }> }).items.some(
        (item) => item.id === created.id,
      ),
    );
    const scheduledAdminList = await request(
      "/api/admin/announcements?status=scheduled",
      { headers: adminAuthorization },
    );
    assert.equal(
      ((await scheduledAdminList.json()) as { items: Array<{ id: number }> }).items.some(
        (item) => item.id === created.id,
      ),
      false,
    );

    const memberListResponse = await request(
      "/api/member/announcements?displayType=notification",
      { headers: memberAuthorization },
    );
    assert.equal(memberListResponse.status, 200);
    const memberList = (await memberListResponse.json()) as {
      items: Array<{ id: number; state: { readAt: string | null } }>;
    };
    assert.equal(memberList.items[0]?.id, created.id);
    assert.equal(memberList.items[0]?.state.readAt, null);

    const otherList = await request("/api/member/announcements", {
      headers: otherAuthorization,
    });
    assert.equal(otherList.status, 200);
    assert.equal(((await otherList.json()) as { items: unknown[] }).items.length, 0);

    const unreadBefore = await request(
      "/api/member/announcements/unread-count",
      { headers: memberAuthorization },
    );
    assert.equal(unreadBefore.status, 200);
    assert.equal(((await unreadBefore.json()) as { count: number }).count, 1);

    for (const action of ["seen", "read", "click"] as const) {
      const response = await request(
        `/api/member/announcements/${created.id}/${action}`,
        { method: "POST", headers: memberAuthorization },
      );
      assert.equal(response.status, 200, await response.clone().text());
    }

    const unreadAfter = await request(
      "/api/member/announcements/unread-count",
      { headers: memberAuthorization },
    );
    assert.equal(((await unreadAfter.json()) as { count: number }).count, 0);

    const analyticsResponse = await request(
      `/api/admin/announcements/${created.id}/analytics`,
      { headers: adminAuthorization },
    );
    assert.equal(analyticsResponse.status, 200);
    const analytics = (await analyticsResponse.json()) as {
      eligible: number;
      seen: number;
      read: number;
      clicked: number;
    };
    assert.deepEqual(analytics, {
      eligible: 1,
      seen: 1,
      read: 1,
      dismissed: 0,
      acknowledged: 0,
      clicked: 1,
      readRate: 100,
      clickRate: 100,
    });

    const modalResponse = await request("/api/admin/announcements", {
      method: "POST",
      headers: adminAuthorization,
      body: JSON.stringify({
        title: "Điều khoản sử dụng đã cập nhật",
        content: "Vui lòng xác nhận bạn đã đọc nội dung cập nhật.",
        type: "update",
        priority: "critical",
        displayType: "modal",
        status: "draft",
        targetType: "all",
        targetRules: {},
        isDismissible: false,
        requiresAcknowledgement: true,
      }),
    });
    assert.equal(modalResponse.status, 201, await modalResponse.clone().text());
    const modal = (await modalResponse.json()) as { id: number };
    assert.equal(
      (
        await request(`/api/admin/announcements/${modal.id}/publish`, {
          method: "POST",
          headers: adminAuthorization,
        })
      ).status,
      201,
    );

    const activeModals = await request(
      "/api/member/announcements/active-modals",
      { headers: memberAuthorization },
    );
    assert.equal(activeModals.status, 200);
    assert.ok(
      ((await activeModals.json()) as Array<{ id: number }>).some(
        (item) => item.id === modal.id,
      ),
    );
    assert.equal(
      (
        await request(`/api/member/announcements/${modal.id}/dismiss`, {
          method: "POST",
          headers: memberAuthorization,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request(`/api/member/announcements/${modal.id}/acknowledge`, {
          method: "POST",
          headers: memberAuthorization,
        })
      ).status,
      200,
    );
    const afterAcknowledgement = await request(
      "/api/member/announcements/active-modals",
      { headers: memberAuthorization },
    );
    assert.equal(
      ((await afterAcknowledgement.json()) as Array<{ id: number }>).some(
        (item) => item.id === modal.id,
      ),
      false,
    );

    const unsafeContent = await request("/api/admin/announcements", {
      method: "POST",
      headers: adminAuthorization,
      body: JSON.stringify({
        title: "Unsafe HTML",
        content: "<script>alert('x')</script>",
        type: "danger",
        priority: "normal",
        displayType: "banner",
        status: "draft",
        targetType: "all",
        targetRules: {},
        isDismissible: true,
        requiresAcknowledgement: false,
      }),
    });
    assert.equal(unsafeContent.status, 400);

    const duplicateResponse = await request(
      `/api/admin/announcements/${created.id}/duplicate`,
      { method: "POST", headers: adminAuthorization },
    );
    assert.equal(duplicateResponse.status, 201);
    const duplicate = (await duplicateResponse.json()) as {
      id: number;
      status: string;
    };
    assert.equal(duplicate.status, "draft");
    assert.equal(
      (
        await request(`/api/admin/announcements/${duplicate.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/announcements/${created.id}/pause`, {
          method: "POST",
          headers: adminAuthorization,
        })
      ).status,
      201,
    );
    const afterPause = await request("/api/member/announcements", {
      headers: memberAuthorization,
    });
    assert.equal(
      ((await afterPause.json()) as { items: Array<{ id: number }> }).items.some(
        (item) => item.id === created.id,
      ),
      false,
    );
  });
});

