import { Circle, Svg, type SvgProps } from "react-native-svg"

export function UploadImageIcon(props: SvgProps) {
  return (
    <Svg viewBox="0 0 51 51" fill="none" {...props}>
      <Circle cx="25.5" cy="25.5" r="25.5" fill="#FFB876" />
      <Circle cx="25.5001" cy="25.4999" r="21.6509" fill="#A276FF" />
      <Circle cx="25.5001" cy="25.5" r="17.8019" fill="#97C5E5" />
      <Circle cx="25.5" cy="25.4999" r="13.9528" fill="#4E5BF6" />
      <Circle cx="25.5" cy="25.5" r="10.1038" fill="#00082D" />
    </Svg>
  )
}
