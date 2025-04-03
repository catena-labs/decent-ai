import { Rect, Svg, type SvgProps } from "react-native-svg"

export function DotsIcon(props: SvgProps) {
  return (
    <Svg fill="none" viewBox="0 0 42 16" {...props}>
      <Rect fill="#FFB876" height="16" rx="8" width="23.4667" />
      <Rect fill="#A276FF" height="16" rx="8" width="23.4667" x="6.40002" />
      <Rect fill="#97C5E5" height="16" rx="8" width="23.4667" x="12.8" />
      <Rect fill="#4E5BF6" height="16" rx="8" width="22.4" x="19.2" />
      <Rect fill="#00082D" height="16" rx="8" width="16" x="25.6" />
    </Svg>
  )
}
