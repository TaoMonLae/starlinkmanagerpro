import { api } from "./api.js";

export async function downloadFromApi(url, filename = null) {
  const response = await api.get(url, { responseType: "blob" });
  const href = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename || filenameFromDisposition(response.headers["content-disposition"]) || "download";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

function filenameFromDisposition(disposition = "") {
  const utfMatch = disposition.match(/filename\\*=UTF-8''([^;]+)/i);
  if (utfMatch) return decodeURIComponent(utfMatch[1].replace(/"/g, ""));
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] || null;
}
