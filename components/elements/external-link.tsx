import { Link } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import React, { type ComponentProps } from "react"
import { z } from "zod"

import { isWeb } from "@/lib/utils/platform"

export const externalLinkHrefSchema = z
  .string()
  .refine((val): val is `${string}:${string}` => val.split(":").length === 2, {
    message: "Invalid link URL"
  })

export type ExternalLinkHref = z.infer<typeof externalLinkHrefSchema>

export type ExternalLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: ExternalLinkHref
}

export function ExternalLink({ href, onPress, ...props }: ExternalLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      onPress={(e) => {
        onPress?.(e)
        if (!isWeb) {
          e.preventDefault()
          void WebBrowser.openBrowserAsync(href)
        }
      }}
      target="_blank"
    />
  )
}
