"use client";

import dynamic from "next/dynamic";

const Demo = dynamic(() => import("~/components/Demo"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  ),
});

export default function App() {
  return (
    <main className="min-h-screen flex flex-col">
      <Demo />
    </main>
  );
}
