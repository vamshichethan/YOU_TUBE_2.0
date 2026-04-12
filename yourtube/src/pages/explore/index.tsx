import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";
import { Compass } from "lucide-react";
import { Suspense } from "react";

export default function ExplorePage() {
  return (
    <main className="flex-1 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/10 text-red-600">
          <Compass className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Explore</h1>
          <p className="text-sm text-muted-foreground">
            Discover trending videos, fresh creators, and new topics.
          </p>
        </div>
      </div>

      <CategoryTabs />

      <Suspense fallback={<div>Loading explore feed...</div>}>
        <Videogrid />
      </Suspense>
    </main>
  );
}
