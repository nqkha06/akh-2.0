(function () {
  "use strict";

  document.querySelectorAll("[data-l4s-media-target]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (!window.wp || !wp.media) return;
      var target = document.getElementById(button.getAttribute("data-l4s-media-target"));
      if (!target) return;
      var frame = wp.media({ title: "Chọn media", button: { text: "Sử dụng media này" }, multiple: false });
      frame.on("select", function () {
        var attachment = frame.state().get("selection").first().toJSON();
        target.value = attachment.url || "";
        target.dispatchEvent(new Event("input", { bubbles: true }));
      });
      frame.open();
    });
  });

  document.querySelectorAll(".l4s-range-field input[type=range]").forEach(function (range) {
    var output = range.closest("label").querySelector("output");
    var update = function () { if (output) output.textContent = range.value + (range.dataset.unit || ""); };
    range.addEventListener("input", update);
    update();
  });

  initLanguageAdmin();

  var preview = document.querySelector("[data-l4s-banner-preview]");
  if (!preview) return;
  var option = "link4sub_settings";
  var bindings = {
    banner_eyebrow: "eyebrow",
    banner_title: "title",
    banner_description: "description",
    banner_primary_label: "primary"
  };
  Object.keys(bindings).forEach(function (key) {
    var input = document.querySelector('[name="' + option + '[' + key + ']"]');
    var output = preview.querySelector('[data-preview="' + bindings[key] + '"]');
    if (!input || !output) return;
    input.addEventListener("input", function () { output.textContent = input.value || (key === "banner_description" ? "Mô tả banner sẽ xuất hiện tại đây." : ""); });
  });
  var style = document.querySelector('[name="' + option + '[banner_style]"]');
  if (style) style.addEventListener("change", function () {
    preview.className = "l4s-preview-banner is-" + style.value;
  });

  function initLanguageAdmin() {
    var root = document.querySelector("[data-l4s-language-admin]");
    var dataNode = document.getElementById("l4s-language-admin-data");
    if (!root || !dataNode) return;
    var initial;
    try { initial = JSON.parse(dataNode.textContent || "{}"); } catch (error) { initial = {}; }
    var schema = initial.schema && typeof initial.schema === "object" ? initial.schema : {};
    var state = {
      default: String(initial.default || "vi"),
      languages: Array.isArray(initial.languages) ? initial.languages : [],
      selected: ""
    };
    var list = root.querySelector("[data-l4s-language-list]");
    var editor = root.querySelector("[data-l4s-language-editor]");
    var payload = root.querySelector("[data-l4s-language-payload]");
    var count = root.querySelector("[data-l4s-language-count]");
    var add = root.querySelector("[data-l4s-language-add]");
    state.languages.forEach(function (language) {
      language.code = String(language.code || "").toLowerCase();
      language.name = String(language.name || language.code.toUpperCase());
      language.enabled = language.enabled !== false;
      language.source = language.source === "builtin" ? "builtin" : "custom";
      language.texts = Object.assign({}, schema, language.texts || {});
    });
    state.selected = state.languages[0] ? state.languages[0].code : "";

    add.addEventListener("click", function () {
      if (state.languages.length >= 20) {
        window.alert("Chỉ được cấu hình tối đa 20 ngôn ngữ.");
        return;
      }
      var index = 1;
      var code = "lang-" + index;
      while (findLanguage(code)) { index += 1; code = "lang-" + index; }
      state.languages.push({ code: code, name: "Ngôn ngữ mới", enabled: true, source: "custom", texts: Object.assign({}, schema) });
      state.selected = code;
      render();
      var codeInput = editor.querySelector("[data-language-code]");
      if (codeInput) { codeInput.focus(); codeInput.select(); }
    });

    list.addEventListener("click", function (event) {
      var item = event.target.closest("[data-language-select]");
      if (!item) return;
      state.selected = item.getAttribute("data-language-select") || "";
      render();
    });

    editor.addEventListener("input", handleEditorInput);
    editor.addEventListener("change", handleEditorInput);
    editor.addEventListener("click", function (event) {
      var remove = event.target.closest("[data-language-delete]");
      if (!remove) return;
      if (state.languages.length <= 1) {
        window.alert("Phải giữ lại ít nhất một ngôn ngữ.");
        return;
      }
      var language = selectedLanguage();
      if (!language || !window.confirm("Xoá ngôn ngữ “" + language.name + "”?")) return;
      state.languages = state.languages.filter(function (item) { return item !== language; });
      if (state.default === language.code) {
        var fallback = state.languages.find(function (item) { return item.enabled; }) || state.languages[0];
        fallback.enabled = true;
        state.default = fallback.code;
      }
      state.selected = state.languages[0].code;
      render();
    });

    editor.addEventListener("keyup", function (event) {
      if (!event.target.matches("[data-language-search]")) return;
      var query = event.target.value.trim().toLowerCase();
      editor.querySelectorAll("[data-translation-row]").forEach(function (row) {
        row.hidden = query !== "" && (row.getAttribute("data-search") || "").indexOf(query) === -1;
      });
    });

    var form = root.closest("form");
    if (form) form.addEventListener("submit", syncPayload);
    render();

    function handleEditorInput(event) {
      var language = selectedLanguage();
      if (!language) return;
      if (event.target.matches("[data-language-name]")) language.name = event.target.value;
      if (event.target.matches("[data-language-enabled]")) {
        language.enabled = event.target.checked;
        if (!language.enabled && state.default === language.code) {
          var fallback = state.languages.find(function (item) { return item !== language && item.enabled; });
          if (fallback) state.default = fallback.code;
          else { language.enabled = true; event.target.checked = true; }
        }
      }
      if (event.target.matches("[data-language-default]")) {
        language.enabled = true;
        state.default = language.code;
      }
      if (event.target.matches("[data-language-code]") && language.source !== "builtin") {
        var nextCode = event.target.value.trim().toLowerCase();
        if (/^[a-z][a-z0-9-]{1,11}$/.test(nextCode) && !state.languages.some(function (item) { return item !== language && item.code === nextCode; })) {
          var oldCode = language.code;
          language.code = nextCode;
          state.selected = nextCode;
          if (state.default === oldCode) state.default = nextCode;
        }
      }
      if (event.target.matches("[data-translation-key]")) {
        language.texts[event.target.getAttribute("data-translation-key")] = event.target.value;
      }
      syncPayload();
      if (!event.target.matches("[data-translation-key], [data-language-name], [data-language-code]")) render();
      else renderList();
    }

    function render() {
      renderList();
      renderEditor();
      syncPayload();
    }

    function renderList() {
      if (count) count.textContent = String(state.languages.length);
      list.innerHTML = state.languages.map(function (language) {
        return '<button type="button" class="l4s-language-item' + (language.code === state.selected ? ' is-active' : '') + '" data-language-select="' + escapeHtml(language.code) + '">' +
          '<i>' + escapeHtml(language.code.slice(0, 3)) + '</i><span><strong>' + escapeHtml(language.name || language.code.toUpperCase()) + '</strong><small>' + escapeHtml(language.source === "builtin" ? "Mặc định plugin" : "Tùy chỉnh") + (state.default === language.code ? " · Mặc định" : "") + '</small></span><em class="' + (language.enabled ? "is-enabled" : "") + '"></em></button>';
      }).join("");
    }

    function renderEditor() {
      var language = selectedLanguage();
      if (!language) {
        editor.innerHTML = '<div class="l4s-language-empty"><div><strong>Chưa có ngôn ngữ</strong><p>Thêm một ngôn ngữ để hệ thống tự tạo bộ text STU.</p></div></div>';
        return;
      }
      var fields = Object.keys(schema).map(function (key) {
        var value = language.texts[key] == null ? schema[key] : language.texts[key];
        var label = key.indexOf("action_") === 0 ? "Action · " + key.slice(7).replace(/_/g, " ") : key.replace(/_/g, " ");
        return '<label class="l4s-field l4s-language-text" data-translation-row data-search="' + escapeHtml((key + " " + label + " " + value).toLowerCase()) + '"><span>' + escapeHtml(label) + '<code>' + escapeHtml(key) + '</code></span><textarea rows="2" maxlength="500" data-translation-key="' + escapeHtml(key) + '">' + escapeHtml(value) + '</textarea></label>';
      }).join("");
      editor.innerHTML = '<div class="l4s-language-editor-head"><div class="l4s-card-heading"><div><span>' + (language.source === "builtin" ? "BUILT-IN" : "CUSTOM") + '</span><h2>' + escapeHtml(language.name) + '</h2><p>Mọi khóa đã được tự tạo; có thể sửa từng bản dịch bên dưới.</p></div></div><div class="l4s-language-editor-actions"><button type="button" class="button button-link-delete" data-language-delete>Xoá</button></div></div>' +
        '<div class="l4s-language-editor-meta"><label class="l4s-field"><span>Mã ngôn ngữ</span><input type="text" required pattern="[a-z][a-z0-9-]{1,11}" maxlength="12" value="' + escapeHtml(language.code) + '" data-language-code ' + (language.source === "builtin" ? "readonly" : "") + '></label><label class="l4s-field"><span>Tên hiển thị</span><input type="text" required maxlength="60" value="' + escapeHtml(language.name) + '" data-language-name></label><div><label class="l4s-toggle"><input type="checkbox" data-language-enabled ' + (language.enabled ? "checked" : "") + '><span aria-hidden="true"></span><b>Bật</b></label><label class="l4s-language-default"><input type="radio" name="l4s-language-default" data-language-default ' + (state.default === language.code ? "checked" : "") + '> Mặc định</label></div></div>' +
        '<div class="l4s-language-translation-head"><div><strong>Bộ text STU</strong><p>Hỗ trợ biến <code>{page}</code>, <code>{total}</code> và <code>{seconds}</code>.</p></div><input type="search" class="regular-text" placeholder="Tìm key hoặc nội dung…" data-language-search></div><div class="l4s-language-fields">' + fields + '</div>';
    }

    function syncPayload() {
      payload.value = JSON.stringify({ default: state.default, languages: state.languages.map(function (language) {
        return { code: language.code, name: language.name, enabled: language.enabled, source: language.source, texts: language.texts };
      }) });
    }

    function selectedLanguage() {
      return findLanguage(state.selected);
    }

    function findLanguage(code) {
      return state.languages.find(function (language) { return language.code === code; });
    }

    function escapeHtml(value) {
      return String(value == null ? "" : value).replace(/[&<>'"]/g, function (character) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character];
      });
    }
  }
})();
