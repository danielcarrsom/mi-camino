"use client";
// "I'm saving for…" certificate: a picture made on the phone, ready to share
// with family by WhatsApp or any app. Nothing is uploaded anywhere.
import { useEffect, useState } from "react";
import { Download, Share2, MessageCircle } from "lucide-react";
import { Button, Sheet } from "./ui";
import { useLang } from "@/lib/store";

type Props = { open: boolean; onClose: () => void; person: string; goal: string; saved: number; target: number; since: string; emoji?: string };

const fmt = (n: number, en: boolean) => "$" + Math.round(n).toLocaleString(en ? "en-US" : "es-MX");

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

async function draw({ person, goal, saved, target, since, emoji }: Omit<Props, "open" | "onClose">, en: boolean): Promise<Blob | null> {
  await document.fonts?.ready;
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  const serif = '"Source Serif 4 Variable", Georgia, serif';
  const sans = '"Nunito Variable", system-ui, sans-serif';

  // background + frame
  x.fillStyle = "#f6efe2"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#1f2b27"; x.fillRect(0, 0, W, 210);
  x.strokeStyle = "#e0a33a"; x.lineWidth = 10; x.strokeRect(40, 250, W - 80, H - 330);
  x.strokeStyle = "#e0a33a55"; x.lineWidth = 3; x.strokeRect(62, 272, W - 124, H - 374);

  // header
  x.fillStyle = "#f6efe2"; x.font = `600 64px ${serif}`; x.textAlign = "center";
  x.fillText("Mi Camino", W / 2, 128);
  x.fillStyle = "#e0a33a"; x.font = `700 30px ${sans}`;
  x.fillText(en ? "SAVINGS CERTIFICATE" : "CERTIFICADO DE AHORRO", W / 2, 178);

  // body
  x.fillStyle = "#1f2b27"; x.font = `600 76px ${serif}`;
  x.fillText(person || (en ? "Someone special" : "Alguien especial"), W / 2, 400);
  x.fillStyle = "#6b6257"; x.font = `600 40px ${sans}`;
  x.fillText(en ? "is saving for" : "está ahorrando para", W / 2, 470);

  x.font = `120px ${sans}`; x.fillText(emoji ?? "🏠", W / 2, 625);
  x.fillStyle = "#b34a2a"; x.font = `700 72px ${serif}`;
  const lines = wrap(x, goal, W - 220).slice(0, 2);
  lines.forEach((l, i) => x.fillText(l, W / 2, 735 + i * 84));
  const y0 = 735 + (lines.length - 1) * 84;

  // progress
  const p = Math.max(0, Math.min(1, saved / target));
  const bx = 160, bw = W - 320, by = y0 + 80;
  x.fillStyle = "#e6dccb"; roundRect(x, bx, by, bw, 44, 22); x.fill();
  x.fillStyle = "#3e7d4f"; roundRect(x, bx, by, Math.max(44, bw * p), 44, 22); x.fill();
  x.fillStyle = "#1f2b27"; x.font = `800 44px ${sans}`;
  x.fillText(`${Math.round(p * 100)}% · ${fmt(saved, en)} ${en ? "of" : "de"} ${fmt(target, en)}`, W / 2, by + 115);

  x.fillStyle = "#6b6257"; x.font = `600 34px ${sans}`;
  x.fillText(`${en ? "Saving since" : "Ahorrando desde"} ${since}`, W / 2, by + 185);

  // footer
  x.fillStyle = "#3e7d4f"; x.font = `700 36px ${sans}`;
  x.fillText(en ? "Little by little, we're getting there 💪" : "Poco a poco, vamos llegando 💪", W / 2, H - 150);
  x.fillStyle = "#8a8174"; x.font = `600 26px ${sans}`;
  x.fillText(en ? "Made with Mi Camino" : "Hecho con Mi Camino", W / 2, H - 40);

  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}

function roundRect(x: CanvasRenderingContext2D, X: number, Y: number, w: number, h: number, r: number) {
  x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
}

export function CertificateSheet(props: Props) {
  const lang = useLang();
  const en = lang === "en";
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const { open, person, goal, saved, target, since, emoji } = props;

  useEffect(() => {
    if (!open) return;
    let alive = true, made: string | null = null;
    void draw({ person, goal, saved, target, since, emoji }, en).then((b) => {
      if (!alive || !b) return;
      made = URL.createObjectURL(b);
      setBlob(b); setUrl(made);
    });
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [open, person, goal, saved, target, since, emoji, en]);

  const text = en
    ? `I'm saving for "${goal}" with Mi Camino: ${Math.round((saved / target) * 100)}% done! 💪`
    : `¡Estoy ahorrando para "${goal}" con Mi Camino! Ya llevo ${Math.round((saved / target) * 100)}% 💪`;
  const file = blob ? new File([blob], "mi-camino-certificado.png", { type: "image/png" }) : null;
  const canShareFile = typeof navigator !== "undefined" && !!file && !!navigator.canShare?.({ files: [file] });

  return (
    <Sheet open={open} onClose={props.onClose} title={en ? "Share with your family" : "Compártelo con tu familia"}>
      <div className="space-y-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={en ? "Savings certificate" : "Certificado de ahorro"} className="mx-auto w-full max-w-xs rounded-2xl border border-sand shadow-md" />
        ) : (
          <div className="mx-auto aspect-[4/5] w-full max-w-xs animate-pulse rounded-2xl bg-sand" />
        )}
        {canShareFile ? (
          <Button className="w-full" onClick={() => void navigator.share({ files: [file!], text }).catch(() => {})}><Share2 size={22} /> {en ? "Share" : "Compartir"}</Button>
        ) : (
          <Button className="w-full" href={`https://wa.me/?text=${encodeURIComponent(text)}`}><MessageCircle size={22} /> {en ? "Send by WhatsApp" : "Enviar por WhatsApp"}</Button>
        )}
        {url && (
          <a href={url} download="mi-camino-certificado.png" className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-sand text-lg font-bold">
            <Download size={20} /> {en ? "Save the picture" : "Guardar la imagen"}
          </a>
        )}
        <p className="text-center text-base text-muted">{en ? "It only shows your first name, your goal and your progress." : "Solo muestra tu nombre, tu meta y cuánto llevas."}</p>
      </div>
    </Sheet>
  );
}
