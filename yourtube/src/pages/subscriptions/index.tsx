import Videogrid from "@/components/Videogrid";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/AuthContext";
import { PlaySquare } from "lucide-react";
import { Suspense } from "react";

export default function SubscriptionsPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <main className="flex-1 p-6">
        <div className="mx-auto mt-20 max-w-xl rounded-[2rem] border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/10 text-red-600">
            <PlaySquare className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Subscriptions</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to follow your favorite creators and keep their latest videos in one place.
          </p>
          <Button className="mt-6">Sign in to continue</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/10 text-red-600">
          <PlaySquare className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">
            Latest videos from creators you want to keep up with.
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading subscriptions...</div>}>
        <Videogrid />
      </Suspense>
    </main>
  );
}
