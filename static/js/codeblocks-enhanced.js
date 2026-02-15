(() => {
  const PREVIEW_LINES = 14;

  function getLineCount(text) {
    return text.replace(/\n$/, "").split("\n").length;
  }

  function enhanceCodeBlock(codeblock) {
    const pre = codeblock.parentElement;
    const container = pre.closest(".highlight") || pre;

    if (!container || container.dataset.codeEnhanced === "true") {
      return;
    }
    if (container.classList.contains("no-collapse")) {
      return;
    }

    container.dataset.codeEnhanced = "true";

    const lines = getLineCount(codeblock.textContent || "");
    if (lines <= PREVIEW_LINES) {
      return;
    }

    container.classList.add("code-collapsible");
    container.style.setProperty("--code-preview-lines", String(PREVIEW_LINES));

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "code-toggle";
    toggle.textContent = `Show ${lines - PREVIEW_LINES} more lines`;
    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", () => {
      const expanded = container.classList.toggle("is-expanded");
      toggle.textContent = expanded ? "Show less" : `Show ${lines - PREVIEW_LINES} more lines`;
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    });

    container.insertAdjacentElement("afterend", toggle);
  }

  document.querySelectorAll(".post-content pre > code").forEach(enhanceCodeBlock);
})();
