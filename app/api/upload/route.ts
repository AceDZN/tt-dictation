import { NextRequest, NextResponse } from 'next/server'
import { processTextFile, processImageFile } from '@/lib/fileProcessing'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { file, fileName, fileType, firstLanguage, secondLanguage } = body

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  try {
    let wordPairs

    if (fileType.startsWith('image/')) {
      const LLMResponse = await processImageFile(file, firstLanguage, secondLanguage)
      wordPairs = LLMResponse.wordPairs
    } else if (fileType === 'text/plain') {
      const text = atob(file.split(',')[1])
      wordPairs = await processTextFile(text, firstLanguage, secondLanguage)
    } else {
      throw new Error('Unsupported file type')
    }

    return NextResponse.json({ wordPairs })
  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'File processing failed' }, { status: 500 })
  }
}


export async function GET(req: NextRequest) {
    return NextResponse.json(
      { error: "Method not allowed" },
      {
        status: 405
      }
    );
  }