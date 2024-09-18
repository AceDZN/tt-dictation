import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const filePath = path.join(process.cwd(), 'dictations', `dictation_${id}.json`)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Dictation not found' }, { status: 404 })
    }

    const fileContents = fs.readFileSync(filePath, 'utf8')
    const jsonData = JSON.parse(fileContents)

    const response = NextResponse.json(jsonData, { status: 200 })

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', 'https://staging-static.tinytap.it')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response
  } catch (error) {
    console.error('Error reading dictation:', error)
    return NextResponse.json(
      { error: 'Failed to read dictation' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  
  response.headers.set('Access-Control-Allow-Origin', 'https://staging-static.tinytap.it')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  return response
}