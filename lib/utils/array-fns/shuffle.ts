export function shuffleArray<T>(array: T[]): T[] {
  const shuffledArray = [...array] // Create a new copy of the array
  let currentIndex = shuffledArray.length

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // Swap the current element with the random one
    const temp = shuffledArray[currentIndex]
    const rnd = shuffledArray[randomIndex]

    if (temp && rnd) {
      shuffledArray[currentIndex] = rnd
      shuffledArray[randomIndex] = temp
    }
  }

  return shuffledArray
}
