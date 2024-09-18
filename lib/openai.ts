import { WordPair } from '@/types'

export async function generateTitle(wordPairs: WordPair[], firstLanguage: string, secondLanguage: string): Promise<string> {
  const wordPairsText = wordPairs
    .filter(pair => pair.first && pair.second)
    .map(pair => `${pair.first} - ${pair.second}`)
    .join(', ')

  try {
    const response = await fetch('/api/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ wordPairsText, firstLanguage, secondLanguage }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate title');
    }

    const data = await response.json();
    return data.title || 'Dictation Game';
  } catch (error) {
    console.error('Error generating title:', error);
    throw new Error('Failed to generate title');
  }
}