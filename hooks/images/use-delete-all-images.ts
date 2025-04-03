import { useMutation, useQueryClient } from "@tanstack/react-query"
import { eq } from "drizzle-orm"

import { db } from "@/drizzle/client"
import { imagesTable } from "@/drizzle/schema"
import { remove } from "@/lib/fs/remove"
import { imagesDir } from "@/lib/images/images-dir"
import { imagesQueryKey } from "@/lib/images/query-keys"

import { useAuthentication } from "../use-authentication"

export function useDeleteAllImages() {
  const queryClient = useQueryClient()
  const { userId } = useAuthentication()

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("Not authenticated")
      }

      // Delete all images associated with the user
      const dirPath = imagesDir(userId)
      await remove(dirPath)

      await db.delete(imagesTable).where(eq(imagesTable.userId, userId))
    },
    onSuccess: async () => {
      const queryKey = imagesQueryKey(userId)

      // Mark the queries as stale
      await queryClient.invalidateQueries({
        queryKey
      })
    }
  })
}
