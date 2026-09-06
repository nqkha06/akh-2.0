(function () {
  "use strict";

  var config = window.Link4SubSafeClient || {};
  var context = readClientContext();
  if (!context || context.postId !== Number(config.postId || 0)) return;

  var started = false;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  function start() {
    if (started) return;
    started = true;
    ensureBootScreen();
    var stylesReady = loadStyles(Array.isArray(config.styles) ? config.styles : []);

    loadPublicLink(context)
      .then(function (result) {
        return hydrate(result.link, result.errorKind);
      })
      .then(function (payload) {
        if (!payload || typeof payload.html !== "string" || !payload.html.trim()) {
          throw new Error("Safe overlay response is empty.");
        }
        return stylesReady.then(function () {
          var template = document.createElement("template");
          template.innerHTML = payload.html.trim();
          document.body.appendChild(template.content);
          return loadScripts(Array.isArray(config.scripts) ? config.scripts : [])
            .then(releaseBootWhenOverlayIsReady);
        });
      })
      .catch(function () {
        finishBoot();
        clearReadableCookie();
      });
  }

  function ensureBootScreen() {
    if (!document.documentElement.classList.contains("l4s-safe-booting")) return;
    if (document.getElementById("l4s-safe-boot-screen")) return;
    var screen = document.createElement("div");
    screen.id = "l4s-safe-boot-screen";
    screen.setAttribute("role", "status");
    screen.setAttribute("aria-live", "polite");
    screen.setAttribute("aria-label", "Loading STU");
    var card = document.createElement("div");
    card.className = "l4s-safe-boot-card";
    var brand = document.createElement("span");
    brand.className = "l4s-safe-boot-brand";
    var boot = config.boot && typeof config.boot === "object" ? config.boot : {};
    var logoUrl = typeof boot.logoUrl === "string" ? boot.logoUrl : "";
    if (/^https?:\/\//i.test(logoUrl)) {
      var image = document.createElement("img");
      image.src = logoUrl;
      image.alt = "";
      brand.appendChild(image);
    } else {
      brand.textContent = String(boot.brand || "L").trim().slice(0, 1).toUpperCase() || "L";
    }
    var progress = document.createElement("span");
    progress.className = "l4s-safe-boot-progress";
    progress.setAttribute("aria-hidden", "true");
    card.appendChild(brand);
    card.appendChild(progress);
    screen.appendChild(card);
    document.body.appendChild(screen);
    document.documentElement.classList.add("l4s-safe-boot-ready");
  }

  function releaseBootWhenOverlayIsReady() {
    var delay = 0;
    var configNode = document.getElementById("l4s-safe-config");
    try {
      var overlayConfig = configNode ? JSON.parse(configNode.textContent || "{}") : {};
      delay = Math.max(0, Math.min(30, Number(overlayConfig.renderDelaySeconds) || 0));
    } catch (error) {}
    window.setTimeout(finishBoot, delay * 1000 + 80);
  }

  function finishBoot() {
    if (window.Link4SubSafeBootTimer) {
      window.clearTimeout(window.Link4SubSafeBootTimer);
      window.Link4SubSafeBootTimer = null;
    }
    var screen = document.getElementById("l4s-safe-boot-screen");
    var root = document.documentElement;
    root.classList.remove("l4s-safe-booting", "l4s-safe-boot-ready");
    root.removeAttribute("aria-busy");
    if (!screen) {
      root.classList.remove("l4s-safe-boot-dark");
      return;
    }
    screen.classList.add("is-leaving");
    window.setTimeout(function () {
      screen.remove();
      root.classList.remove("l4s-safe-boot-dark");
    }, 200);
  }

  function loadPublicLink(clientContext) {
    var storageKey = "link4sub:safe:payload:" + clientContext.flowId;
    var cached = readSession(storageKey);
    if (validPayload(cached, clientContext.alias)) {
      return Promise.resolve({ link: cached, errorKind: "" });
    }

    var baseUrl = String(config.apiVisitBaseUrl || "");
    if (!/^https?:\/\//i.test(baseUrl)) {
      return Promise.resolve({ link: null, errorKind: "api_error" });
    }
    var pageContext = Object.assign({}, config.pageContext || {});
    pageContext.adState = readSmartlinkState();
    var controller = typeof window.AbortController === "function" ? new window.AbortController() : null;
    var timeout = window.setTimeout(function () {
      if (controller) controller.abort();
    }, Math.max(3000, Math.min(30000, Number(config.requestTimeoutMs) || 10000)));

    return window.fetch(baseUrl + encodeURIComponent(clientContext.alias) + "/visit", {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      signal: controller ? controller.signal : undefined,
      body: JSON.stringify(pageContext)
    }).then(function (response) {
      if (!response.ok) {
        return { link: null, errorKind: response.status === 404 ? "not_found" : "api_error" };
      }
      return response.json().then(function (link) {
        if (!validPayload(link, clientContext.alias)) {
          return { link: null, errorKind: "api_error" };
        }
        writeSession(storageKey, link);
        return { link: link, errorKind: "" };
      });
    }).catch(function () {
      return { link: null, errorKind: "api_error" };
    }).then(function (result) {
      window.clearTimeout(timeout);
      return result;
    });
  }

  function hydrate(link, errorKind) {
    var hydrateUrl = String(config.hydrateUrl || "");
    if (!/^https?:\/\//i.test(hydrateUrl)) return Promise.reject(new Error("Invalid hydrate URL."));
    return window.fetch(hydrateUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        post_id: Number(config.postId || 0),
        link: link || null,
        error_kind: errorKind || ""
      })
    }).then(function (response) {
      if (!response.ok) throw new Error("Unable to hydrate Safe overlay.");
      return response.json();
    });
  }

  function validPayload(value, alias) {
    return value &&
      typeof value === "object" &&
      value.slug === alias &&
      typeof value.title === "string" &&
      typeof value.status === "string" &&
      Array.isArray(value.actions);
  }

  function readClientContext() {
    var name = String(config.clientCookieName || "");
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(name)) return null;
    var prefix = name + "=";
    var item = document.cookie.split("; ").find(function (value) {
      return value.indexOf(prefix) === 0;
    });
    if (!item) return null;
    var value = decodeURIComponent(item.slice(prefix.length));
    var match = value.match(/^([A-Za-z0-9][A-Za-z0-9_-]{0,127})\.([a-f0-9]{16})\.(\d+)$/);
    if (!match) return null;
    return {
      alias: match[1],
      flowId: match[2],
      postId: Number(match[3])
    };
  }

  function readSmartlinkState() {
    var history = readJsonCookie("link4sub_smartlink_history");
    var session = readJsonCookie("link4sub_smartlink_session");
    var ids = Object.keys(history).concat(Object.keys(session)).filter(function (id, index, values) {
      return values.indexOf(id) === index && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(id);
    }).slice(-10);
    return ids.map(function (adId) {
      var timestamps = Array.isArray(history[adId]) ? history[adId] : [];
      return {
        adId: adId,
        timestamps: timestamps.filter(Number.isSafeInteger).slice(-20),
        sessionCount: Math.max(0, Math.min(20, Number(session[adId]) || 0))
      };
    });
  }

  function readJsonCookie(name) {
    var prefix = name + "=";
    var item = document.cookie.split("; ").find(function (value) {
      return value.indexOf(prefix) === 0;
    });
    if (!item) return {};
    try {
      var parsed = JSON.parse(decodeURIComponent(item.slice(prefix.length)));
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function readSession(key) {
    try {
      return JSON.parse(window.sessionStorage.getItem(key) || "null");
    } catch (error) {
      return null;
    }
  }

  function writeSession(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function clearReadableCookie() {
    var name = String(config.clientCookieName || "");
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(name)) return;
    document.cookie = name + "=; Path=/; Max-Age=0; SameSite=Lax";
  }

  function loadStyles(urls) {
    return Promise.all(urls.filter(validAssetUrl).map(function (url) {
      if (document.querySelector('link[data-l4s-client-style="' + cssEscape(url) + '"]')) {
        return Promise.resolve();
      }
      return new Promise(function (resolve) {
        var finished = false;
        var complete = function () {
          if (finished) return;
          finished = true;
          window.clearTimeout(timeout);
          resolve();
        };
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        link.setAttribute("data-l4s-client-style", url);
        link.onload = complete;
        link.onerror = complete;
        var timeout = window.setTimeout(complete, 3000);
        document.head.appendChild(link);
      });
    }));
  }

  function loadScripts(urls) {
    return urls.filter(validAssetUrl).reduce(function (chain, url) {
      return chain.then(function () {
        return new Promise(function (resolve, reject) {
          var script = document.createElement("script");
          script.src = url;
          script.async = false;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      });
    }, Promise.resolve());
  }

  function validAssetUrl(value) {
    if (typeof value !== "string") return false;
    try {
      var url = new URL(value, window.location.origin);
      return /^https?:$/.test(url.protocol) && url.origin === window.location.origin;
    } catch (error) {
      return false;
    }
  }

  function cssEscape(value) {
    return String(value).replace(/["\\]/g, "\\$&");
  }
})();
