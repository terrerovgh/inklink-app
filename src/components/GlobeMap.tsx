'use client'

import dynamic from 'next/dynamic'
import { ComponentProps } from 'react'

// Dynamic import to avoid SSR issues with MapLibre GL JS
const GlobeMapComponent = dynamic(
  () => import('./GlobeMapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="text-black dark:text-white">Cargando globo interactivo...</p>
        </div>
      </div>
    )
  }
)

type GlobeMapProps = ComponentProps<typeof GlobeMapComponent>

const GlobeMap: React.FC<GlobeMapProps> = (props) => {
  return <GlobeMapComponent {...props} />
}

export default GlobeMap