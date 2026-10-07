const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function getRawImage(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return getRawImage(value[0]);
  if (typeof value === "object") {
    return getRawImage(value.url || value.src || value.image || value.image_path || value.mainImage);
  }
  return null;
}

export function getImageUrl(item) {
  const rawImage = getRawImage(
    item?.mainImage ||
      item?.images ||
      item?.image ||
      item?.image_path ||
      item?.image_url ||
      item?.thumbnail ||
      item?.product_image ||
      item?.src
  );

  if (!rawImage) return null;
  if (/^(https?:|data:|blob:)/i.test(rawImage)) return rawImage;
  if (!API_BASE_URL) return rawImage;
  if (rawImage.startsWith("/")) return `${API_BASE_URL}${rawImage}`;
  return `${API_BASE_URL}/uploads/${rawImage.replace(/^\/+/, "")}`;
}