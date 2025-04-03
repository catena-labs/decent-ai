export function imagesQueryKey(userId?: string | null) {
  return ["images", userId]
}

export function imageCountQueryKey(userId?: string | null) {
  return ["images", userId, "count"]
}

export function latestImagesQueryKey(userId?: string | null) {
  return ["images", userId, "latest"]
}

export function imageQueryKey(userId?: string | null, imageId?: string | null) {
  return ["images", userId, imageId]
}
