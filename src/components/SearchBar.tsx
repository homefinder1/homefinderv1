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
          ? "flex w-full items-center gap-2 rounded-3xl border border-border/50 bg-card p-3 shadow-[var(--shadow-soft)]"
          : "flex w-full items-center gap-2 rounded-2xl border border-border bg-card p-2"
      }
    >
      <Input
        type="search"
        placeholder="Sök på område, gata eller hyresvärd…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      <Button type="submit" size="lg" className="h-12 gap-2 px-6">
        <Search className="h-4 w-4" />
        Sök
      </Button>
    </form>
  );
}
