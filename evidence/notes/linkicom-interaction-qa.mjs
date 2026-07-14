const pages = await fetch("http://127.0.0.1:9223/json/list").then((response) => response.json());
const page = pages.find((item) => item.type === "page" && item.url.includes(":3001"));

if (!page) throw new Error("Linkicom page was not found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let requestId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function send(method, params = {}) {
  requestId += 1;
  return new Promise((resolve, reject) => {
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return response.result.value;
}

await send("Runtime.enable");
await send("Page.enable");
await send("Page.reload", { ignoreCache: true });
await new Promise((resolve) => setTimeout(resolve, 1200));

const results = await evaluate(`(async () => {
  const byText = (selector, text) => [...document.querySelectorAll(selector)].find((node) => node.textContent.includes(text));
  const unlockButton = byText("button", "Unlock content");
  const disabledInitially = unlockButton?.disabled === true;
  byText("button", "Follow on X")?.click();
  byText("button", "Join Discord")?.click();
  await new Promise((resolve) => setTimeout(resolve, 250));
  const enabledAfterActions = unlockButton?.disabled === false;
  unlockButton?.click();
  await new Promise((resolve) => setTimeout(resolve, 350));
  const revealVisible = document.body.textContent.includes("Your download is ready");

  byText('[role="tab"]', "Analytics")?.click();
  await new Promise((resolve) => setTimeout(resolve, 350));
  const analyticsPreviewVisible = document.body.textContent.includes("Performance overview");

  byText('[role="tab"]', "Community builders")?.click();
  await new Promise((resolve) => setTimeout(resolve, 350));
  const communityPanelVisible = document.body.textContent.includes("Grow Discord and private communities");

  return {
    disabledInitially,
    enabledAfterActions,
    revealVisible,
    analyticsPreviewVisible,
    communityPanelVisible,
    noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
  };
})()`);

await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send("Page.reload", { ignoreCache: true });
await new Promise((resolve) => setTimeout(resolve, 1400));

results.mobile = await evaluate(`(() => {
  const menuButton = document.querySelector('button[aria-label="Open navigation"]');
  return {
    noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
    menuButtonVisible: Boolean(menuButton && getComputedStyle(menuButton).display !== "none"),
    primaryCtaFits: document.querySelector('a[href="/member/new"]')?.getBoundingClientRect().right <= window.innerWidth,
  };
})()`);

console.log(JSON.stringify(results, null, 2));
socket.close();
