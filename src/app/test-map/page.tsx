'use client'

import { Suspense } from 'react'
import MapComponent from '@/components/MapComponent';

export default function TestMapPage() {
  console.log('🧪 Página de prueba del mapa cargada')
  
  return (
    <div className="w-full h-screen bg-black">
      <div className="p-4">
        <h1 className="text-white text-2xl mb-4">Prueba del Mapa</h1>
        <p className="text-white mb-4">Esta es una página de prueba para verificar el renderizado del mapa.</p>
      </div>
      <div className="w-full h-full">
        <Suspense fallback={
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-lg">Cargando mapa...</p>
            </div>
          </div>
        }>
          <MapComponent 
            searchFilters={{
              specialty: undefined,
              rating: 4.0,
              radius: 10
            }}
            onStudioSelect={(studio) => {
              console.log('🏪 Studio seleccionado en prueba:', studio);
            }}
          />
        </Suspense>
      </div>
    </div>
  )
}