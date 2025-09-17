import React, { useState } from 'react';
import { Map, Layers, Check, Eye, Info } from 'lucide-react';
import { BaseLayerType, getAvailableBaseLayers, layerRequiresApiKey } from '@/lib/mapLayers';

interface MapLayerSelectorProps {
  currentLayer: BaseLayerType;
  onLayerChange: (layer: BaseLayerType) => void;
  className?: string;
  showPreview?: boolean;
}

const MapLayerSelector: React.FC<MapLayerSelectorProps> = ({
  currentLayer,
  onLayerChange,
  className = '',
  showPreview = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewLayer, setPreviewLayer] = useState<string | null>(null);
  const availableLayers = getAvailableBaseLayers();
  const currentLayerData = availableLayers.find(layer => layer.id === currentLayer);

  const handleLayerSelect = (layerId: string) => {
    const layer = layerId as BaseLayerType;
    
    // Verificar si la capa requiere API key
    if (layerRequiresApiKey(layer)) {
      // Aquí podrías mostrar un modal para configurar la API key
      console.warn(`La capa ${layer} requiere una API key`);
      return;
    }
    
    onLayerChange(layer);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-3 flex items-center gap-2 transition-colors"
        title="Cambiar capa del mapa"
      >
        <Layers className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {currentLayerData?.name || 'Mapa'}
        </span>
        <div className={`w-2 h-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg viewBox="0 0 8 8" className="w-full h-full fill-gray-400">
            <path d="M0 2l4 4 4-4z" />
          </svg>
        </div>
      </button>

      {/* Panel desplegable */}
      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel de capas */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Map className="w-4 h-4" />
                Estilos de mapa
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Selecciona el estilo que prefieras para el mapa
              </p>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {availableLayers.map((layer) => {
                const isSelected = layer.id === currentLayer;
                const requiresKey = layerRequiresApiKey(layer.id as BaseLayerType);
                
                return (
                  <div
                    key={layer.id}
                    className={`relative group ${
                      isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <button
                      onClick={() => handleLayerSelect(layer.id)}
                      disabled={requiresKey}
                      className={`w-full p-3 text-left flex items-start gap-3 ${
                        requiresKey ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      {/* Preview de la capa */}
                      {showPreview && (
                        <div 
                          className="w-12 h-12 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden border"
                          onMouseEnter={() => setPreviewLayer(layer.id)}
                          onMouseLeave={() => setPreviewLayer(null)}
                        >
                          <img
                            src={layer.preview}
                            alt={`Preview de ${layer.name}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      {/* Información de la capa */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${
                            isSelected ? 'text-purple-900' : 'text-gray-900'
                          }`}>
                            {layer.name}
                          </h4>
                          {isSelected && (
                            <Check className="w-4 h-4 text-purple-600" />
                          )}
                          {requiresKey && (
                            <Info className="w-4 h-4 text-amber-500" title="Requiere API key" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {layer.description}
                        </p>
                        
                        {/* Información adicional */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>Zoom máx: {layer.maxZoom}</span>
                          {requiresKey && (
                            <span className="text-amber-600 font-medium">
                              API key requerida
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Botón de vista previa */}
                      {showPreview && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewLayer(previewLayer === layer.id ? null : layer.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                          title="Vista previa"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </button>
                    
                    {/* Indicador de capa activa */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600" />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Footer con información */}
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-600">
                <Info className="w-3 h-3 inline mr-1" />
                Algunas capas pueden requerir conexión a internet estable
              </p>
            </div>
          </div>
        </>
      )}
      
      {/* Preview modal */}
      {previewLayer && showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-4 max-w-md mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                Vista previa: {availableLayers.find(l => l.id === previewLayer)?.name}
              </h3>
              <button
                onClick={() => setPreviewLayer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <img
              src={availableLayers.find(l => l.id === previewLayer)?.preview}
              alt="Vista previa del mapa"
              className="w-full h-48 object-cover rounded-md"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  handleLayerSelect(previewLayer);
                  setPreviewLayer(null);
                }}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
              >
                Usar este estilo
              </button>
              <button
                onClick={() => setPreviewLayer(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLayerSelector;