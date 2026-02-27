import React, { useRef, useState, useMemo } from "react";
import { Theme, Layer } from "../types";
import { Undo2, Redo2, RefreshCw, Download, Anchor } from "lucide-react";
import { toPng } from "html-to-image";
import { ensureLayerPath, generatePathString, movePath, rotatePath, distortPath } from "../utils/path";
import { hexToHSL, hslToHex } from "../utils/colors";
import LayerEditor from "./LayerEditor";

interface CanvasProps {
  theme: Theme;
  onUpdateTheme: (theme: Theme, historyMode?: 'push' | 'replace') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
}

const RenderLayer = React.memo(function RenderLayer({ layer, pathD, isSelected, showAnchors }: { layer: Layer; pathD: string; isSelected: boolean; showAnchors: boolean }) {
  return (
    <div
      className={`absolute inset-0 transition-all duration-500 ease-out`}
      style={{
        filter: `blur(${layer.blur}px)`,
        opacity: layer.opacity / 100,
        mixBlendMode: layer.blendMode as any,
        pointerEvents: "none",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        <defs>
          {layer.type === "gradient" ? (
            <linearGradient id={`grad-${layer.id}`} gradientTransform={`rotate(${layer.rotation + 45} 0.5 0.5)`}>
              <stop offset="0%" stopColor={layer.colors[0]} />
              <stop offset="100%" stopColor={layer.colors[1]} />
            </linearGradient>
          ) : null}
        </defs>
        <path
          d={pathD}
          fill={layer.type === "gradient" ? `url(#grad-${layer.id})` : layer.colors[0]}
          vectorEffect="non-scaling-stroke"
          style={{ pointerEvents: showAnchors ? "auto" : "none" }}
        />
      </svg>
    </div>
  );
});

export default function Canvas({ theme, onUpdateTheme, onUndo, onRedo, canUndo, canRedo, selectedLayerId, onSelectLayer }: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAnchors, setShowAnchors] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      
      // Target aspect ratio 16:9
      const targetRatio = 16 / 9;
      const containerRatio = clientWidth / clientHeight;

      let width, height;

      if (containerRatio > targetRatio) {
        // Container is wider than target
        height = clientHeight;
        width = height * targetRatio;
      } else {
        // Container is taller than target
        width = clientWidth;
        height = width / targetRatio;
      }

      setDimensions({ width, height });
    };

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    
    // Initial calculation
    updateDimensions();

    return () => observer.disconnect();
  }, []);

  // Ensure all layers have path data
  const processedLayers = useMemo<Layer[]>(() => {
    return theme.layers.map(ensureLayerPath);
  }, [theme.layers]);

  // Reset selection when theme changes
  React.useEffect(() => {
  }, [theme.id]);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    try {
      // Hide UI elements before export if needed
      const dataUrl = await toPng(canvasRef.current, { cacheBust: true });
      const link = document.createElement("a");
      link.download = `${theme.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  const handleLayerUpdate = (layerId: string, updates: Partial<Layer>, historyMode: 'push' | 'replace' = 'push') => {
    const newLayers = theme.layers.map((l) =>
      l.id === layerId ? { ...l, ...updates } : l
    );
    onUpdateTheme({ ...theme, layers: newLayers }, historyMode);
  };

  const handleRandomize = () => {
    // Randomize path positions and rotations with higher intensity
    // Also introduce subtle color shifts and opacity/blur variations
    const newLayers = processedLayers.map((layer, index) => {
      // 1. New Base Shape (Prevent infinite distortion degradation)
      // Reset to a basic shape based on randomized dimensions
      // This ensures we always start from a "clean" geometry before distorting
      // Larger shapes for better blending coverage
      const newWidth = Math.floor(Math.random() * 80) + 50; // 50% - 130%
      const newHeight = Math.floor(Math.random() * 80) + 50; // 50% - 130%
      const newLeft = Math.floor(Math.random() * 80) - 30; // -30% to 50%
      const newTop = Math.floor(Math.random() * 80) - 30; // -30% to 50%
      const newRotation = Math.floor(Math.random() * 360); // 0-360 full rotation

      // Create a temporary layer config to generate a fresh path
      const tempLayer = {
        ...layer,
        width: `${newWidth}%`,
        height: `${newHeight}%`,
        left: `${newLeft}%`,
        top: `${newTop}%`,
        rotation: 0, // Reset rotation for path generation, applied later via rotatePath or CSS
        path: undefined // Force regeneration
      };

      // Generate fresh path nodes
      let layerWithPath = ensureLayerPath(tempLayer);
      let newPath = layerWithPath.path!;

      // 2. Rotate the path nodes (actual geometry rotation)
      newPath = rotatePath(newPath, newRotation, 50, 50);

      // 3. Distort (Organic shape variation)
      // Apply moderate distortion to the fresh shape
      const distortionIntensity = Math.floor(Math.random() * 12) + 4; // 4 to 16
      newPath = distortPath(newPath, distortionIntensity);

      // 4. Color Variation: STRICTLY PRESERVED
      // We do NOT modify colors anymore to ensure the palette stays clean and true to the theme.
      // The user wants to see different compositions of the SAME colors, not different colors.
      const newColors = [...layer.colors];

      // 5. Opacity & Blur Variation (Enhanced Transparency)
      // Lower opacity to allow more blending between layers (avoid "solid" look)
      // High blur to create smooth, ethereal transitions
      const newOpacity = Math.floor(Math.random() * 40) + 40; // 40% - 80% (Lower cap to prevent covering other layers too much)
      const newBlur = Math.floor(Math.random() * 80) + 80; // 80px - 160px (Very high blur for "misty" look)

      return {
        ...layer,
        path: newPath,
        colors: newColors,
        rotation: newRotation,
        width: `${newWidth}%`,
        height: `${newHeight}%`,
        left: `${newLeft}%`,
        top: `${newTop}%`,
        opacity: newOpacity,
        blur: newBlur,
      };
    });
    
    onUpdateTheme({ 
        ...theme, 
        layers: newLayers,
        // Background color preserved or could be shifted too
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0A]">
      {/* Top Bar */}
      <div className="h-24 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="bg-[#1A1A1A] rounded-full pl-6 pr-2 py-2 flex items-center gap-6 border border-white/5 shadow-lg">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide leading-none">
                {theme.name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase leading-none">
                  Editing
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-white/5" />

            <div className="flex items-center gap-1 bg-black/40 rounded-full p-1">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-2 transition-all duration-200 rounded-full ${
                  canUndo
                    ? "text-gray-400 hover:text-white hover:bg-white/10 active:scale-95"
                    : "text-gray-700 cursor-not-allowed opacity-50"
                }`}
              >
                <Undo2 size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`p-2 transition-all duration-200 rounded-full ${
                  canRedo
                    ? "text-gray-400 hover:text-white hover:bg-white/10 active:scale-95"
                    : "text-gray-700 cursor-not-allowed opacity-50"
                }`}
              >
                <Redo2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRandomize}
            className="w-10 h-10 flex items-center justify-center bg-[#1A1A1A] text-white rounded-full border border-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={() => {
                setShowAnchors(!showAnchors);
                if (showAnchors) onSelectLayer(null);
            }}
            className={`px-5 h-10 flex items-center gap-2 rounded-full border border-white/5 transition-colors ${
                showAnchors ? "bg-white text-black hover:bg-gray-200" : "bg-[#1A1A1A] text-white hover:bg-white/10"
            }`}
          >
            <Anchor size={16} />
            <span className="text-sm font-medium">锚点视图</span>
          </button>

          <button
            onClick={handleExport}
            className="px-5 h-10 flex items-center gap-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
          >
            <Download size={16} />
            <span className="text-sm font-medium">导出图片</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 p-8 pt-0 overflow-hidden flex items-center justify-center w-full"
      >
        <div 
          className="relative shadow-2xl rounded-[32px] overflow-hidden transition-all duration-300 ease-out"
          style={{ 
            width: dimensions.width || '100%', 
            height: dimensions.height || '100%',
            opacity: dimensions.width ? 1 : 0
          }}
        >
          <div
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ backgroundColor: theme.backgroundColor }}
            onClick={(e) => {
                // Only clear selection if clicking directly on the canvas background
                // RenderLayer and LayerEditor have their own click handlers with stopPropagation
                if (e.target === e.currentTarget) {
                    onSelectLayer(null);
                }
            }}
          >
            {processedLayers
              .filter((l) => l.visible)
              .map((layer) => {
                const pathD = layer.path ? generatePathString(layer.path) : "";
                
                return (
                  <RenderLayer
                    key={layer.id}
                    layer={layer}
                    pathD={pathD}
                    isSelected={selectedLayerId === layer.id}
                    showAnchors={showAnchors}
                  />
                );
              })}

            {/* Noise Overlay */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                opacity: theme.noise / 100,
              }}
            />
            
            {/* Layer Editor */}
            {showAnchors && processedLayers
              .filter((l) => l.visible)
              .map((layer) => (
                <LayerEditor
                  key={`editor-${layer.id}`}
                  layer={layer}
                  canvasRef={canvasRef}
                  onUpdate={(updates, historyMode) => handleLayerUpdate(layer.id, updates, historyMode)}
                  onSelect={() => onSelectLayer(layer.id)}
                  isSelected={selectedLayerId === layer.id}
                />
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
