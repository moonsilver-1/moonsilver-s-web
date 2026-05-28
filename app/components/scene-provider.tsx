"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_SCENE, type SceneKey } from "@/app/lib/scene-config";

type SceneContextValue = {
  scene: SceneKey;
  setScene: (scene: SceneKey) => void;
};

const SceneContext = createContext<SceneContextValue | null>(null);

function readInitialScene(): SceneKey {
  if (typeof window === "undefined") return DEFAULT_SCENE;
  const stored = window.localStorage.getItem("site-scene");
  if (stored === "autumn" || stored === "spring" || stored === "winter" || stored === "starry") {
    return stored;
  }
  return DEFAULT_SCENE;
}

export function SceneProvider({ children }: { children: React.ReactNode }) {
  const [scene, setSceneState] = useState<SceneKey>(readInitialScene);

  useEffect(() => {
    document.documentElement.dataset.scene = scene;
    window.localStorage.setItem("site-scene", scene);
  }, [scene]);

  const value = useMemo<SceneContextValue>(
    () => ({ scene, setScene: setSceneState }),
    [scene],
  );

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) throw new Error("useScene must be used within SceneProvider");
  return context;
}
