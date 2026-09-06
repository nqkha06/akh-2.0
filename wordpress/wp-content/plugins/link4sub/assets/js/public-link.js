(function () {
  "use strict";

  var configElement = document.getElementById("l4s-config");
  var config = {};
  try {
    config = configElement ? JSON.parse(configElement.textContent || "{}") : {};
  } catch (error) {
    config = {};
  }

  var actions = Array.prototype.slice.call(
    document.querySelectorAll(".l4s-action[data-action-id]")
  );
  var unlock = document.getElementById("l4s-unlock");
  var progressBar = document.getElementById("l4s-progress-bar");
  var completedCount = document.getElementById("l4s-completed-count");
  var pageActionCount = document.getElementById("l4s-page-action-count");
  var pageIndicator = document.getElementById("l4s-page-indicator");
  var progressTitle = document.getElementById("l4s-progress-title");
  var storageKey = "site:unlock:" + String(config.slug || "");
  var delay = Number(config.actionDelaySeconds) || 6;
  var validIds = actions.map(function (action) {
    return action.getAttribute("data-action-id");
  });
  var completeIds = readCompletedIds().filter(function (id) {
    return validIds.indexOf(id) !== -1;
  });
  var visitRecorded = false;
  var smartlinkScheduled = false;
  var popunderOpened = false;
  var pageCount = Math.max(1, Math.min(20, Number(config.pageCount) || 1));
  var currentPage = 0;

  document.addEventListener("link4sub:languagechange", function () {
    renderPage();
    updateThemeLabel();
  });

  actions.forEach(function (action) {
    var id = action.getAttribute("data-action-id");
    if (completeIds.indexOf(id) !== -1) {
      action.classList.add("is-complete");
    }

    action.addEventListener("click", function (event) {
      if (action.classList.contains("is-loading")) {
        event.preventDefault();
        return;
      }
      if (action.classList.contains("is-complete")) {
        return;
      }
      startActionCountdown(action, id);
    });
  });

  renderPage();
  bindUnlock();
  bindTheme();
  bindShare();
  bindAudio();
  bindBanner();
  bindMonetizationScripts();
  bindPopunder();
  document.documentElement.classList.remove("l4s-loading");

  function startActionCountdown(action, id) {
    var label = action.querySelector(".l4s-action-label");
    var bar = action.querySelector(".l4s-action-progress span");
    var originalLabel = label ? label.getAttribute("data-label") : "";
    var remaining = delay;

    action.classList.add("is-loading");
    action.setAttribute("aria-busy", "true");
    if (label) label.textContent = text("please_wait", {}, "Vui lòng chờ...");
    if (bar) bar.style.width = "0%";

    var interval = window.setInterval(function () {
      remaining = Math.max(remaining - 1, 0);
      if (bar) {
        bar.style.width = ((delay - remaining) / delay) * 100 + "%";
      }
    }, 1000);

    window.setTimeout(function () {
      window.clearInterval(interval);
      action.classList.remove("is-loading");
      action.classList.add("is-complete");
      action.removeAttribute("aria-busy");
      if (label) label.textContent = originalLabel;
      if (bar) bar.style.width = "100%";
      if (completeIds.indexOf(id) === -1) {
        completeIds.push(id);
        writeCompletedIds(completeIds);
      }
      updateUnlockState();
    }, delay * 1000);
  }

  function updateUnlockState() {
    var pageActions = actionsForCurrentPage();
    var pageIds = pageActions.map(function (action) {
      return action.getAttribute("data-action-id");
    });
    var total = pageIds.length;
    var completed = pageIds.filter(function (id) {
      return completeIds.indexOf(id) !== -1;
    }).length;
    var unlocked = total === 0 || completed === total;
    var progress = total === 0 ? 100 : (completed / total) * 100;
    var finalPage = currentPage >= pageCount - 1;

    if (completedCount) completedCount.textContent = String(completed);
    if (pageActionCount) pageActionCount.textContent = String(total);
    if (progressBar) {
      progressBar.style.width = progress + "%";
      progressBar.classList.toggle("is-ready", unlocked);
    }
    if (progressTitle) {
      progressTitle.textContent = unlocked
        ? (finalPage ? text("content_ready", {}, "Nội dung đã sẵn sàng") : text("page_complete", {}, "Page đã hoàn thành"))
        : text("unlock_progress", {}, "Tiến độ mở khóa");
    }
    if (!unlock) return;

    var label = unlock.querySelector(".l4s-unlock-label");
    var type = unlock.getAttribute("data-type") || "url";
    unlock.classList.toggle("is-ready", unlocked);
    unlock.setAttribute("aria-disabled", unlocked ? "false" : "true");

    if (unlock.tagName === "BUTTON") {
      unlock.disabled = !unlocked;
      if (label) label.textContent = unlocked
        ? (finalPage ? text("open_content", {}, "Mở nội dung") : text("continue_page", { page: currentPage + 2 }, "Tiếp tục Page " + (currentPage + 2)))
        : text("unlock_content", {}, "Mở khóa nội dung");
    } else if (unlocked && finalPage) {
      unlock.setAttribute("href", unlock.getAttribute("data-href") || "#");
      if (label) {
        label.textContent = type === "file" ? text("open_file", {}, "Mở file") : text("continue_link", {}, "Tiếp tục đến liên kết");
      }
    } else {
      unlock.removeAttribute("href");
      if (label) label.textContent = unlocked
        ? text("continue_page", { page: currentPage + 2 }, "Tiếp tục Page " + (currentPage + 2))
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
    if (pageIndicator) {
      pageIndicator.textContent = text("page_indicator", { page: currentPage + 1, total: pageCount }, "Page " + (currentPage + 1) + "/" + pageCount);
    }
    updateUnlockState();
  }

  function bindUnlock() {
    if (!unlock) return;
    unlock.addEventListener("click", function (event) {
      if (!unlock.classList.contains("is-ready")) {
        event.preventDefault();
        return;
      }
      if (currentPage < pageCount - 1) {
        event.preventDefault();
        currentPage += 1;
        renderPage();
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
        var snippet = document.getElementById("l4s-snippet");
        var label = unlock.querySelector(".l4s-unlock-label");
        if (snippet) snippet.hidden = false;
        if (label) label.textContent = text("content_displayed", {}, "Nội dung đã được hiển thị");
      }
    });
  }

  function completeVisit() {
    if (visitRecorded || !config.visitRef || !config.completeUrl) return;
    visitRecorded = true;
    window.fetch(config.completeUrl, {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visit_ref: config.visitRef })
    }).then(function (response) {
      if (!response.ok) throw new Error("Completion failed");
    }).catch(function () {
      visitRecorded = false;
    });
  }

  function validSmartlinkUrl() {
    return typeof config.smartlinkUrl === "string" && /^https?:\/\//i.test(config.smartlinkUrl);
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
    document.addEventListener("click", openPopunder, true);
  }

  function validPopunderUrl() {
    return typeof config.popunderUrl === "string" && /^https?:\/\//i.test(config.popunderUrl);
  }

  function openPopunder(event) {
    if (popunderOpened || !event.isTrusted || !validPopunderUrl()) return;
    var popup = window.open("about:blank", "_blank");
    if (!popup) return;
    popunderOpened = true;
    document.removeEventListener("click", openPopunder, true);
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
    var message = seconds > 0
      ? text("smartlink_wait", { seconds: seconds }, "Đã mở liên kết trong tab mới. Trang này sẽ chuyển sau " + seconds + " giây...")
      : text("smartlink_redirecting", {}, "Đang chuyển đến trang tiếp theo...");
    if (progressTitle) progressTitle.textContent = message;
    showToast(message);
  }

  function bindTheme() {
    var button = document.getElementById("l4s-theme");
    if (!button) return;
    button.addEventListener("click", function () {
      var dark = document.documentElement.classList.toggle("l4s-dark");
      try {
        window.localStorage.setItem("link4sub:theme", dark ? "dark" : "light");
      } catch (error) {}
      updateThemeLabel();
    });
    updateThemeLabel();
  }

  function updateThemeLabel() {
    var button = document.getElementById("l4s-theme");
    if (!button) return;
    var dark = document.documentElement.classList.contains("l4s-dark");
    var key = dark ? "theme_light" : "theme_dark";
    var label = text(key, {}, dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối");
    button.setAttribute("data-l4s-i18n-aria", key);
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  }

  function bindShare() {
    var button = document.getElementById("l4s-share");
    if (!button) return;
    button.addEventListener("click", function () {
      var data = { title: document.title, url: window.location.href };
      if (navigator.share) {
        navigator.share(data).catch(function (error) {
          if (!error || error.name !== "AbortError") copyCurrentUrl();
        });
      } else {
        copyCurrentUrl();
      }
    });
  }

  function copyCurrentUrl() {
    if (window.isSecureContext && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(function () {
        showToast(text("copied_link", {}, "Đã sao chép link"));
      }).catch(function () {
        fallbackCopy();
      });
      return;
    }
    fallbackCopy();
  }

  function fallbackCopy() {
    var textarea = document.createElement("textarea");
    textarea.value = window.location.href;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    var copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    showToast(copied ? text("copied_link", {}, "Đã sao chép link") : text("copy_failed", {}, "Không thể sao chép link"));
  }

  function bindAudio() {
    var button = document.getElementById("l4s-audio");
    var iframe = document.getElementById("l4s-youtube-background");
    if (!button || !iframe) return;
    var muted = true;
    button.addEventListener("click", function () {
      muted = !muted;
      var key = muted ? "audio_enable" : "audio_disable";
      var audioLabel = text(key, {}, muted ? "Bật âm thanh nền" : "Tắt âm thanh nền");
      button.setAttribute("data-l4s-i18n-aria", key);
      button.setAttribute("aria-label", audioLabel);
      button.setAttribute("title", audioLabel);
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage(JSON.stringify({
        event: "command",
        func: muted ? "mute" : "unMute",
        args: []
      }), "https://www.youtube.com");
      if (!muted) {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: "command",
          func: "playVideo",
          args: []
        }), "https://www.youtube.com");
      }
    });
  }

  function bindBanner() {
    var banner = document.querySelector("[data-l4s-banner]");
    if (!banner) return;

    var id = banner.getAttribute("data-l4s-banner") || String(config.bannerId || "");
    var dismiss = banner.querySelector("[data-l4s-dismiss-banner]");
    var dismissedKey = "link4sub:banner:" + id + ":dismissed";

    try {
      if (id && window.localStorage.getItem(dismissedKey) === "1") {
        banner.hidden = true;
        return;
      }
    } catch (error) {}

    if (!dismiss) return;
    dismiss.addEventListener("click", function () {
      try {
        if (id) window.localStorage.setItem(dismissedKey, "1");
      } catch (error) {}
      banner.hidden = true;
    });
  }

  function bindMonetizationScripts() {
    document.querySelectorAll("[data-l4s-script-ad]").forEach(function (slot) {
      var url = slot.getAttribute("data-script-url");
      if (!url || !/^https?:\/\//i.test(url) || slot.getAttribute("data-loaded") === "1") return;
      slot.setAttribute("data-loaded", "1");
      var script = document.createElement("script");
      script.async = true;
      script.src = url;
      var zone = slot.getAttribute("data-zone-id");
      if (zone) script.dataset.zoneId = zone;
      slot.appendChild(script);
    });
  }

  function showToast(message) {
    var toast = document.getElementById("l4s-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function readCompletedIds() {
    try {
      var stored = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      return Array.isArray(stored)
        ? stored.filter(function (value) { return typeof value === "string"; })
        : [];
    } catch (error) {
      return [];
    }
  }

  function writeCompletedIds(ids) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch (error) {}
  }

  function text(key, variables, fallback) {
    return window.Link4SubI18n && typeof window.Link4SubI18n.t === "function"
      ? window.Link4SubI18n.t(key, variables || {}, fallback)
      : fallback;
  }
})();
