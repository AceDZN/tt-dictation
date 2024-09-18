import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    // Read the JSON file
    const filePath = path.join(process.cwd(), 'example_data', 'dictation_structure.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    
    // Parse the JSON content
    const jsonData = JSON.parse(fileContents)

    // Create the response
    const response = NextResponse.json(jsonData, { status: 200 })

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', 'https://staging-static.tinytap.it')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response
  } catch (error) {
    console.error('Error reading example structure:', error)
    return NextResponse.json(
      { error: 'Failed to read example structure' },
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

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  )
}