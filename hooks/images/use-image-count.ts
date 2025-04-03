import { useQuery } from "@tanstack/react-query"
import { count, eq } from "drizzle-orm"

import { db } from "@/drizzle/client"
import { imagesTable } from "@/drizzle/schema"
import { imageCountQueryKey } from "@/lib/images/query-keys"

import { useAuthentication } from "../use-authentication"

export function useImageCount() {
  const { userId } = useAuthentication()

  return useQuery({
    queryKey: imageCountQueryKey(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("Not authenticated")
      }

      const [result] = await db
        .select({ count: count() })
        .from(imagesTable)
        .where(eq(imagesTable.userId, userId))

      return result?.count ?? 0
    },
    enabled: Boolean(userId)
  })
}
