import { LLMResponse, WordPair } from '@/types'
import { extractWordPairsFromImage } from './visualLLM'

export async function processTextFile(text: string, firstLanguage: string, secondLanguage: string): Promise<WordPair[]> {
  const lines = text.split('\n')
  const wordPairs: WordPair[] = []

  for (const line of lines) {
    const [first, second] = line.split(',').map(word => word.trim())
    if (first && second) {
      wordPairs.push({ first, second })
    }
  }

  if (wordPairs.length === 0) {
    throw new Error('No valid word pairs found in the text file')
  }

  return wordPairs
}

export async function processImageFile(base64Image: string, firstLanguage: string, secondLanguage: string): Promise<LLMResponse> {
  // Remove the data URL prefix if present
  const base64Data = base64Image.split(',')[1] || base64Image;
  return extractWordPairsFromImage(base64Data, firstLanguage, secondLanguage)
}