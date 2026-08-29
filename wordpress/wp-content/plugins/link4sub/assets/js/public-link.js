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

  updateUnlockState();
  bindUnlock();
  bindTheme();
  bindShare();
  bindAudio();
  bindBanner();
  document.documentElement.classList.remove("l4s-loading");

  function startActionCountdown(action, id) {
    var label = action.querySelector(".l4s-action-label");
    var bar = action.querySelector(".l4s-action-progress span");
    var originalLabel = label ? label.getAttribute("data-label") : "";
    var remaining = delay;

    action.classList.add("is-loading");
    action.setAttribute("aria-busy", "true");
    if (label) label.textContent = "Vui lòng chờ...";
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
    var total = validIds.length;
    var completed = validIds.filter(function (id) {
      return completeIds.indexOf(id) !== -1;
    }).length;
    var unlocked = total === 0 || completed === total;
    var progress = total === 0 ? 100 : (completed / total) * 100;

    if (completedCount) completedCount.textContent = String(completed);
    if (progressBar) {
      progressBar.style.width = progress + "%";
      progressBar.classList.toggle("is-ready", unlocked);
    }
    if (progressTitle) {
      progressTitle.textContent = unlocked
        ? "Nội dung đã sẵn sàng"
        : "Tiến độ mở khóa";
    }
    if (!unlock) return;

    var label = unlock.querySelector(".l4s-unlock-label");
    var type = unlock.getAttribute("data-type") || "url";
    unlock.classList.toggle("is-ready", unlocked);
    unlock.setAttribute("aria-disabled", unlocked ? "false" : "true");

    if (unlock.tagName === "BUTTON") {
      unlock.disabled = !unlocked;
      if (label) label.textContent = unlocked ? "Mở nội dung" : "Mở khóa nội dung";
    } else if (unlocked) {
      unlock.setAttribute("href", unlock.getAttribute("data-href") || "#");
      if (label) {
        label.textContent = type === "file" ? "Mở file" : "Tiếp tục đến liên kết";
      }
    } else {
      unlock.removeAttribute("href");
      if (label) label.textContent = "Hoàn thành yêu cầu để mở khóa";
    }
  }

  function bindUnlock() {
    if (!unlock) return;
    unlock.addEventListener("click", function (event) {
      if (!unlock.classList.contains("is-ready")) {
        event.preventDefault();
        return;
      }

      completeVisit();
      if (unlock.getAttribute("data-type") === "snippet") {
        var snippet = document.getElementById("l4s-snippet");
        var label = unlock.querySelector(".l4s-unlock-label");
        if (snippet) snippet.hidden = false;
        if (label) label.textContent = "Nội dung đã được hiển thị";
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

  function bindTheme() {
    var button = document.getElementById("l4s-theme");
    if (!button) return;
    button.addEventListener("click", function () {
      var dark = document.documentElement.classList.toggle("l4s-dark");
      try {
        window.localStorage.setItem("link4sub:theme", dark ? "dark" : "light");
      } catch (error) {}
    });
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
        showToast("Đã sao chép link");
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
    showToast(copied ? "Đã sao chép link" : "Không thể sao chép link");
  }

  function bindAudio() {
    var button = document.getElementById("l4s-audio");
    var iframe = document.getElementById("l4s-youtube-background");
    if (!button || !iframe) return;
    var muted = true;
    button.addEventListener("click", function () {
      muted = !muted;
      button.setAttribute("aria-label", muted ? "Bật âm thanh nền" : "Tắt âm thanh nền");
      button.setAttribute("title", muted ? "Bật âm thanh nền" : "Tắt âm thanh nền");
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
})();
