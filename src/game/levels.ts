import type { LetterSet } from '../scoring/types'

export type Level = { id: string; name: string; emoji: string; words: string[] }

export const LEVELS: Level[] = [
  { id: 'vocales', name: 'Vocales', emoji: '🐣', words: ['A', 'E', 'I', 'O', 'U'] },
  {
    id: 'primeras-palabras',
    name: 'Primeras palabras',
    emoji: '🐥',
    words: ['OLA', 'ALA', 'UVA', 'OSO', 'AVE', 'NO'],
  },
  {
    id: 'palabras-de-casa',
    name: 'Palabras de casa',
    emoji: '🏠',
    words: ['MAMA', 'PAPA', 'CASA', 'LUNA', 'SOL', 'MESA'],
  },
  {
    id: 'animales',
    name: 'Animales',
    emoji: '🦙',
    words: ['GATO', 'PATO', 'VACA', 'LORO', 'PUMA', 'LLAMA'],
  },
  { id: 'mi-pais', name: 'Mi país', emoji: '🇵🇪', words: ['PERU', 'LIMA', 'PUNO', 'CUSCO'] },
]

export function missingLetters(level: Level, letters: LetterSet): string[] {
  return [...new Set(level.words.join('').split('').filter((letter) => !letters[letter]))].sort()
}

export function playableWords(level: Level, letters: LetterSet): string[] {
  return level.words.filter((word) =>
    word.split('').every((letter) => Boolean(letters[letter])),
  )
}
