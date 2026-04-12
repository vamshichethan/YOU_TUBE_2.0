import { Bell, Menu, Mic, Moon, Search, Sun, User, VideoIcon, Phone } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Channeldialogue from "./channeldialogue";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";
import LoginModal from "./LoginModal";
import { GeoInfo } from "@/lib/useGeoTimeTheme";

interface HeaderProps {
  geo?: GeoInfo;
}

const Header: React.FC<HeaderProps> = ({ geo }) => {
  const { user, logout } = useUser();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isdialogeopen, setisdialogeopen] = useState(false);
  const router = useRouter();
  
  const handleStartCall = () => {
    const roomId = Math.random().toString(36).substring(7);
    router.push(`/call/${roomId}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const handleKeypress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as any);
    }
  };

  const toggleTheme = () => {
    if (!geo) return;
    geo.setThemePreference(geo.theme === "dark" ? "light" : "dark");
  };
  
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2 text-foreground backdrop-blur transition-colors duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Menu className="w-6 h-6" />
        </Button>
        <Link href="/" className="flex items-center gap-1">
          <div className="bg-red-600 p-1 rounded">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tighter text-foreground transition-colors">YourTube</span>
          <span className="text-[10px] font-bold text-muted-foreground/60 ml-0.5">IN</span>
        </Link>
      </div>
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 flex-1 max-w-2xl mx-4"
      >
        <div className="flex flex-1">
          <Input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onKeyPress={handleKeypress}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-l-full border-border bg-background/50 focus-visible:ring-1 focus-visible:ring-red-500 transition-all placeholder:opacity-50"
          />
          <Button
            type="submit"
            className="rounded-r-full px-6 bg-muted hover:bg-muted/80 text-foreground border border-l-0 border-border transition-colors group"
          >
            <Search className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Mic className="w-5 h-5" />
        </Button>
      </form>
      <div className="flex items-center gap-2">
        {geo && (
          <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme} title={`Switch to ${geo.theme === "dark" ? "light" : "dark"} mode`}>
            {geo.theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        )}
        {user ? (
          <>
            <Button variant="ghost" size="icon" onClick={handleStartCall} title="Start a Video Call">
              <Phone className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <VideoIcon className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-6 h-6" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image} />
                    <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {user?.channelname ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/channel/${user?._id}`}>Your channel</Link>
                  </DropdownMenuItem>
                ) : (
                  <div className="px-2 py-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setisdialogeopen(true)}
                    >
                      Create Channel
                    </Button>
                  </div>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/history">History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/liked">Liked videos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/watch-later">Watch later</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button
              className="flex items-center gap-2 bg-foreground text-background hover:opacity-90 font-bold px-6 py-2 rounded-full shadow-sm transition-all"
              onClick={() => setIsLoginModalOpen(true)}
            >
              <User className="w-4 h-4" />
              Sign in
            </Button>
          </>
        )}{" "}
      </div>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
      {geo && (
        <LoginModal 
            isOpen={isLoginModalOpen} 
            onClose={() => setIsLoginModalOpen(false)} 
            geo={geo} 
        />
      )}
    </header>
  );
};

export default Header;
