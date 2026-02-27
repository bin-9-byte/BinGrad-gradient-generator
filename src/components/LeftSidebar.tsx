import React, { useState } from "react";
import { Theme } from "../types";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "motion/react";

interface LeftSidebarProps {
  themes: Theme[];
  activeThemeId: string;
  onSelectTheme: (id: string) => void;
}

export default function LeftSidebar({
  themes,
  activeThemeId,
  onSelectTheme,
}: LeftSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Group themes by category
  const groupedThemes = themes.reduce(
    (acc, theme) => {
      if (!acc[theme.category]) {
        acc[theme.category] = [];
      }
      acc[theme.category].push(theme);
      return acc;
    },
    {} as Record<string, Theme[]>,
  );

  return (
    <motion.div
      initial={{ width: 280 }}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full bg-[#141414] border-r border-white/5 flex flex-col overflow-hidden relative"
    >
      <div 
        className={clsx("p-6 flex items-center h-24", collapsed ? "justify-center" : "justify-between")}
      >
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="text-4xl font-black tracking-tight text-white whitespace-nowrap bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
            >
              BinGrad
            </motion.h1>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white shrink-0 z-10"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs font-medium text-gray-500 tracking-wider mb-4 uppercase px-2 pt-2 whitespace-nowrap overflow-hidden"
            >
              风格库 / Library
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {Object.entries(groupedThemes).map(([category, categoryThemes]) => (
            <div 
              key={category} 
              className={clsx(
                "transition-all duration-300 ease-in-out", 
                !collapsed ? "bg-[#1C1C1E] rounded-[20px] p-2" : "bg-transparent rounded-none p-0 space-y-2"
              )}
            >
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between text-sm font-medium text-gray-400 px-3 py-2 mb-1 cursor-pointer hover:text-gray-300 whitespace-nowrap overflow-hidden select-none"
                  >
                    <span>{category}</span>
                    <motion.div
                      animate={{ rotate: collapsedCategories[category] ? -90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={14} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence initial={false}>
                {(!collapsedCategories[category] || collapsed) && (
                  <motion.div
                    initial={false}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className={clsx("overflow-hidden flex flex-col", collapsed ? "items-center gap-3" : "space-y-1")}
                  >
                    {categoryThemes.map((theme) => (
                      <div
                        key={theme.id}
                        className={clsx(
                          "transition-all duration-300 ease-in-out w-full flex items-center",
                          collapsed ? "justify-center" : "justify-start"
                        )}
                      >
                      <motion.button
                        layout="position"
                        onClick={() => onSelectTheme(theme.id)}
                        title={collapsed ? theme.name : undefined}
                        className={clsx(
                          "flex items-center transition-all duration-200 group relative",
                          collapsed 
                            ? "justify-center w-10 h-10 rounded-full hover:bg-white/10" 
                            : "w-full gap-4 px-3 py-3 text-sm text-left rounded-xl",
                          !collapsed && activeThemeId === theme.id
                            ? "bg-white/10 text-white"
                            : !collapsed && "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        )}
                      >
                        <motion.div
                          layout="position"
                          className={clsx(
                            "rounded-full flex-shrink-0 transition-all duration-300",
                            collapsed ? "w-full h-full" : "w-10 h-10"
                          )}
                          whileHover={collapsed ? { scale: 1.1 } : {}}
                          style={{
                            background:
                              theme.previewColors.length > 1
                                ? `linear-gradient(135deg, ${theme.previewColors[0]}, ${theme.previewColors[1]})`
                                : theme.previewColors[0],
                          }}
                        />
                        <AnimatePresence mode="popLayout">
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2, delay: 0.05 }}
                              className="truncate font-medium flex-1 min-w-0"
                            >
                              {theme.name.split(' ')[0]} 
                              <span className="opacity-50 ml-1 text-xs font-normal">
                                {theme.name.split(' ').slice(1).join(' ')}
                              </span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                        
                        {/* Active Indicator for collapsed state */}
                        {collapsed && activeThemeId === theme.id && (
                          <motion.div 
                            layoutId="activeIndicator"
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full translate-x-2" 
                          />
                        )}
                      </motion.button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
