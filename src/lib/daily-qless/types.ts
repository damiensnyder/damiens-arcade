interface WordInGrid {
  word: string,
  starts: [number, number],
  down: boolean
}

interface Coordinate {
  x: number
  y: number
}

interface RollData {
  roll: string
  legalWords: string[]
}

interface QlessProps {
  date1: number
  roll1: string
  legalWords1: string[]
  date2: number
  roll2: string
  legalWords2: string[]
  roll3: string
  legalWords3: string[]
}

interface Badge {
  name: string
  icon: string
  description: string
}