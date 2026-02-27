import React, { useEffect, useState, useRef } from "react";
import { Layer } from "../types";
import { parseBorderRadius, stringifyBorderRadius } from "../utils/borderRadius";

export interface LayerEditorProps {
  layer: Layer;
  canvasRef: React.RefObject<HTMLDivElement>;
  onUpdate: (updates: Partial<Layer>, historyMode?: 'push' | 'replace') => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

type DragMode = "move" | "resize" | "rotate" | "radius" | "anchor" | "handle-in" | "handle-out";
type Handle = "tl" | "tr" | "bl" | "br" | "top" | "radius-tl" | "radius-tr" | "radius-bl" | "radius-br";

const LayerEditor: React.FC<LayerEditorProps> = ({ layer, canvasRef, onUpdate, onSelect, isSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    layer: Layer;
    mode: DragMode;
    handle?: Handle;
    nodeId?: string;
    centerX?: number;
    centerY?: number;
  } | null>(null);
  
  // Track if we have pushed the initial state to history for the current drag session
  const hasPushedHistoryRef = useRef(false);

  // Clear active node when layer is deselected
  useEffect(() => {
    if (!isSelected) {
        setActiveNodeId(null);
    }
  }, [isSelected]);

  // Clear active node when clicking outside (handled by canvas click, but we can also handle here if needed)
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
        // If click was not on an anchor or handle, clear active node
        // We rely on stopPropagation in handleMouseDown below to prevent this from firing when clicking an element
        setActiveNodeId(null);
    };
    
    // Only attach if we have an active node to clear
    if (activeNodeId) {
        window.addEventListener('mousedown', handleGlobalClick);
    }
    return () => {
        window.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [activeNodeId]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current || !canvasRef.current) return;

      const { x: startX, y: startY, layer: initialLayer, mode, handle, nodeId, centerX, centerY } = dragStartRef.current;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      // Calculate delta in pixels
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Convert pixel delta to percentage
      const dxPercent = (dx / canvasRect.width) * 100;
      const dyPercent = (dy / canvasRect.height) * 100;

      // Determine history mode: push on first move, replace on subsequent moves
      let historyMode: 'push' | 'replace' = 'replace';
      if (!hasPushedHistoryRef.current) {
          historyMode = 'push';
          hasPushedHistoryRef.current = true;
      }

