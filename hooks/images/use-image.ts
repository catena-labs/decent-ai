import { useQuery } from "@tanstack/react-query"
import { and, eq } from "drizzle-orm"

import { db } from "@/drizzle/client"
import { type UserImage, imageSchema, imagesTable } from "@/drizzle/schema"
import { imageQueryKey } from "@/lib/images/query-keys"
import { createLogger } from "@/lib/logger"

import { useAuthentication } from "../use-authentication"

const logger = createLogger("use-image")

export function useImage(imageId?: string) {
  const { userId } = useAuthentication()

  return useQuery<UserImage | undefined>({
    enabled: Boolean(userId && imageId),
    queryKey: imageQueryKey(userId, imageId),
    queryFn: async () => {
      if (!imageId) {
        return undefined
      }

      if (!userId) {
        throw new Error("User not authenticated")
      }

      logger.debug("Loading image ...")

      const [image] = await db
        .select()
        .from(imagesTable)
        .where(and(eq(imagesTable.id, imageId), eq(imagesTable.userId, userId)))
        .limit(1)

      if (!image) {
        throw new Error("Image not found")
      }

      return imageSchema.parse(image)
    }
  })
}
