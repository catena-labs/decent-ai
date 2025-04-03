import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"

type Props = {
  title: string
}

export function SectionTitle({ title }: Props) {
  return (
    <View className="my-3">
      <Text className="text-muted-foreground">{title}</Text>
    </View>
  )
}
