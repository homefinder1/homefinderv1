export type Source = "Blocket" | "Qasa" | "HomeQ" | "Bostadsdirekt";

export interface Listing {
  id: string;
  title: string;
  city: string;
  price: number;
  rooms: number;
  size: number;
  source: Source;
  image: string;
  url: string;
}

export const CITIES = [
  "Alla städer",
  "Stockholm",
  "Göteborg",
  "Malmö",
  "Uppsala",
  "Lund",
  "Linköping",
] as const;

export const SOURCES: Source[] = ["Blocket", "Qasa", "HomeQ", "Bostadsdirekt"];

const img = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=70`;

export const LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Ljus tvåa nära Vasaparken",
    city: "Stockholm",
    price: 12500,
    rooms: 2,
    size: 54,
    source: "Qasa",
    image: img("photo-1502672260266-1c1ef2d93688"),
    url: "#",
  },
  {
    id: "2",
    title: "Modern etta i Södermalm",
    city: "Stockholm",
    price: 9800,
    rooms: 1,
    size: 32,
    source: "Blocket",
    image: img("photo-1505691938895-1758d7feb511"),
    url: "#",
  },
  {
    id: "3",
    title: "Familjevänlig trea i Majorna",
    city: "Göteborg",
    price: 14200,
    rooms: 3,
    size: 78,
    source: "HomeQ",
    image: img("photo-1493809842364-78817add7ffb"),
    url: "#",
  },
  {
    id: "4",
    title: "Charmig lägenhet vid Möllevången",
    city: "Malmö",
    price: 8500,
    rooms: 2,
    size: 48,
    source: "Blocket",
    image: img("photo-1560448204-e02f11c3d0e2"),
    url: "#",
  },
  {
    id: "5",
    title: "Studentvänlig etta nära centrum",
    city: "Lund",
    price: 6500,
    rooms: 1,
    size: 28,
    source: "Bostadsdirekt",
    image: img("photo-1522708323590-d24dbb6b0267"),
    url: "#",
  },
  {
    id: "6",
    title: "Rymlig fyra med balkong",
    city: "Uppsala",
    price: 16800,
    rooms: 4,
    size: 102,
    source: "Qasa",
    image: img("photo-1494203484021-3c454daf695d"),
    url: "#",
  },
  {
    id: "7",
    title: "Nyrenoverad trea i Linnéstaden",
    city: "Göteborg",
    price: 15500,
    rooms: 3,
    size: 82,
    source: "Qasa",
    image: img("photo-1484154218962-a197022b5858"),
    url: "#",
  },
  {
    id: "8",
    title: "Mysig etta i Östermalm",
    city: "Stockholm",
    price: 11200,
    rooms: 1,
    size: 35,
    source: "HomeQ",
    image: img("photo-1567767292278-a4f21aa2d36e"),
    url: "#",
  },
  {
    id: "9",
    title: "Tvåa med havsutsikt",
    city: "Malmö",
    price: 13900,
    rooms: 2,
    size: 62,
    source: "Bostadsdirekt",
    image: img("photo-1493809842364-78817add7ffb"),
    url: "#",
  },
  {
    id: "10",
    title: "Centralt boende i Linköping",
    city: "Linköping",
    price: 7800,
    rooms: 2,
    size: 45,
    source: "Blocket",
    image: img("photo-1554995207-c18c203602cb"),
    url: "#",
  },
];
