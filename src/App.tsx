import { useEffect, useState, useCallback } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SettingsProvider } from "./lib/settings";
import { AuthProvider } from "./lib/auth";
import { syncUserTutorials } from "./lib/tutorialStore";
import { isSupabaseReady } from "./lib/supabase";
import {
  startLeanSync, stopLeanSync, setSyncCallback, scheduleLeanBackup,
} from "./lib/leanSync";
import { isLeanReady } from "./lib/leanSync";
import { Landing } from "./pages/Landing";
import { Home } from "./pages/Home";
import { Category } from "./pages/Category";
import { TutorialDetail } from "./pages/TutorialDetail";
import { Upload } from "./pages/Upload";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { Circle } from "./pages/Circle";
import { Members } from "./pages/Members";

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const [syncTick, setSyncTick] = useState(0);

  const onSync = useCallback(() => {
    // trigger re-render by incrementing tick
    setSyncTick(t => t + 1);
  }, []);

  useEffect(() => {
    if (isLeanReady()) {
      setSyncCallback(onSync);
      startLeanSync();
    }
    if (isSupabaseReady()) {
      syncUserTutorials();
    }
    return () => stopLeanSync();
  }, []);

  // re-read on sync tick
  useEffect(() => {
    if (syncTick > 0) {
      syncUserTutorials();
    }
  }, [syncTick]);

  return (
    <SettingsProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/members" element={<Members />} />
          <Route element={<Layout />}>
            <Route path="/browse" element={<Home />} />
            <Route path="/category" element={<Category />} />
            <Route path="/circle" element={<Circle />} />
            <Route path="/tutorial/:id" element={<TutorialDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </SettingsProvider>
  );
}
