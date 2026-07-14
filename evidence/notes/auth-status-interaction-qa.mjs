const routes = [
  ["/login", "Tiếp tục hành trình sáng tạo"],
  ["/register", "Tạo một link. Mở ra nhiều cơ hội"],
  ["/forgot-password", "Quên mật khẩu? Không sao cả"],
  ["/link/not-found", "Không tìm thấy link này"],
  ["/link/violation", "Link đã bị vô hiệu hoá"],
  ["/link/deleted", "Link đã bị xoá"],
  ["/missing-page-for-qa", "Trang này không tồn tại"],
  ["/l/missing-link-for-qa", "Không tìm thấy link này"],
];

const routeResults = {};
for (const [route, marker] of routes) {
  const response = await fetch(`http://127.0.0.1:3001${route}`);
  const html = await response.text();
  routeResults[route] = { status: response.status, markerFound: html.includes(marker) };
}

const pages = await fetch("http://127.0.0.1:9224/json/list").then((response) => response.json());
const page = pages.find((item) => item.type === "page" && item.url.includes(":3001/login"));
if (!page) throw new Error("Login page was not found");

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
await new Promise((resolve) => setTimeout(resolve, 900));

const interactionResults = await evaluate(`(async () => {
  const password = document.querySelector('input[name="password"]');
  const toggle = document.querySelector('button[aria-label="Hiện mật khẩu"]');
  const form = document.querySelector('form');
  const passwordHiddenInitially = password?.type === "password";
  toggle?.click();
  await new Promise((resolve) => setTimeout(resolve, 100));
  const passwordVisibleAfterToggle = password?.type === "text";
  const emptyFormInvalid = form?.checkValidity() === false;
  return { passwordHiddenInitially, passwordVisibleAfterToggle, emptyFormInvalid };
})()`);

await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send("Page.reload", { ignoreCache: true });
await new Promise((resolve) => setTimeout(resolve, 900));
interactionResults.mobileNoHorizontalOverflow = await evaluate("document.documentElement.scrollWidth <= window.innerWidth");

console.log(JSON.stringify({ routes: routeResults, interactions: interactionResults }, null, 2));
socket.close();
