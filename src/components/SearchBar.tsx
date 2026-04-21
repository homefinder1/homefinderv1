import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  variant?: "hero" | "compact";
}

export function SearchBar({ variant = "hero" }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const search: Record<string, string> = {};
    if (query.trim()) search.q = query.trim();
    navigate({ to: "/sok", search });
  };

  return (
    <form
      onSubmit={handleSearch}
      className={
        variant === "hero"
          ? "flex w-full flex-col gap-2 rounded-3xl border border-border/50 bg-card p-3 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center"
          : "flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-2 sm:flex-row sm:items-center"
      }
    >
      <Input
        type="search"
        placeholder="Sök på område, gata eller hyresvärd…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 w-full flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
      />
      <Button type="submit" size="lg" className="h-12 w-full gap-2 px-6 text-base sm:w-auto">
        <Search className="h-4 w-4" />
        Sök
      </Button>
    </form>
  );
}
