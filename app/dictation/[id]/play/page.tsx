'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function DictationPlayPage() {
  const params = useParams()
  const [iframeUrl, setIframeUrl] = useState('')

  useEffect(() => {
    const id = params.id as string
    const structureJsonUrl = `${window.location.origin}/api/dictation/${id}`
    const webplayerUrl = `https://staging-static.tinytap.it/media/webplayer/webplayer.html?structureJson=${encodeURIComponent(structureJsonUrl)}`
    setIframeUrl(webplayerUrl)
  }, [params.id])

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] ">
      {iframeUrl && (
        <iframe
          src={iframeUrl}
          className="w-full max-w-[1024px] h-[80vh] max-h-[768px]"
          style={{ border: 'none' }}
          allowFullScreen
        />
      )}
    </div>
  )
}