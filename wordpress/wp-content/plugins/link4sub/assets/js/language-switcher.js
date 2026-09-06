(function () {
  "use strict";

  var node = document.getElementById("l4s-i18n-config");
  var bundle = {};
  try { bundle = node ? JSON.parse(node.textContent || "{}") : {}; } catch (error) {}
  var languages = Array.isArray(bundle.languages) ? bundle.languages.filter(validLanguage) : [];
  if (!languages.length) return;
  var currentCode = readStoredCode();
  var current = findLanguage(currentCode) || findLanguage(bundle.default) || languages[0];

  window.Link4SubI18n = {
    t: translate,
    current: function () { return current.code; },
    languages: languages.map(function (language) { return { code: language.code, name: language.name }; }),
    set: setLanguage
  };

  document.querySelectorAll("[data-l4s-language-root]").forEach(initSwitcher);
  applyDocument();

  function validLanguage(language) {
    return language && /^[a-z][a-z0-9-]{1,11}$/.test(String(language.code || "")) && language.texts && typeof language.texts === "object";
  }

  function readStoredCode() {
    try {
      var stored = window.localStorage.getItem("link4sub:language");
      if (stored) return stored;
    } catch (error) {}
    return String(bundle.default || "vi");
  }

  function findLanguage(code) {
    return languages.find(function (language) { return language.code === code; });
  }

  function translate(key, variables, fallback) {
    var value = current.texts && typeof current.texts[key] === "string" ? current.texts[key] : "";
    if (!value) value = fallback == null ? key : String(fallback);
    Object.keys(variables || {}).forEach(function (name) {
      value = value.split("{" + name + "}").join(String(variables[name]));
    });
    return value;
  }

  function setLanguage(code) {
    var language = findLanguage(code);
    if (!language) return;
    current = language;
    try { window.localStorage.setItem("link4sub:language", current.code); } catch (error) {}
    applyDocument();
    document.dispatchEvent(new CustomEvent("link4sub:languagechange", { detail: { code: current.code } }));
  }

  function applyDocument() {
    document.documentElement.lang = current.code;
    document.querySelectorAll("[data-l4s-i18n]").forEach(function (element) {
      var key = element.getAttribute("data-l4s-i18n") || "";
      var value = translate(key, {}, element.textContent || "");
      element.textContent = value;
      if (element.hasAttribute("data-label")) element.setAttribute("data-label", value);
    });
    document.querySelectorAll("[data-l4s-i18n-aria]").forEach(function (element) {
      var value = translate(element.getAttribute("data-l4s-i18n-aria") || "", {}, element.getAttribute("aria-label") || "");
      element.setAttribute("aria-label", value);
      element.setAttribute("title", value);
    });
    document.querySelectorAll("[data-l4s-language-root]").forEach(updateSwitcher);
  }

  function initSwitcher(root) {
    var toggle = root.querySelector("[data-l4s-language-toggle]");
    var menu = root.querySelector("[data-l4s-language-menu]");
    if (!toggle || !menu) return;
    menu.innerHTML = languages.map(function (language) {
      return '<button type="button" role="menuitemradio" data-l4s-language-option="' + escapeHtml(language.code) + '"><span>' + escapeHtml(language.code.toUpperCase()) + '</span><b>' + escapeHtml(language.name) + '</b><i aria-hidden="true">✓</i></button>';
    }).join("");
    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var opening = menu.hidden;
      closeAllMenus();
      menu.hidden = !opening;
      toggle.setAttribute("aria-expanded", opening ? "true" : "false");
    });
    menu.addEventListener("click", function (event) {
      var option = event.target.closest("[data-l4s-language-option]");
      if (!option) return;
      setLanguage(option.getAttribute("data-l4s-language-option") || "");
      closeAllMenus();
    });
  }

  function updateSwitcher(root) {
    var code = root.querySelector("[data-l4s-language-code]");
    var toggle = root.querySelector("[data-l4s-language-toggle]");
    if (code) code.textContent = current.code.toUpperCase();
    if (toggle) {
      var label = translate("language", {}, "Language") + ": " + current.name;
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("title", label);
    }
    root.querySelectorAll("[data-l4s-language-option]").forEach(function (option) {
      var active = option.getAttribute("data-l4s-language-option") === current.code;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-checked", active ? "true" : "false");
    });
  }

  function closeAllMenus() {
    document.querySelectorAll("[data-l4s-language-menu]").forEach(function (menu) { menu.hidden = true; });
    document.querySelectorAll("[data-l4s-language-toggle]").forEach(function (toggle) { toggle.setAttribute("aria-expanded", "false"); });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character];
    });
  }

  document.addEventListener("click", closeAllMenus);
  document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeAllMenus(); });
})();
