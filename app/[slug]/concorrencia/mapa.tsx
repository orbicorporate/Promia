"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";

export type PinConcorrente = { id: string; name: string; latitude: number; longitude: number; dist: number | null; rating: number | null; reviews: number | null; address: string | null; cor: string; nota: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Mapa com o mercado analisado, o raio escolhido e cada concorrente como um pino
// colorido pelo preço (vermelho: mais barato que você, verde: mais caro, cinza: sem dado).
export function MapaConcorrentes({ origem, pins, raioKm, ativo, onPick }: { origem: { name: string; latitude: number; longitude: number }; pins: PinConcorrente[]; raioKm: number; ativo: string | null; onPick: (id: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const camada = useRef<Leaflet.LayerGroup | null>(null);
  const markers = useRef<Map<string, Leaflet.Marker>>(new Map());
  const lib = useRef<typeof Leaflet | null>(null);
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!vivo || !el.current || mapRef.current) return;
      lib.current = L;
      const map = L.map(el.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: true }).setView([origem.latitude, origem.longitude], 13);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      // Com NEXT_PUBLIC_MAPTILER_KEY usa o MapTiler (visual mais limpo);
      // sem a chave cai no OpenStreetMap, que não pede chave.
      const chave = process.env.NEXT_PUBLIC_MAPTILER_KEY;
      if (chave) {
        L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${chave}`, {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
      } else {
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
      }
      camada.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      map.fire("moveend");
      // força o desenho depois que o contêiner ganha tamanho
      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => {
      vivo = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // o mapa nasce uma vez; as camadas são refeitas no efeito abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const L = lib.current;
      const map = mapRef.current;
      const g = camada.current;
      if (!L || !map || !g) return;
      clearInterval(t);
      g.clearLayers();
      markers.current.clear();
      const centro: [number, number] = [origem.latitude, origem.longitude];
      const circulo = L.circle(centro, { radius: raioKm * 1000, color: "#b3122f", weight: 1.5, opacity: 0.55, fillColor: "#e8284f", fillOpacity: 0.06, interactive: false }).addTo(g);
      L.marker(centro, {
        zIndexOffset: 1000,
        icon: L.divIcon({ className: "", iconSize: [40, 40], iconAnchor: [20, 20], html: `<span style="display:grid;place-items:center;width:40px;height:40px;border-radius:999px;background:linear-gradient(135deg,#e8284f,#8c0c26);box-shadow:0 0 0 6px rgba(179,18,47,.2),0 8px 18px -6px rgba(179,18,47,.8);border:3px solid #fff;color:#fff;font:700 15px system-ui">Eu</span>` }),
      })
        .bindTooltip(esc(origem.name), { direction: "top", offset: [0, -18] })
        .addTo(g);
      for (const p of pins) {
        const m = L.marker([p.latitude, p.longitude], {
          icon: L.divIcon({ className: "", iconSize: [30, 30], iconAnchor: [15, 15], html: `<span data-pin="${esc(p.id)}" style="display:block;width:30px;height:30px;border-radius:999px 999px 999px 4px;transform:rotate(-45deg);background:${p.cor};border:3px solid #fff;box-shadow:0 6px 14px -4px rgba(0,0,0,.45);transition:transform .2s"></span>` }),
        });
        m.bindPopup(
          `<div style="font:14px system-ui;min-width:170px"><strong style="font-size:15px">${esc(p.name)}</strong><br>${p.dist != null ? `${p.dist.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km do seu mercado<br>` : ""}${p.rating != null ? `Nota ${p.rating.toLocaleString("pt-BR")} (${p.reviews ?? 0} avaliações)<br>` : ""}<span style="color:#555">${esc(p.nota)}</span></div>`,
          { closeButton: false },
        );
        m.on("click", () => onPickRef.current(p.id));
        m.addTo(g);
        markers.current.set(p.id, m);
      }
      const pts: [number, number][] = [centro, ...pins.map((p) => [p.latitude, p.longitude] as [number, number])];
      map.fitBounds(L.latLngBounds(pts).extend(circulo.getBounds()), { padding: [24, 24], maxZoom: 15 });
    }, 60);
    return () => clearInterval(t);
  }, [origem.latitude, origem.longitude, origem.name, pins, raioKm]);

  useEffect(() => {
    if (!ativo) return;
    const m = markers.current.get(ativo);
    if (m && mapRef.current) {
      mapRef.current.panTo(m.getLatLng(), { animate: true });
      m.openPopup();
    }
  }, [ativo]);

  return <div ref={el} className="h-[360px] w-full overflow-hidden rounded-[20px] ring-1 ring-[var(--line)] sm:h-[420px]" role="region" aria-label="Mapa dos concorrentes" />;
}
