import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { useGeoTimeTheme } from "../lib/useGeoTimeTheme";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const geo = useGeoTimeTheme();
  const router = useRouter();
  const isCallPage = router.pathname.startsWith("/call/");
  
  return (
    <UserProvider>
      <div className={`min-h-screen transition-colors duration-500 ${geo.theme === 'light' ? 'bg-white text-black' : 'bg-zinc-950 text-white'}`}>
        <title>Your-Tube Clone</title>
        {!isCallPage && <Header geo={geo} />}
        <Toaster />
        <div className={isCallPage ? "block" : "flex"}>
          {!isCallPage && <Sidebar />}
          <Component {...pageProps} />
        </div>
      </div>
    </UserProvider>
  );
}
