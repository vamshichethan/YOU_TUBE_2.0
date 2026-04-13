import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useMemo, useState } from "react";

const normalizeRoomId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const maybeUrl = new URL(trimmed);
    const parts = maybeUrl.pathname.split("/").filter(Boolean);
    if (parts[0] === "call" && parts[1]) {
      return parts[1];
    }
  } catch {
    // Treat it like a plain room code.
  }

  return trimmed.replace(/[^a-zA-Z0-9-_]/g, "");
};

export default function CallLobbyPage() {
  const router = useRouter();
  const [roomInput, setRoomInput] = useState("");

  const suggestedRoomId = useMemo(
    () => `room-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const createCall = () => {
    router.push(`/call/${suggestedRoomId}`);
  };

  const joinCall = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeRoomId(roomInput);
    if (!normalized) return;
    router.push(`/call/${normalized}`);
  };

  return (
    <>
      <Head>
        <title>Join Call | YourTube</title>
      </Head>
      <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-8 lg:flex-row">
          <section className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-red-400">YourTube Calls</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Create or join a meeting by code.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
              Start a video call, share a YouTube tab with your friend, and download the recorded
              session when you are done.
            </p>

            <div className="mt-8 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-5 text-sm text-blue-100">
              Use this page across two laptops:
              create a meeting on laptop 1, then enter the same code on laptop 2.
            </div>
          </section>

          <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold text-white/60">Create a new meeting</p>
              <p className="mt-2 text-sm text-white/70">
                A fresh meeting code will be generated and opened instantly.
              </p>
              <button
                onClick={createCall}
                className="mt-5 w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Create New Call
              </button>
            </div>

            <form
              onSubmit={joinCall}
              className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <label htmlFor="room-code" className="text-sm font-semibold text-white/60">
                Join with meeting code or call link
              </label>
              <input
                id="room-code"
                value={roomInput}
                onChange={(event) => setRoomInput(event.target.value)}
                placeholder="Paste code like room-ab12cd or a full call link"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-red-500"
              />
              <button
                type="submit"
                className="mt-4 w-full rounded-2xl bg-white px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200"
              >
                Join Call
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
