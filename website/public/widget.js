(function() {
  var botId = document.currentScript.getAttribute("data-bot-id");
  if (!botId) return;

  var color = document.currentScript.getAttribute("data-color") || "#C4623D";
  var position = document.currentScript.getAttribute("data-position") || "right";
  var text = document.currentScript.getAttribute("data-text") || "Задать вопрос";

  // Create button
  var btn = document.createElement("div");
  btn.style.cssText = "position:fixed;bottom:20px;" + (position === "left" ? "left:20px" : "right:20px") + ";z-index:99999;cursor:pointer;display:flex;align-items:center;gap:8px;background:" + color + ";color:#fff;padding:12px 20px;border-radius:50px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.15);transition:transform 0.2s";
  btn.textContent = text;
  btn.onmouseenter = function() { btn.style.transform = "scale(1.05)"; };
  btn.onmouseleave = function() { btn.style.transform = "scale(1)"; };

  // Create iframe container
  var container = document.createElement("div");
  container.style.cssText = "position:fixed;bottom:80px;" + (position === "left" ? "left:20px" : "right:20px") + ";z-index:99998;width:380px;height:520px;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.2);display:none;transition:opacity 0.3s,transform 0.3s;opacity:0;transform:translateY(20px)";

  var iframe = document.createElement("iframe");
  iframe.src = "https://stoneai.ru/widget?bot=" + botId;
  iframe.style.cssText = "width:100%;height:100%;border:none";
  container.appendChild(iframe);

  var open = false;
  btn.onclick = function() {
    open = !open;
    if (open) {
      container.style.display = "block";
      setTimeout(function() { container.style.opacity = "1"; container.style.transform = "translateY(0)"; }, 10);
      btn.textContent = "✕";
      btn.style.borderRadius = "50%";
      btn.style.padding = "12px 16px";
    } else {
      container.style.opacity = "0";
      container.style.transform = "translateY(20px)";
      setTimeout(function() { container.style.display = "none"; }, 300);
      btn.textContent = text;
      btn.style.borderRadius = "50px";
      btn.style.padding = "12px 20px";
    }
  };

  document.body.appendChild(container);
  document.body.appendChild(btn);
})();
