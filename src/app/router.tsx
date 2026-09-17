import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "./error-boundary";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { PageLoader, RouteProgressBar } from "@/components/Loading";
import { StartSplash } from "@/components/StartSplash";

const Landing = lazy(() => import("@/pages/Landing/Landing"));
const Explore = lazy(() => import("@/pages/Explore/Explore"));
const Overview = lazy(() => import("@/pages/Overview/Overview"));
const Heat = lazy(() => import("@/pages/Heat/Heat"));
const History = lazy(() => import("@/pages/History/History"));
const Layers = lazy(() => import("@/pages/Layers/Layers"));
const Drivers = lazy(() => import("@/pages/Drivers/Drivers"));
const ModelPage = lazy(() => import("@/pages/Model/Model"));
const Scenario = lazy(() => import("@/pages/Scenario/Scenario"));
const Optimize = lazy(() => import("@/pages/Optimize/Optimize"));
const Solutions = lazy(() => import("@/pages/Solutions/Solutions"));
const Report = lazy(() => import("@/pages/Report/Report"));
const Datasets = lazy(() => import("@/pages/Datasets/Datasets"));
const ModelsRegistry = lazy(() => import("@/pages/Models/ModelsRegistry"));
const Research = lazy(() => import("@/pages/Research/Research"));
const About = lazy(() => import("@/pages/About/About"));
const NotFound = lazy(() => import("@/pages/NotFound/NotFound"));

function LazyPage({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ink">
          <PageLoader label={`LOADING ${label.toUpperCase()}…`} />
        </div>
      }
    >
      <ErrorBoundary label={label}>{children}</ErrorBoundary>
    </Suspense>
  );
}

/** Root chrome: boot splash + route progress bar wrap every route (inside router context). */
function RootShell() {
  return (
    <>
      <StartSplash />
      <RouteProgressBar />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootShell />,
    children: [
      { index: true, element: <LazyPage label="landing"><Landing /></LazyPage> },
      { path: "explore", element: <LazyPage label="explore"><Explore /></LazyPage> },
      {
        path: "explore/:aoiId",
        element: <WorkspaceLayout />,
        children: [
          { index: true, element: <LazyPage label="overview"><Overview /></LazyPage> },
          { path: "overview", element: <LazyPage label="overview"><Overview /></LazyPage> },
          { path: "heat", element: <LazyPage label="heat"><Heat /></LazyPage> },
          { path: "history", element: <LazyPage label="history"><History /></LazyPage> },
          { path: "layers", element: <LazyPage label="layers"><Layers /></LazyPage> },
          { path: "drivers", element: <LazyPage label="drivers"><Drivers /></LazyPage> },
          { path: "model", element: <LazyPage label="model"><ModelPage /></LazyPage> },
          { path: "scenario", element: <LazyPage label="scenario"><Scenario /></LazyPage> },
          { path: "optimize", element: <LazyPage label="optimize"><Optimize /></LazyPage> },
          { path: "solutions", element: <LazyPage label="solutions"><Solutions /></LazyPage> },
          { path: "report", element: <LazyPage label="report"><Report /></LazyPage> },
        ],
      },
      { path: "datasets", element: <LazyPage label="datasets"><Datasets /></LazyPage> },
      { path: "models", element: <LazyPage label="models"><ModelsRegistry /></LazyPage> },
      { path: "research", element: <LazyPage label="research"><Research /></LazyPage> },
      { path: "about", element: <LazyPage label="about"><About /></LazyPage> },
      { path: "*", element: <LazyPage label="not-found"><NotFound /></LazyPage> },
    ],
  },
]);

export function Router() {
  return (
    <ErrorBoundary label="router">
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
