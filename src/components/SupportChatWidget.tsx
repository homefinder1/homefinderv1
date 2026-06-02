import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type Msg = { from: "bot" | "user"; text: string };

const INITIAL: Msg[] = [
  { from: "bot", text: "Hej! 👋 Välkommen till HomeFinder support. Hur kan vi hjälpa dig idag?" },
];

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: "bot",
          text: "Tack för ditt meddelande! En av våra medarbetare återkommer så snart som möjligt.",
        },
      ]);
    }, 700);
  }

  return (
    <>
      {/* Floating chat button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Stäng chatt" : "Öppna chatt med kundsupport"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
        style={{ backgroundImage: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Kundsupport chatt"
          className="fixed bottom-24 right-5 z-50 flex h-[460px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl md:right-6"
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ backgroundImage: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold leading-tight">HomeFinder Support</div>
              <div className="flex items-center gap-1.5 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Online nu
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Stäng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F8F9FA] px-3 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.from === "user"
                      ? "rounded-br-sm text-white"
                      : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                  }`}
                  style={
                    m.from === "user" ? { backgroundColor: "#2563EB" } : undefined
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-gray-200 bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv ett meddelande…"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
            <button
              type="submit"
              aria-label="Skicka"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: "#2563EB" }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
