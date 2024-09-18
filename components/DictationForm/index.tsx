'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { generateTitle } from '@/lib/openai'

interface WordPair {
  first: string
  second: string
}

const languages = [
  'English',
  'Mandarin Chinese',
  'Hindi',
  'Spanish',
  'French',
  'Arabic',
  'Bengali',
  'Russian',
  'Portuguese',
  'Indonesian',
  'Hebrew'
]

export function DictationForm() {
  const [title, setTitle] = useState('')
  const [firstLanguage, setFirstLanguage] = useState('Hebrew')
  const [secondLanguage, setSecondLanguage] = useState('English')
  const [wordPairs, setWordPairs] = useState<WordPair[]>([
    { first: '', second: '' },
    { first: '', second: '' },
    { first: '', second: '' },
    { first: '', second: '' },
    { first: '', second: '' },
  ])
  const [inputMethod, setInputMethod] = useState<'manual' | 'file'>('manual')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddWordPair = () => {
    setWordPairs([...wordPairs, { first: '', second: '' }])
  }

  const handleRemoveWordPair = (index: number) => {
    setWordPairs(wordPairs.filter((_, i) => i !== index))
  }

  const handleWordPairChange = (index: number, language: 'first' | 'second', value: string) => {
    const newWordPairs = [...wordPairs]
    newWordPairs[index][language] = value
    setWordPairs(newWordPairs)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let finalTitle = title

    if (!title.trim()) {
      try {
        const generatedTitle = await generateTitle(wordPairs, firstLanguage, secondLanguage)
        finalTitle = generatedTitle
        setTitle(generatedTitle)
        toast.success('Title generated successfully')
      } catch (error) {
        console.error('Error generating title:', error)
        toast.error('Failed to generate title')
        return
      }
    }

    // TODO: Implement form submission logic
    console.log({ title: finalTitle, firstLanguage, secondLanguage, wordPairs, inputMethod })
  }

  const isSubmitDisabled = wordPairs.every(pair => !pair.first && !pair.second)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleFileUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const base64 = await fileToBase64(file)
      const fileType = file.type
      const response = await fetch('/api/upload', {  // Changed to test route
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
          fileType: fileType,
          firstLanguage,
          secondLanguage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      console.log({data})
      if (Array.isArray(data.wordPairs) && data.wordPairs.length > 0) {
        setWordPairs(data.wordPairs)
        setInputMethod('manual')
        toast.success('File processed successfully')
      } else {
        throw new Error('No valid word pairs found in the image')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
      toast.error('Failed to process file')
    } finally {
      setIsUploading(false)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Add this function to the component
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="flex space-x-4">
        <Select value={firstLanguage} onValueChange={setFirstLanguage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select first language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={secondLanguage} onValueChange={setSecondLanguage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select second language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex space-x-4">
        <Button
          type="button"
          variant={inputMethod === 'manual' ? 'default' : 'outline'}
          onClick={() => setInputMethod('manual')}
        >
          Manual Input
        </Button>
        <Button
          type="button"
          variant={inputMethod === 'file' ? 'default' : 'outline'}
          onClick={() => setInputMethod('file')}
        >
          File Upload
        </Button>
      </div>

      {inputMethod === 'manual' && (
        <div className="space-y-4">
          {wordPairs.map((pair, index) => (
            <div key={index} className="flex space-x-2">
              <Input
                type="text"
                placeholder={`${firstLanguage} word`}
                value={pair.first}
                onChange={(e) => handleWordPairChange(index, 'first', e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder={`${secondLanguage} word`}
                value={pair.second}
                onChange={(e) => handleWordPairChange(index, 'second', e.target.value)}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemoveWordPair(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleAddWordPair}>
            + Add new word pair
          </Button>
        </div>
      )}

      {inputMethod === 'file' && (
        <div className="space-y-4">
          <Input
            type="file"
            accept=".txt,.pdf,.doc,.docx,image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          <Button
            type="button"
            onClick={handleFileUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
            <Upload className="ml-2 h-4 w-4" />
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}

      <Button type="submit" disabled={isSubmitDisabled}>
        Create Dictation
      </Button>
    </form>
  )
}