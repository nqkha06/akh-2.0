(function () {
  "use strict";

  var root = document.getElementById("l4s-safe-overlay");
  var configNode = document.getElementById("l4s-safe-config");
  if (!root || !configNode) return;

  var config = {};
  try { config = JSON.parse(configNode.textContent || "{}"); } catch (error) {}

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
  var progressTitle = root.querySelector("[data-l4s-safe-progress-title]");
  var progressBar = root.querySelector("[data-l4s-safe-progress-bar]");
  var ids = actions.map(function (node) { return node.getAttribute("data-l4s-safe-action"); });
  var storageKey = "link4sub:safe:unlock:" + String(config.slug || "");
  var completed = readCompleted().filter(function (id) { return ids.indexOf(id) !== -1; });
  var completionSent = false;

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

  update();

  if (unlock) unlock.addEventListener("click", function (event) {
    if (!unlock.classList.contains("is-ready")) {
      event.preventDefault();
      return;
    }
    completeVisit();
    if (unlock.getAttribute("data-type") === "snippet") {
      var snippet = root.querySelector("[data-l4s-safe-snippet]");
      if (snippet) snippet.hidden = false;
      unlock.textContent = "Nội dung đã được hiển thị";
    }
  });

  function countdown(action, id) {
    var delay = Math.max(1, Number(config.actionDelaySeconds) || 6);
    var label = action.querySelector(".l4s-safe-action-label");
    var bar = action.querySelector("i b");
    var original = label ? label.getAttribute("data-label") : "";
    action.classList.add("is-waiting");
    if (label) label.textContent = "Vui lòng chờ...";
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
    var done = ids.filter(function (id) { return completed.indexOf(id) !== -1; }).length;
    var ready = ids.length === 0 || done === ids.length;
    var percent = ids.length === 0 ? 100 : done / ids.length * 100;
    if (completedNode) completedNode.textContent = String(done);
    if (progressBar) progressBar.style.width = percent + "%";
    if (progressTitle) progressTitle.textContent = ready ? "Nội dung đã sẵn sàng" : "Tiến độ mở khóa";
    if (!unlock) return;
    unlock.classList.toggle("is-ready", ready);
    if (unlock.tagName === "BUTTON") {
      unlock.disabled = !ready;
      unlock.textContent = ready ? "Mở nội dung" : "Hoàn thành yêu cầu để mở khóa";
    } else if (ready) {
      unlock.setAttribute("href", unlock.getAttribute("data-href") || "#");
      unlock.textContent = unlock.getAttribute("data-type") === "file" ? "Mở file" : "Tiếp tục đến liên kết";
    } else {
      unlock.removeAttribute("href");
      unlock.textContent = "Hoàn thành yêu cầu để mở khóa";
    }
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

  function readCompleted() {
    try {
      var value = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) { return []; }
  }

  function writeCompleted(value) {
    try { window.localStorage.setItem(storageKey, JSON.stringify(value)); } catch (error) {}
  }
})();
