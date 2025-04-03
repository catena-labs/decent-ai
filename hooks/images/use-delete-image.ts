import { useMutation, useQueryClient } from "@tanstack/react-query"
import { and, eq } from "drizzle-orm"

import { db } from "@/drizzle/client"
import { imagesTable } from "@/drizzle/schema"
import { useAuthentication } from "@/hooks/use-authentication"
import { remove } from "@/lib/fs/remove"
import { imagesQueryKey } from "@/lib/images/query-keys"
import { createLogger } from "@/lib/logger"

const logger = createLogger("hooks:use-delete-image")

export function useDeleteImage() {
  const queryClient = useQueryClient()
  const { userId } = useAuthentication()

  return useMutation({
    mutationFn: async (imageId: string) => {
      if (!userId) {
        throw new Error("Not authenticated")
      }

      const [deletedImage] = await db
        .delete(imagesTable)
        .where(and(eq(imagesTable.id, imageId), eq(imagesTable.userId, userId)))
        .returning({ uri: imagesTable.uri })

      if (!deletedImage) {
        logger.info(`No image exists for id:  ${imageId}. Nothing to delete.`)
        return
      }

      if (deletedImage.uri) {
        await remove(deletedImage.uri)
      }
    },
    onSuccess: async () => {
      //  Mark conversation queries as stale
      await queryClient.invalidateQueries({
        queryKey: imagesQueryKey(userId)
      })
    }
  })
}
