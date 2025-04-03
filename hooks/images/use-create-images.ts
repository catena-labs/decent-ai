import { useMutation, useQueryClient } from "@tanstack/react-query"

import { db } from "@/drizzle/client"
import { type UserImage, imagesTable, newImageSchema } from "@/drizzle/schema"
import { useAuthentication } from "@/hooks/use-authentication"
import { downloadImages } from "@/lib/images/download-images"
import { imagesQueryKey } from "@/lib/images/query-keys"
import { createLogger } from "@/lib/logger"

const logger = createLogger("hooks:use-create-images")

type CreateImagesParams = {
  generationId: string
  uris: string[]
  prompt: string
  modelSlug: string
  model?: string
  provider?: string
}

export function useCreateImages() {
  const { userId } = useAuthentication()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      generationId,
      prompt,
      modelSlug,
      model,
      provider,
      uris
    }: CreateImagesParams) => {
      if (!userId) {
        throw new Error("Not authenticated")
      }

      logger.debug("Saving images to database.", {
        uris
      })

      const results = await downloadImages(uris, userId)

      const imageValues = results.map(({ id, localUri }) =>
        newImageSchema.parse({
          id, // ID set to match the ID in the file name for clarity
          userId,
          prompt,
          modelSlug,
          model,
          provider,
          generationId,
          uri: localUri
        })
      )

      const newImages: UserImage[] = await db
        .insert(imagesTable)
        .values(imageValues)
        .returning()

      return newImages
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: imagesQueryKey(userId)
      })
    }
  })
}
