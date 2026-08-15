import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  loginAs,
  request,
} from "../e2e-harness";

describe("Support tickets E2E", () => {
  it("supports member ownership and a complete admin response lifecycle", async () => {
    const email = `support-member-${process.pid}@example.com`;
    const password = "Support123";
    assert.equal(
      (
        await request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: "Support Member",
            email,
            password,
          }),
        })
      ).status,
      201,
    );
    const member = await loginAs(email, password);
    const memberAuthorization = {
      Authorization: `Bearer ${member.body.accessToken}`,
    };

    const createResponse = await request("/api/member/support/tickets", {
      method: "POST",
      headers: memberAuthorization,
      body: JSON.stringify({
        category: "technical",
        subject: "Không thể cập nhật social link",
        content:
          "Tôi đã thử lưu lại social link nhiều lần nhưng trạng thái không thay đổi.",
        relatedResource: "/member/links",
      }),
    });
    assert.equal(createResponse.status, 201, await createResponse.clone().text());
    const created = (await createResponse.json()) as {
      id: number;
      reference: string;
      status: string;
      messages: Array<{ senderRole: string; isInternal: boolean }>;
    };
    assert.match(created.reference, /^TKT-\d{4}-\d{6}$/);
    assert.equal(created.status, "submitted");

    const otherEmail = `support-other-${process.pid}@example.com`;
    assert.equal(
      (
        await request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: "Other Support Member",
            email: otherEmail,
            password,
          }),
        })
      ).status,
      201,
    );
    const otherMember = await loginAs(otherEmail, password);
    assert.equal(
      (
        await request(`/api/member/support/tickets/${created.id}`, {
          headers: {
            Authorization: `Bearer ${otherMember.body.accessToken}`,
          },
        })
      ).status,
      404,
    );

    const adminAuthorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    const listResponse = await request(
      "/api/admin/support/tickets?status=submitted",
      { headers: adminAuthorization },
    );
    assert.equal(listResponse.status, 200);
    const list = (await listResponse.json()) as {
      items: Array<{ id: number }>;
      summary: { open: number; unassigned: number };
    };
    assert.ok(list.items.some((ticket) => ticket.id === created.id));
    assert.ok(list.summary.open >= 1);
    assert.ok(list.summary.unassigned >= 1);

    const assignResponse = await request(
      `/api/admin/support/tickets/${created.id}`,
      {
        method: "PATCH",
        headers: adminAuthorization,
        body: JSON.stringify({ assignToMe: true, priority: "high" }),
      },
    );
    assert.equal(assignResponse.status, 200);
    const assigned = (await assignResponse.json()) as {
      status: string;
      priority: string;
      assignedTo: { id: number };
    };
    assert.equal(assigned.status, "in_progress");
    assert.equal(assigned.priority, "high");
    assert.ok(assigned.assignedTo.id);

    const replyResponse = await request(
      `/api/admin/support/tickets/${created.id}/replies`,
      {
        method: "POST",
        headers: adminAuthorization,
        body: JSON.stringify({
          content:
            "Chúng tôi đã tiếp nhận. Bạn vui lòng thử tải lại trang trước khi lưu.",
        }),
      },
    );
    assert.equal(replyResponse.status, 201);
    assert.equal(
      ((await replyResponse.json()) as { status: string }).status,
      "waiting_user",
    );

    const memberDetail = await request(
      `/api/member/support/tickets/${created.id}`,
      { headers: memberAuthorization },
    );
    assert.equal(memberDetail.status, 200);
    const visible = (await memberDetail.json()) as {
      messages: Array<{ senderRole: string; isInternal: boolean }>;
    };
    assert.ok(
      visible.messages.some((message) => message.senderRole === "support"),
    );
    assert.equal(
      visible.messages.some((message) => message.isInternal),
      false,
    );

    const memberReply = await request(
      `/api/member/support/tickets/${created.id}/replies`,
      {
        method: "POST",
        headers: memberAuthorization,
        body: JSON.stringify({
          content: "Tôi đã thử lại và gửi thêm thông tin theo hướng dẫn.",
        }),
      },
    );
    assert.equal(memberReply.status, 201);
    assert.equal(
      ((await memberReply.json()) as { status: string }).status,
      "in_progress",
    );

    assert.equal(
      (
        await request(`/api/admin/support/tickets/${created.id}`, {
          method: "PATCH",
          headers: adminAuthorization,
          body: JSON.stringify({ status: "closed" }),
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/member/support/tickets/${created.id}/replies`, {
          method: "POST",
          headers: memberAuthorization,
          body: JSON.stringify({ content: "Phản hồi sau khi đóng." }),
        })
      ).status,
      409,
    );
  });
});

