import React, { useState } from "react";
import LeftSidebar from "./components/LeftSidebar";
import RightSidebar from "./components/RightSidebar";
import Canvas from "./components/Canvas";
import { defaultThemes } from "./data/themes";
import { Theme } from "./types";
import { useHistory } from "./hooks/useHistory";

export default function App() {
  const [themes] = useState<Theme[]>(defaultThemes);
  const [activeThemeId, setActiveThemeId] = useState<string>(themes[0].id);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  
  const {
    state: currentTheme,
    pushState: updateTheme,
    replaceState: replaceTheme,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory
  } = useHistory<Theme>(themes[0]);

  const handleThemeSelect = (id: string) => {
    setActiveThemeId(id);
    const theme = themes.find((t) => t.id === id);
    if (theme) {
      // When selecting a new theme, we reset the history to start fresh with that theme
      resetHistory(JSON.parse(JSON.stringify(theme)));
    }
  };

  const handleUpdateTheme = (updatedTheme: Theme, historyMode: 'push' | 'replace' = 'push') => {
    if (historyMode === 'replace') {
        replaceTheme(updatedTheme);
    } else {
        updateTheme(updatedTheme);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-white overflow-hidden font-sans">
      <LeftSidebar
        themes={themes}
        activeThemeId={activeThemeId}
        onSelectTheme={handleThemeSelect}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        <Canvas 
            theme={currentTheme} 
            onUpdateTheme={handleUpdateTheme}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
        />
      </main>

      <RightSidebar 
        theme={currentTheme} 
        onUpdateTheme={handleUpdateTheme} 
        selectedLayerId={selectedLayerId}
        onSelectLayer={setSelectedLayerId}
      />
    </div>
  );
}