      if (mode === "anchor" && nodeId && initialLayer.path) {
        const newPath = initialLayer.path.map(n => {
            if (n.id !== nodeId) return n;
            return {
                ...n,
                x: n.x + dxPercent,
                y: n.y + dyPercent,
                handleIn: { ...n.handleIn, x: n.handleIn.x + dxPercent, y: n.handleIn.y + dyPercent },
                handleOut: { ...n.handleOut, x: n.handleOut.x + dxPercent, y: n.handleOut.y + dyPercent },
            };
        });
        onUpdate({ path: newPath }, historyMode);
      } else if (mode === "handle-in" && nodeId && initialLayer.path) {
        const newPath = initialLayer.path.map(n => {
            if (n.id !== nodeId) return n;
            return {
                ...n,
                handleIn: { ...n.handleIn, x: n.handleIn.x + dxPercent, y: n.handleIn.y + dyPercent }
            };
        });
        onUpdate({ path: newPath }, historyMode);
      } else if (mode === "handle-out" && nodeId && initialLayer.path) {
        const newPath = initialLayer.path.map(n => {
            if (n.id !== nodeId) return n;
            return {
                ...n,
                handleOut: { ...n.handleOut, x: n.handleOut.x + dxPercent, y: n.handleOut.y + dyPercent }
            };
        });
        onUpdate({ path: newPath }, historyMode);
      } else if (mode === "move") {
        onUpdate({
          left: `${parseFloat(initialLayer.left) + dxPercent}%`,
          top: `${parseFloat(initialLayer.top) + dyPercent}%`,
        }, historyMode);
      } else if (mode === "resize" && handle) {
        let newWidth = parseFloat(initialLayer.width);
        let newHeight = parseFloat(initialLayer.height);
        let newLeft = parseFloat(initialLayer.left);
        let newTop = parseFloat(initialLayer.top);

        if (handle.includes("l")) {
          newWidth -= dxPercent;
          newLeft += dxPercent;
        }
        if (handle.includes("r")) {
          newWidth += dxPercent;
        }
        if (handle.includes("t")) {
          newHeight -= dyPercent;
          newTop += dyPercent;
        }
        if (handle.includes("b")) {
          newHeight += dyPercent;
        }

        onUpdate({
          width: `${newWidth}%`,
          height: `${newHeight}%`,
          left: `${newLeft}%`,
          top: `${newTop}%`,
        }, historyMode);
      } else if (mode === "rotate" && centerX !== undefined && centerY !== undefined) {
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
        const rotationDelta = currentAngle - startAngle;
        
        onUpdate({
          rotation: Math.round(initialLayer.rotation + rotationDelta),
        }, historyMode);
      } else if (mode === "radius" && handle) {
        const rad = (initialLayer.rotation * Math.PI) / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        
        const localDx = dx * cos - dy * sin;
        const localDy = dx * sin + dy * cos;

        const layerWidthPx = (parseFloat(initialLayer.width) / 100) * canvasRect.width;
        const layerHeightPx = (parseFloat(initialLayer.height) / 100) * canvasRect.height;
        
        const dRx = (localDx / layerWidthPx) * 100;
        const dRy = (localDy / layerHeightPx) * 100;

        const radiusObj = parseBorderRadius(initialLayer.borderRadius);
        const corner = handle.replace("radius-", "") as "tl" | "tr" | "bl" | "br";
        
        let signX = 1;
        let signY = 1;
        
        if (corner === "tl") { signX = 1; signY = 1; }
        if (corner === "tr") { signX = -1; signY = 1; }
        if (corner === "bl") { signX = 1; signY = -1; }
        if (corner === "br") { signX = -1; signY = -1; }

        radiusObj[corner].x = Math.max(0, Math.min(100, radiusObj[corner].x + dRx * signX));
        radiusObj[corner].y = Math.max(0, Math.min(100, radiusObj[corner].y + dRy * signY));

        onUpdate({
          borderRadius: stringifyBorderRadius(radiusObj),
        }, historyMode);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, canvasRef, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent, mode: DragMode, handle?: Handle, nodeId?: string) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation(); // More aggressive stop
    e.preventDefault(); // Prevent text selection
    
    // Reset history push flag for new drag session
    hasPushedHistoryRef.current = false;
    
    // Notify parent about selection only if not already selected
    if (onSelect && !isSelected) {
        onSelect();
    }

    // Set active node if clicking an anchor or handle
    if (nodeId) {
        setActiveNodeId(nodeId);
    } else {
        // If clicking the box editor (move/rotate/resize), clear active node
        setActiveNodeId(null);
    }

    if (!canvasRef.current) return;

    // Use push history mode for drag start to save state before modification
    // We'll update continuously with replace during drag (handled by onUpdate default)
    // But we need to make sure the INITIAL state is saved.
    // However, onUpdate is called by parent, and we don't have direct access to history push here.
    // The parent (Canvas) defaults to 'replace' now. 
    // We should probably trigger a 'push' on mouse up? Or ensure the first move triggers a push?
    
    // Actually, the best way is:
    // 1. Mouse Down: Do nothing to history yet (or push current state?)
    // 2. Mouse Move: Update state with replace (so we don't flood history)
    // 3. Mouse Up: Push the FINAL state to history? 
    //    OR: Push the state BEFORE drag starts, then replace during drag.
    
    // Current implementation in Canvas.tsx:
    // handleLayerUpdate defaults to 'replace'.
    // We need to signal 'push' at some point.
    
    // Let's modify onUpdate signature in LayerEditor to accept historyMode?
    // No, onUpdate is (updates: Partial<Layer>) => void.
    
    // We can't easily change the prop signature without changing Canvas.tsx too.
    // BUT, we can use a trick:
    // The standard way for drag operations is:
    // - On Drag Start: Save current state (Push)
    // - On Drag Move: Update state (Replace)
    // - On Drag End: (Optional, usually nothing if we pushed at start)
    
    // Wait, if we push at start, then the 'undo' will go back to the state BEFORE drag.
    // The 'present' will be the state at start of drag.
    // Then we replace 'present' as we drag.
    // So if we undo, we go back to 'past', which is state before drag.
    // This seems correct.
    
    // So we need to trigger a push on Mouse Down.
    // But we can't via onUpdate({}). 
    
