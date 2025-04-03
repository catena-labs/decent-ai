import { useQuery } from "@tanstack/react-query"
import { desc, eq } from "drizzle-orm"

import { db } from "@/drizzle/client"
import { imageSchema, imagesTable } from "@/drizzle/schema"
import { latestImagesQueryKey } from "@/lib/images/query-keys"

import { useAuthentication } from "../use-authentication"

export function useLatestImages() {
  const { userId } = useAuthentication()

  return useQuery({
    queryKey: latestImagesQueryKey(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated")
      }

      const messages = await db
        .select()
        .from(imagesTable)
        .where(eq(imagesTable.userId, userId))
        .orderBy(desc(imagesTable.createdAt))
        .limit(2)

      return messages.map((m) => imageSchema.parse(m))
    },
    enabled: Boolean(userId)
  })
}
