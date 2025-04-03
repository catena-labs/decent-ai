declare module "react-native-hold-menu" {
  import { type ComponentType, type ReactElement } from "react"
  import { type HoldItemProps as OriginalProps } from "react-native-hold-menu"
  import { type Omit } from "utility-types"

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- attempting to use existing types
  export type HoldItemProps = Omit<OriginalProps, "portalContainerStyles"> & {
    portalContainerStyles?: React.CSSProperties
  }

  export class HoldItem extends React.Component<HoldItemProps, unknown> {}

  // Define the HoldMenuProviderProps
  export type HoldMenuProviderProps = {
    theme?: "dark" | "light"
    iconComponent?: unknown
    children: ReactElement | ReactElement[]
    safeAreaInsets: {
      top: number
      right: number
      bottom: number
      left: number
    }
    onOpen?: () => void
    onClose?: () => void
  }

  // Add the HoldMenuProvider here
  export const HoldMenuProvider: ComponentType<HoldMenuProviderProps>
}
