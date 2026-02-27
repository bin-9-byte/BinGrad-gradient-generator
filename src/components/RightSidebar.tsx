import React from "react";
import { Theme, Layer, BlendMode } from "../types";
import {
  Eye,
  EyeOff,
  RefreshCw,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { clsx } from "clsx";

interface RightSidebarProps {
  theme: Theme;
  onUpdateTheme: (theme: Theme) => void;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
}

export default function RightSidebar({
  theme,
  onUpdateTheme,
  selectedLayerId,
  onSelectLayer
}: RightSidebarProps) {
  const handleUpdateNoise = (noise: number) => {
    onUpdateTheme({ ...theme, noise });
  };

  const handleUpdateBgColor = (backgroundColor: string) => {
    onUpdateTheme({ ...theme, backgroundColor });
  };

  const handleUpdateLayer = (layerId: string, updates: Partial<Layer>) => {
    const updatedLayers = theme.layers.map((layer) =>
      layer.id === layerId ? { ...layer, ...updates } : layer,
    );
    onUpdateTheme({ ...theme, layers: updatedLayers });
  };

  // Extract number from theme name (e.g., "Theme Name #1" -> "1")
  const themeNumber = theme.name.match(/#(\d+)$/)?.[1] || "";

  return (
    <div className="w-[340px] h-full bg-[#141414] border-l border-white/5 flex flex-col overflow-y-auto">
      {/* Preview Card */}
      <div className="p-6 pb-4">
        <div
          className="w-full aspect-[3/4] rounded-2xl relative overflow-hidden shadow-2xl mb-4"
          style={{ backgroundColor: theme.backgroundColor }}
        >
          {theme.layers
            .filter((l) => l.visible)
            .map((layer) => (
              <div
                key={layer.id}
                className="absolute pointer-events-none"
                style={{
                  width: layer.width,
                  height: layer.height,
                  top: layer.top,
                  left: layer.left,
                  transform: `rotate(${layer.rotation}deg)`,
                  borderRadius: layer.borderRadius,
                  background:
                    layer.type === "gradient"
                      ? `linear-gradient(135deg, ${layer.colors[0]}, ${layer.colors[1]})`
                      : layer.colors[0],
                  filter: `blur(${layer.blur / 2}px)`, // Scale down blur for preview
                  opacity: layer.opacity / 100,
                  mixBlendMode: layer.blendMode as any,
                }}
              />
            ))}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              opacity: theme.noise / 100,
            }}
          />
          <div className="absolute top-6 left-6 z-10 backdrop-blur-xl bg-black/30 border border-white/20 rounded-2xl px-5 py-4 shadow-lg">
            <h2 className="text-3xl font-black tracking-tighter text-white">
              Gradient
            </h2>
            <p className="text-[10px] font-bold text-white/90 mt-1 uppercase tracking-[0.25em]">
              Inspire Creativity
            </p>
          </div>
          <div className="absolute bottom-6 left-6 z-10 backdrop-blur-xl bg-black/30 border border-white/20 rounded-xl px-4 py-2 shadow-lg">
            <span className="text-4xl font-black text-white leading-none">#{themeNumber}</span>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-8 pb-8">
        {/* Atmosphere Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 tracking-wider uppercase">
            <SlidersHorizontal size={14} />
            环境设置 / Atmosphere
          </div>

          <div className="bg-[#1A1A1A] rounded-xl p-4 flex items-center gap-4 border border-white/5">
            <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden relative">
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={(e) => handleUpdateBgColor(e.target.value)}
                className="absolute inset-[-10px] w-[60px] h-[60px] cursor-pointer"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-300">背景颜色</div>
              <div className="text-xs text-gray-500 font-mono mt-0.5 uppercase">
                {theme.backgroundColor}
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-300">
                噪点强度
              </span>
              <span className="text-xs font-mono text-gray-500">
                {theme.noise}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={theme.noise}
              onChange={(e) => handleUpdateNoise(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>

        {/* Layers List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 tracking-wider uppercase">
            <Layers size={14} />
            图层列表 / Layers
          </div>

          <div className="space-y-3">
            {theme.layers.map((layer) => (
              <LayerPanel
                key={layer.id}
                layer={layer}
                onUpdate={(updates) => handleUpdateLayer(layer.id, updates)}
                isSelected={selectedLayerId === layer.id}
                onSelect={() => onSelectLayer(layer.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LayerPanel({
  layer,
  onUpdate,
  isSelected,
  onSelect,
}: {
  key?: React.Key;
  layer: Layer;
  onUpdate: (updates: Partial<Layer>) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div 
        className={`rounded-xl border overflow-hidden transition-all duration-200 ${
            isSelected 
            ? "bg-[#252525] border-blue-500/50 ring-1 ring-blue-500/50" 
            : "bg-[#1A1A1A] border-white/5 hover:border-white/10"
        }`}
        onClick={onSelect}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full shadow-sm"
            style={{
              background:
                layer.type === "gradient"
                  ? `linear-gradient(135deg, ${layer.colors[0]}, ${layer.colors[1]})`
                  : layer.colors[0],
            }}
          />
          <span className="text-sm font-medium text-gray-200">
            {layer.name}
          </span>
        </div>
        <button
          onClick={() => onUpdate({ visible: !layer.visible })}
          className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
        >
          {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      {/* Body */}
      {layer.visible && (
        <div className="p-4 space-y-5">
          {/* Type Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">渐变与融合</span>
            <div className="flex bg-black/40 rounded-lg p-1">
              <button
                onClick={() => onUpdate({ type: "single" })}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  layer.type === "single"
                    ? "bg-[#3B82F6] text-white"
                    : "text-gray-500 hover:text-gray-300",
                )}
              >
                单色
              </button>
              <button
                onClick={() => onUpdate({ type: "gradient" })}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  layer.type === "gradient"
                    ? "bg-[#3B82F6] text-white"
                    : "text-gray-500 hover:text-gray-300",
                )}
              >
                渐变
              </button>
            </div>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-8 rounded-lg border border-white/10 overflow-hidden relative">
              <input
                type="color"
                value={layer.colors[0]}
                onChange={(e) => {
                  const newColors = [...layer.colors];
                  newColors[0] = e.target.value;
                  onUpdate({ colors: newColors });
                }}
                className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer"
              />
            </div>
            {layer.type === "gradient" && (
              <>
                <span className="text-gray-600 text-xs">→</span>
                <div className="flex-1 h-8 rounded-lg border border-white/10 overflow-hidden relative">
                  <input
                    type="color"
                    value={layer.colors[1] || "#ffffff"}
                    onChange={(e) => {
                      const newColors = [...layer.colors];
                      newColors[1] = e.target.value;
                      onUpdate({ colors: newColors });
                    }}
                    className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">模糊</span>
                <span className="text-xs font-mono text-gray-500">
                  {layer.blur}PX
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={layer.blur}
                onChange={(e) => onUpdate({ blur: parseInt(e.target.value) })}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">透明度</span>
                <span className="text-xs font-mono text-gray-500">
                  {layer.opacity}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={layer.opacity}
                onChange={(e) =>
                  onUpdate({ opacity: parseInt(e.target.value) })
                }
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>

          {/* Blend Mode */}
          <div className="pt-2 border-t border-white/5">
            <select
              value={layer.blendMode}
              onChange={(e) =>
                onUpdate({ blendMode: e.target.value as BlendMode })
              }
              className="w-full bg-transparent text-sm text-gray-300 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="normal">正常 (Normal)</option>
              <option value="multiply">正片叠底 (Multiply)</option>
              <option value="screen">滤色 (Screen)</option>
              <option value="overlay">叠加 (Overlay)</option>
              <option value="plus-lighter">线性减淡 (Plus Lighter)</option>
              <option value="color-dodge">颜色减淡 (Color Dodge)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
