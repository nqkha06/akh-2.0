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
})();