    // Let's cheat: call onUpdate with no changes but force push?
    // The current onUpdate implementation in Canvas takes (layerId, updates, historyMode).
    // But LayerEditor's onUpdate prop is (updates) => handleLayerUpdate(layer.id, updates).
    // It doesn't expose historyMode.
    
    // We need to update Canvas.tsx to pass a more flexible onUpdate or a separate onHistoryPush.
    // OR, we just revert Canvas.tsx default to 'push', and use 'replace' explicitly during drag.
    
    // Let's try: 
    // 1. Revert Canvas.tsx default to 'push'.
    // 2. In LayerEditor, explicitly call onUpdate with Replace during mouse move.
    // 3. In LayerEditor, call onUpdate with Push (or default) on mouse up? 
    //    Actually if we replace during drag, the final state is just a replacement.
    //    We need a push somewhere.
    
    // Correct logic:
    // - State A (Initial)
    // - Drag Start -> Push State A to history. Current is still A.
    // - Drag Move -> Replace Current with B, C, D...
    // - Drag End -> Current is Z. History has A. Undo goes to A.
    
    // So we need to PUSH when drag starts.
    // And REPLACE when drag moves.
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // For box rotation only
    let centerX, centerY;
    if (mode === "rotate" || mode === "move" || mode === "resize") {
        const layerLeftPx = (parseFloat(layer.left) / 100) * canvasRect.width;
        const layerTopPx = (parseFloat(layer.top) / 100) * canvasRect.height;
        const layerWidthPx = (parseFloat(layer.width) / 100) * canvasRect.width;
        const layerHeightPx = (parseFloat(layer.height) / 100) * canvasRect.height;
        
        centerX = canvasRect.left + layerLeftPx + layerWidthPx / 2;
        centerY = canvasRect.top + layerTopPx + layerHeightPx / 2;
    }

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      layer: { ...layer },
      mode,
      handle,
      nodeId,
      centerX,
      centerY,
    };
  };

  // 1. Path Editor Mode
  if (layer.path && layer.path.length > 0) {
      // Generate path string for outline
      let pathD = `M ${layer.path[0].x} ${layer.path[0].y}`;
      for (let i = 0; i < layer.path.length; i++) {
        const curr = layer.path[i];
        const next = layer.path[(i + 1) % layer.path.length];
        pathD += ` C ${curr.handleOut.x} ${curr.handleOut.y}, ${next.handleIn.x} ${next.handleIn.y}, ${next.x} ${next.y}`;
      }
      pathD += " Z";

      // Check if this layer has an active node being edited
      const hasActiveNode = activeNodeId && layer.path.some(n => n.id === activeNodeId);
      
      // Determine visibility based on selection, active node, or hover group
      const showOutline = isSelected || hasActiveNode;

      return (
        <div className={`absolute inset-0 pointer-events-none z-50 group ${hasActiveNode ? 'active-layer' : ''}`}>
           <svg
             className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
             viewBox="0 0 100 100"
             preserveAspectRatio="none"
           >
               {/* Hover/Active Outline */}
               <path
                 d={pathD}
                 fill="none"
                 stroke="white"
                 strokeWidth="1.5"
                 strokeDasharray="4 4"
                 className={`transition-opacity duration-300 ${showOutline ? 'opacity-40' : 'opacity-0 group-hover:opacity-40'}`}
                 vectorEffect="non-scaling-stroke"
               />
               
               {/* Handles Lines - Visible on hover OR if this node is active OR if layer is selected */}
               <g className={`transition-opacity duration-300 ${showOutline ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                   {layer.path.map((node) => (
                       <React.Fragment key={node.id}>
                           {/* Only show handle lines for the active node, or all on hover/selection */}
                           <line 
                            x1={node.x} y1={node.y} 
                            x2={node.handleIn.x} y2={node.handleIn.y} 
                            stroke="rgba(255,255,255,0.4)" strokeWidth="1" 
                            vectorEffect="non-scaling-stroke"
                            className={activeNodeId && activeNodeId !== node.id ? 'opacity-0 group-hover:opacity-100' : ''}
                           />
                           <line 
                            x1={node.x} y1={node.y} 
                            x2={node.handleOut.x} y2={node.handleOut.y} 
                            stroke="rgba(255,255,255,0.4)" strokeWidth="1" 
                            vectorEffect="non-scaling-stroke"
                            className={activeNodeId && activeNodeId !== node.id ? 'opacity-0 group-hover:opacity-100' : ''}
                           />
                       </React.Fragment>
                   ))}
               </g>
           </svg>

           {layer.path.map((node) => {
               const isActive = activeNodeId === node.id;
               return (
               <React.Fragment key={node.id}>
                   {/* Handle In */}
                   <div
                      className={`absolute w-2 h-2 bg-blue-400 rounded-full border border-white z-50 pointer-events-auto cursor-crosshair hover:scale-125 transition-transform ${isActive || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      style={{ left: `${node.handleIn.x}%`, top: `${node.handleIn.y}%`, transform: 'translate(-50%, -50%)' }}
                      onMouseDown={(e) => handleMouseDown(e, "handle-in", undefined, node.id)}
                   />
                   {/* Handle Out */}
                   <div
                      className={`absolute w-2 h-2 bg-blue-400 rounded-full border border-white z-50 pointer-events-auto cursor-crosshair hover:scale-125 transition-transform ${isActive || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      style={{ left: `${node.handleOut.x}%`, top: `${node.handleOut.y}%`, transform: 'translate(-50%, -50%)' }}
                      onMouseDown={(e) => handleMouseDown(e, "handle-out", undefined, node.id)}
                   />
                   {/* Anchor Point */}
                   <div
                      className={`absolute w-3 h-3 bg-white rounded-full border-2 border-blue-600 z-50 pointer-events-auto cursor-move hover:scale-125 transition-transform shadow-sm ${isActive ? 'scale-125 ring-2 ring-blue-400' : ''}`}
                      style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
                      onMouseDown={(e) => handleMouseDown(e, "anchor", undefined, node.id)}
                   />
               </React.Fragment>
           )})}
        </div>
      );
  }

  // 2. Fallback Box Editor (for layers without path, if any)
  const parsedRadius = parseBorderRadius(layer.borderRadius);

  return (
    <div
      className="absolute border-2 border-white pointer-events-auto z-50"
      style={{
        width: layer.width,
        height: layer.height,
        top: layer.top,
        left: layer.left,
        transform: `rotate(${layer.rotation}deg)`,
        borderRadius: layer.borderRadius,
        cursor: isDragging && dragStartRef.current?.mode === "move" ? "grabbing" : "grab",
      }}
      onMouseDown={(e) => handleMouseDown(e, "move", undefined)}
    >
      {/* Rotation Handle */}
      <div
        className="absolute -top-8 left-1/2 w-0.5 h-8 bg-white -translate-x-1/2 flex flex-col items-center justify-start pointer-events-auto"
      >
        <div 
            className="w-3 h-3 bg-white rounded-full cursor-grab hover:scale-125 transition-transform"
            onMouseDown={(e) => handleMouseDown(e, "rotate", undefined)}
        />
      </div>

      {/* Resize Handles */}
      {["tl", "tr", "bl", "br"].map((h) => (
        <div
          key={h}
          className={`absolute w-3 h-3 bg-white border border-black cursor-${h === "tl" || h === "br" ? "nwse" : "nesw"}-resize z-20`}
          style={{
            top: h.includes("t") ? -4 : "auto",
            bottom: h.includes("b") ? -4 : "auto",
            left: h.includes("l") ? -4 : "auto",
            right: h.includes("r") ? -4 : "auto",
          }}
          onMouseDown={(e) => handleMouseDown(e, "resize", h as Handle)}
        />
      ))}

      {/* Radius Control Handles */}
      {(["tl", "tr", "bl", "br"] as const).map((corner) => {
        const r = parsedRadius[corner];
        const style: React.CSSProperties = {
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#ffff00",
            border: "1px solid black",
            cursor: "crosshair",
            zIndex: 10,
        };

        if (corner === "tl") {
            style.left = `${r.x}%`;
            style.top = `${r.y}%`;
        } else if (corner === "tr") {
            style.right = `${r.x}%`;
            style.top = `${r.y}%`;
        } else if (corner === "bl") {
            style.left = `${r.x}%`;
            style.bottom = `${r.y}%`;
        } else if (corner === "br") {
            style.right = `${r.x}%`;
            style.bottom = `${r.y}%`;
        }

        return (
            <div
                key={`radius-${corner}`}
                style={style}
                onMouseDown={(e) => handleMouseDown(e, "radius", `radius-${corner}` as Handle)}
                title={`Radius: ${Math.round(r.x)}% ${Math.round(r.y)}%`}
            />
        );
      })}
    </div>
  );
};

export default LayerEditor;
