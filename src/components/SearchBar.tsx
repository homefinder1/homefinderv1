import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CITIES } from "@/data/listings";

interface Props {
  variant?: "hero" | "compact";
}

export function SearchBar({ variant = "hero" }: Props) {
  const navigate = useNavigate();
  const [city, setCity] = useState<string>("Alla städer");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [rooms, setRooms] = useState<string>("any");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const search: Record<string, string> = {};
    if (city && city !== "Alla städer") search.city = city;
    if (maxPrice) search.maxPrice = maxPrice;
    if (rooms && rooms !== "any") search.rooms = rooms;
    navigate({ to: "/sok", search });
  };

  return (
    <form
      onSubmit={handleSearch}
      className={
        variant === "hero"
          ? "grid w-full gap-3 rounded-3xl border border-border/50 bg-card p-4 shadow-[var(--shadow-soft)] md:grid-cols-[1.3fr_1fr_1fr_auto] md:gap-2 md:p-3"
          : "grid w-full gap-2 rounded-2xl border border-border bg-card p-2 md:grid-cols-[1.3fr_1fr_1fr_auto]"
      }
    >
      <Select value={city} onValueChange={setCity}>
        <SelectTrigger className="h-12 border-0 bg-transparent shadow-none focus:ring-0">
          <SelectValue placeholder="Stad" />
        </SelectTrigger>
        <SelectContent>
          {CITIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="number"
        inputMode="numeric"
        placeholder="Max pris (kr)"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
        className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
      />

      <Select value={rooms} onValueChange={setRooms}>
        <SelectTrigger className="h-12 border-0 bg-transparent shadow-none focus:ring-0">
          <SelectValue placeholder="Antal rum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Alla</SelectItem>
          <SelectItem value="1">1 rum</SelectItem>
          <SelectItem value="2">2 rum</SelectItem>
          <SelectItem value="3">3 rum</SelectItem>
          <SelectItem value="4">4+ rum</SelectItem>
        </SelectContent>
      </Select>

      <Button type="submit" size="lg" className="h-12 gap-2 px-6">
        <Search className="h-4 w-4" />
        Sök
      </Button>
    </form>
  );
}
