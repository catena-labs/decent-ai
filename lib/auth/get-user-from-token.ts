import { jwtDecode } from "jwt-decode"

import { type User } from "./types"
import { emptyStringToUndefined } from "../utils/string-fns/empty-string-to-undefined"

type TokenPayload = {
  sub: string
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function getUserFromToken(token?: string | null): User | null {
  if (!token) {
    return null
  }

  try {
    const decodedToken = jwtDecode<TokenPayload>(token)
    const user = decodedToken.user ?? {}

    return {
      id: decodedToken.sub,
      name: emptyStringToUndefined(user.name) ?? user.email ?? "You",
      email: user.email ?? null,
      image: user.image ?? null
    }
  } catch (e) {
    return null
  }
}
