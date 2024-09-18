export interface WordPair {
  first: string
  second: string
  sentence?: string
  imagePrompt?: string
}


export interface LLMResponse {
    wordPairs: WordPair[]
}