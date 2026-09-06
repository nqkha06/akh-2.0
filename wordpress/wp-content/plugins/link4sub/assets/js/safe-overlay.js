(function () {
  "use strict";

  var root = document.getElementById("l4s-safe-overlay");
  var configNode = document.getElementById("l4s-safe-config");
  if (!root || !configNode) return;

  root.querySelectorAll("[data-l4s-script-ad]").forEach(function (slot) {
    var url = slot.getAttribute("data-script-url");
    if (!url || !/^https?:\/\//i.test(url)) return;
    var script = document.createElement("script");
    script.async = true;
    script.src = url;
    var zone = slot.getAttribute("data-zone-id");
    if (zone) script.dataset.zoneId = zone;
    slot.appendChild(script);
  });

  var config = {};
  try { config = JSON.parse(configNode.textContent || "{}"); } catch (error) {}

  var themeButton = root.querySelector("[data-l4s-safe-theme]");
  applyTheme(resolveInitialTheme());
  if (themeButton) themeButton.addEventListener("click", function () {
    var dark = !root.classList.contains("is-dark");
    applyTheme(dark);
    try { window.localStorage.setItem("link4sub:theme", dark ? "dark" : "light"); } catch (error) {}
  });
  document.addEventListener("link4sub:languagechange", function () {
    applyTheme(root.classList.contains("is-dark"));
    renderPage();
  });

  var show = function () {
    root.hidden = false;
    document.body.classList.add("l4s-safe-open");
    window.requestAnimationFrame(function () { root.classList.add("is-visible"); });
  };
  window.setTimeout(show, Math.max(0, Number(config.renderDelaySeconds) || 0) * 1000);

  var close = root.querySelector("[data-l4s-safe-close]");
  if (close) close.addEventListener("click", function () {
    root.classList.remove("is-visible");
    document.body.classList.remove("l4s-safe-open");
    window.setTimeout(function () { root.hidden = true; }, 180);
  });

  var actions = Array.prototype.slice.call(root.querySelectorAll("[data-l4s-safe-action]"));
  var unlock = root.querySelector("[data-l4s-safe-unlock]");
  var completedNode = root.querySelector("[data-l4s-safe-completed]");
  var totalNode = root.querySelector("[data-l4s-safe-total]");
  var pageNode = root.querySelector("[data-l4s-safe-page]");
  var progressTitle = root.querySelector("[data-l4s-safe-progress-title]");
  var progressBar = root.querySelector("[data-l4s-safe-progress-bar]");
  var ids = actions.map(function (node) { return node.getAttribute("data-l4s-safe-action"); });
  var storageKey = "link4sub:safe:unlock:" + String(config.slug || "");
  var completed = readCompleted().filter(function (id) { return ids.indexOf(id) !== -1; });
  var completionSent = false;
  var smartlinkScheduled = false;
  var popunderOpened = false;
  var pageCount = Math.max(1, Math.min(20, Number(config.pageCount) || 1));
  var currentPage = Math.max(0, Math.min(pageCount - 1, Number(config.currentPage) || 0));

  actions.forEach(function (action) {
    var id = action.getAttribute("data-l4s-safe-action");
    if (completed.indexOf(id) !== -1) action.classList.add("is-complete");
    action.addEventListener("click", function (event) {
      if (action.classList.contains("is-waiting")) {
        event.preventDefault();
        return;
      }
      if (action.classList.contains("is-complete")) return;
      countdown(action, id);
    });
  });

  renderPage();
  bindPopunder();

  if (unlock) unlock.addEventListener("click", function (event) {
    if (!unlock.classList.contains("is-ready")) {
      event.preventDefault();
      return;
    }
    if (currentPage < pageCount - 1) {
      event.preventDefault();
      if (validNextPageUrl()) window.location.assign(config.nextPageUrl);
      return;
    }
    if (smartlinkScheduled && validSmartlinkUrl()) {
      event.preventDefault();
      return;
    }
    if (unlock.tagName !== "BUTTON" && validSmartlinkUrl()) {
      scheduleSmartlinkRedirect();
    } else {
      completeVisit();
    }
    if (unlock.getAttribute("data-type") === "snippet") {
      var snippet = root.querySelector("[data-l4s-safe-snippet]");
      if (snippet) snippet.hidden = false;
      unlock.textContent = text("content_displayed", {}, "Nội dung đã được hiển thị");
    }
  });

  function countdown(action, id) {
    var delay = Math.max(1, Number(config.actionDelaySeconds) || 6);
    var label = action.querySelector(".l4s-safe-action-label");
    var bar = action.querySelector("i b");
    var original = label ? label.getAttribute("data-label") : "";
    action.classList.add("is-waiting");
    if (label) label.textContent = text("please_wait", {}, "Vui lòng chờ...");
    if (bar) bar.style.width = "0%";
    var started = Date.now();
    var timer = window.setInterval(function () {
      var ratio = Math.min(1, (Date.now() - started) / (delay * 1000));
      if (bar) bar.style.width = ratio * 100 + "%";
    }, 100);
    window.setTimeout(function () {
      window.clearInterval(timer);
      action.classList.remove("is-waiting");
      action.classList.add("is-complete");
      if (label) label.textContent = original;
      if (bar) bar.style.width = "100%";
      if (completed.indexOf(id) === -1) completed.push(id);
      writeCompleted(completed);
      update();
    }, delay * 1000);
  }

  function update() {
    var pageIds = actionsForCurrentPage().map(function (action) {
      return action.getAttribute("data-l4s-safe-action");
    });
    var done = pageIds.filter(function (id) { return completed.indexOf(id) !== -1; }).length;
    var ready = pageIds.length === 0 || done === pageIds.length;
    var percent = pageIds.length === 0 ? 100 : done / pageIds.length * 100;
    var finalPage = currentPage >= pageCount - 1;
    var canContinue = finalPage || validNextPageUrl();
    if (completedNode) completedNode.textContent = String(done);
    if (totalNode) totalNode.textContent = String(pageIds.length);
    if (progressBar) progressBar.style.width = percent + "%";
    if (progressTitle) progressTitle.textContent = ready
      ? (finalPage ? text("content_ready", {}, "Nội dung đã sẵn sàng") : text("page_complete", {}, "Page đã hoàn thành"))
      : text("unlock_progress", {}, "Tiến độ mở khóa");
    if (!unlock) return;
    unlock.classList.toggle("is-ready", ready && canContinue);
    if (unlock.tagName === "BUTTON") {
      unlock.disabled = !ready || !canContinue;
      unlock.textContent = ready
        ? (canContinue ? (finalPage ? text("open_content", {}, "Mở nội dung") : text("continue_page", { page: currentPage + 2 }, "Tiếp tục Page " + (currentPage + 2))) : text("next_page_unavailable", {}, "Không thể tải Page tiếp theo"))
        : text("complete_requirements", {}, "Hoàn thành yêu cầu để mở khóa");
    } else if (ready && finalPage) {
      unlock.setAttribute("href", unlock.getAttribute("data-href") || "#");
      unlock.textContent = unlock.getAttribute("data-type") === "file" ? text("open_file", {}, "Mở file") : text("continue_link", {}, "Tiếp tục đến liên kết");
    } else {
      unlock.removeAttribute("href");
      unlock.textContent = ready
        ? (canContinue ? text("continue_page", { page: currentPage + 2 }, "Tiếp tục Page " + (currentPage + 2)) : text("next_page_unavailable", {}, "Không thể tải Page tiếp theo"))
        : text("complete_requirements", {}, "Hoàn thành yêu cầu để mở khóa");
    }
  }

  function actionsForCurrentPage() {
    return actions.filter(function (action) {
      return Number(action.getAttribute("data-l4s-page") || 0) === currentPage;
    });
  }

  function renderPage() {
    actions.forEach(function (action) {
      action.hidden = Number(action.getAttribute("data-l4s-page") || 0) !== currentPage;
    });
    if (pageNode) pageNode.textContent = text("page_indicator", { page: currentPage + 1, total: pageCount }, "Page " + (currentPage + 1) + "/" + pageCount);
    update();
  }

  function completeVisit() {
    if (completionSent || !config.visitRef || !config.completeUrl) return;
    completionSent = true;
    window.fetch(config.completeUrl, {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visit_ref: config.visitRef })
    }).catch(function () { completionSent = false; });
  }

  function validSmartlinkUrl() {
    return typeof config.smartlinkUrl === "string" && /^https?:\/\//i.test(config.smartlinkUrl);
  }

  function resolveInitialTheme() {
    var selected = "";
    try { selected = window.localStorage.getItem("link4sub:theme") || ""; } catch (error) {}
    if (selected !== "light" && selected !== "dark") selected = String(config.defaultTheme || "light");
    return selected === "dark" || (selected === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function applyTheme(dark) {
    root.classList.toggle("is-dark", Boolean(dark));
    if (!themeButton) return;
    var key = dark ? "theme_light" : "theme_dark";
    var label = text(key, {}, dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối");
    themeButton.setAttribute("data-l4s-i18n-aria", key);
    themeButton.setAttribute("aria-label", label);
    themeButton.setAttribute("title", label);
    themeButton.setAttribute("aria-pressed", dark ? "true" : "false");
  }

  function validNextPageUrl() {
    if (typeof config.nextPageUrl !== "string" || config.nextPageUrl === "") return false;
    try {
      var url = new URL(config.nextPageUrl, window.location.origin);
      return /^https?:$/.test(url.protocol) && url.origin === window.location.origin;
    } catch (error) {
      return false;
    }
  }

  function scheduleSmartlinkRedirect() {
    if (smartlinkScheduled || !validSmartlinkUrl()) return;
    smartlinkScheduled = true;
    var remaining = Math.max(0, Math.min(300, Number(config.smartlinkDelaySeconds) || 0));
    updateSmartlinkCountdown(remaining);
    var timer = window.setInterval(function () {
      remaining = Math.max(0, remaining - 1);
      updateSmartlinkCountdown(remaining);
      if (remaining === 0) window.clearInterval(timer);
    }, 1000);
    window.setTimeout(function () {
      window.clearInterval(timer);
      recordSmartlinkExposure(config.smartlinkId);
      window.location.assign(config.smartlinkUrl);
    }, remaining * 1000);
  }

  function recordSmartlinkExposure(value) {
    var adId = typeof value === "string" ? value : "";
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(adId)) return;
    var now = Date.now();
    var history = readSmartlinkCookie("link4sub_smartlink_history");
    var timestamps = Array.isArray(history[adId]) ? history[adId] : [];
    timestamps = timestamps.filter(function (value) {
      return Number.isSafeInteger(value) && value >= now - 31 * 86400000;
    }).slice(-19);
    timestamps.push(now);
    delete history[adId];
    history[adId] = timestamps;
    writeSmartlinkCookie("link4sub_smartlink_history", trimSmartlinkKeys(history), 31 * 86400);

    var session = readSmartlinkCookie("link4sub_smartlink_session");
    var count = Math.max(0, Number(session[adId]) || 0);
    delete session[adId];
    session[adId] = Math.min(20, count + 1);
    writeSmartlinkCookie("link4sub_smartlink_session", trimSmartlinkKeys(session));
  }

  function bindPopunder() {
    if (!validPopunderUrl()) return;
    root.addEventListener("click", openPopunder, true);
  }

  function validPopunderUrl() {
    return typeof config.popunderUrl === "string" && /^https?:\/\//i.test(config.popunderUrl);
  }

  function openPopunder(event) {
    if (popunderOpened || !event.isTrusted || !validPopunderUrl()) return;
    var popup = window.open("about:blank", "_blank");
    if (!popup) return;
    popunderOpened = true;
    root.removeEventListener("click", openPopunder, true);
    try {
      popup.opener = null;
      popup.location.replace(config.popunderUrl);
      popup.blur();
      window.focus();
    } catch (error) {
      popup.location.href = config.popunderUrl;
    }
    recordSmartlinkExposure(config.popunderId);
  }

  function readSmartlinkCookie(name) {
    var prefix = name + "=";
    var item = document.cookie.split("; ").find(function (value) { return value.indexOf(prefix) === 0; });
    if (!item) return {};
    try {
      var parsed = JSON.parse(decodeURIComponent(item.slice(prefix.length)));
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) { return {}; }
  }

  function writeSmartlinkCookie(name, value, maxAge) {
    var cookie = name + "=" + encodeURIComponent(JSON.stringify(value)) + "; Path=/; SameSite=Lax";
    if (maxAge) cookie += "; Max-Age=" + maxAge;
    if (window.location.protocol === "https:") cookie += "; Secure";
    document.cookie = cookie;
  }

  function trimSmartlinkKeys(value) {
    var keys = Object.keys(value);
    keys.slice(0, Math.max(0, keys.length - 10)).forEach(function (key) { delete value[key]; });
    return value;
  }

  function updateSmartlinkCountdown(seconds) {
    if (!progressTitle) return;
    progressTitle.textContent = seconds > 0
      ? text("smartlink_wait", { seconds: seconds }, "Đã mở liên kết trong tab mới. Trang này sẽ chuyển sau " + seconds + " giây...")
      : text("smartlink_redirecting", {}, "Đang chuyển đến trang tiếp theo...");
  }

  function readCompleted() {
    try {
      var value = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) { return []; }
  }

  function writeCompleted(value) {
    try { window.localStorage.setItem(storageKey, JSON.stringify(value)); } catch (error) {}
  }

  function text(key, variables, fallback) {
    return window.Link4SubI18n && typeof window.Link4SubI18n.t === "function"
      ? window.Link4SubI18n.t(key, variables || {}, fallback)
      : fallback;
  }
})();
