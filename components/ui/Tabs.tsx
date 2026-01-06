// ===== TABS COMPONENT =====
// Accessible tabbed interface.

"use client";

import { useState, createContext, useContext, type ReactNode } from "react";

// ===== CONTEXT =====
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used within Tabs");
  return context;
}

// ===== TABS ROOT =====
interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
  onChange?: (value: string) => void;
}

export function Tabs({ defaultValue, children, className = "", onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleChange = (id: string) => {
    setActiveTab(id);
    onChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// ===== TAB LIST =====
export function TabList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex border-b border-slate-200 dark:border-slate-700 ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
}

// ===== TAB TRIGGER =====
interface TabTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabTrigger({ value, children, className = "" }: TabTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={`
        px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
        ${isActive
          ? "border-blue-500 text-blue-600 dark:text-blue-400"
          : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ===== TAB CONTENT =====
interface TabContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabContent({ value, children, className = "" }: TabContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <div role="tabpanel" className={`pt-4 ${className}`}>
      {children}
    </div>
  );
}
