import { Image, type ImageProps } from "expo-image"
import { type UriProps } from "react-native-svg"
import { SvgCssUri } from "react-native-svg/css"

type MinimalUriProps = Omit<UriProps, "uri">
type MinimalImageProps = Omit<ImageProps, "source">
type SharedProps = MinimalImageProps | MinimalUriProps

export type ExternalImageProps = SharedProps & {
  uri: string
}

function isSvg(uri: string, props: SharedProps): props is MinimalUriProps {
  return uri.endsWith(".svg")
}

/**
 * A naive wrapper around Image and SvgUri that automatically detects the type
 * of the image and renders the appropriate component.
 */
export function ExternalImage({ uri, ...props }: ExternalImageProps) {
  if (isSvg(uri, props)) {
    return <SvgCssUri uri={uri} {...props} />
  }

  return (
    <Image
      source={{
        uri
      }}
      {...props}
    />
  )
}
