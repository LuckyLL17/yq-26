import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PageLoader from "@/components/PageLoader";
import ErrorBoundary from "@/components/ErrorBoundary";
import { monitor } from "@/lib/monitor";

const Home = lazy(() =>
  import("@/pages/Home").then((mod) => {
    monitor.addBreadcrumb("route", "Home page loaded");
    return mod;
  })
);

const EditorPage = lazy(() =>
  import("@/pages/Editor").then((mod) => {
    monitor.addBreadcrumb("route", "Editor page loaded");
    return mod;
  })
);

export default function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary componentName="HomePage">
                <Home />
              </ErrorBoundary>
            }
          />
          <Route
            path="/editor"
            element={
              <ErrorBoundary componentName="EditorPage">
                <EditorPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/other"
            element={
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center text-xl text-white">
                  Other Page - Coming Soon
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}
