import { Text } from "@/components/elements/text"
import { TextInput } from "@/components/elements/text-input"
import { View, type ViewProps } from "@/components/elements/view"
import { useColors } from "@/hooks/use-colors"

type Props = ViewProps & {
  name: string
  description?: string
  inputMode?: "none" | "text" | "url"
  value: string
  setValue: (value: string) => void
  secureTextEntry?: boolean
}

export function NewModelInputField({
  value,
  setValue,
  name,
  description,
  inputMode = "text",
  secureTextEntry = false,
  ...props
}: Props) {
  const colors = useColors()

  return (
    <View {...props}>
      <View className="flex h-12 w-full items-start justify-center rounded-md border border-input px-3">
        <TextInput
          className="w-full bg-card text-[15px] text-foreground"
          placeholder={name}
          placeholderTextColor={colors["muted-foreground"]}
          value={value}
          onChangeText={setValue}
          autoComplete="off"
          autoCapitalize="none"
          inputMode={inputMode}
          secureTextEntry={secureTextEntry}
        />
      </View>
      {description ? (
        <View className="flex w-full items-start justify-center px-3 py-2">
          <Text className="text-[13px] text-muted-foreground">
            {description}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
