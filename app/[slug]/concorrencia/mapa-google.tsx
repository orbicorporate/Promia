"use client";

import { useEffect, useRef, useState } from "react";
import type { PinConcorrente } from "./mapa";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

let carregando: Promise<void> | null = null;
function carregarGoogle(chave: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("sem janela"));
  if (typeof window.google?.maps?.importLibrary === "function") return Promise.resolve();
  if (carregando) return carregando;
  carregando = new Promise<void>((ok, erro) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(chave)}&loading=async&language=pt-BR&region=BR`;
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => {
      carregando = null;
      erro(new Error("Não foi possível carregar o Google Maps"));
    };
    document.head.appendChild(s);
  });
  return carregando;
}

// Mesmo mapa da Concorrência, desenhado com o Google Maps.
export function MapaGoogle({ chave, origem, pins, raioKm, ativo, onPick, onFalha, altura }: { altura: string; chave: string; origem: { name: string; latitude: number; longitude: number }; pins: PinConcorrente[]; raioKm: number; ativo: string | null; onPick: (id: string) => void; onFalha: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const info = useRef<google.maps.InfoWindow | null>(null);
  const itens = useRef<{ limpar: () => void }[]>([]);
  const marcadores = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const abrirRef = useRef<((p: PinConcorrente) => void) | null>(null);
  const [pronto, setPronto] = useState(false);
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let vivo = true;
    carregarGoogle(chave)
      .then(async () => {
        const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        await google.maps.importLibrary("marker");
        if (!vivo || !el.current) return;
        mapRef.current = new Map(el.current, { center: { lat: origem.latitude, lng: origem.longitude }, zoom: 13, mapId: "DEMO_MAP_ID", disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative", clickableIcons: false });
        info.current = new google.maps.InfoWindow({ disableAutoPan: false });
        setPronto(true);
      })
      .catch(() => vivo && onFalha());
    // o Google avisa chave inválida ou API desativada por esta função global
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => vivo && onFalha();
    return () => {
      vivo = false;
      itens.current.forEach((i) => i.limpar());
      itens.current = [];
      mapRef.current = null;
    };
    // o mapa nasce uma vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  useEffect(() => {
    const map = mapRef.current;
    if (!pronto || !map) return;
    itens.current.forEach((i) => i.limpar());
    itens.current = [];
    marcadores.current.clear();
    const centro = { lat: origem.latitude, lng: origem.longitude };
    const circulo = new google.maps.Circle({ map, center: centro, radius: raioKm * 1000, strokeColor: "#b3122f", strokeOpacity: 0.55, strokeWeight: 1.5, fillColor: "#e8284f", fillOpacity: 0.06, clickable: false });
    itens.current.push({ limpar: () => circulo.setMap(null) });

    const eu = document.createElement("span");
    eu.style.cssText = "display:grid;place-items:center;width:40px;height:40px;border-radius:999px;background:linear-gradient(135deg,#e8284f,#8c0c26);box-shadow:0 0 0 6px rgba(179,18,47,.2),0 8px 18px -6px rgba(179,18,47,.8);border:3px solid #fff;color:#fff;font:700 15px system-ui";
    eu.textContent = "Eu";
    const meu = new google.maps.marker.AdvancedMarkerElement({ map, position: centro, content: eu, title: origem.name, zIndex: 1000 });
    itens.current.push({ limpar: () => (meu.map = null) });

    for (const p of pins) {
      const pin = document.createElement("span");
      pin.style.cssText = `display:block;width:30px;height:30px;border-radius:999px 999px 999px 4px;transform:rotate(-45deg) translate(6px,-6px);background:${p.cor};border:3px solid #fff;box-shadow:0 6px 14px -4px rgba(0,0,0,.45)`;
      const m = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: p.latitude, lng: p.longitude }, content: pin, title: p.name });
      m.addListener("click", () => {
        onPickRef.current(p.id);
        abrir(p);
      });
      marcadores.current.set(p.id, m);
      itens.current.push({ limpar: () => (m.map = null) });
    }
    const limites = new google.maps.LatLngBounds(centro);
    pins.forEach((p) => limites.extend({ lat: p.latitude, lng: p.longitude }));
    const b = circulo.getBounds();
    if (b) limites.union(b);
    map.fitBounds(limites, 24);
    google.maps.event.addListenerOnce(map, "idle", () => {
      if ((map.getZoom() ?? 0) > 15) map.setZoom(15);
    });

    function abrir(p: PinConcorrente) {
      info.current?.setContent(
        `<div style="font:14px system-ui;min-width:170px"><strong style="font-size:15px">${esc(p.name)}</strong><br>${p.dist != null ? `${p.dist.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km do seu mercado<br>` : ""}${p.rating != null ? `Nota ${p.rating.toLocaleString("pt-BR")} (${p.reviews ?? 0} avaliações)<br>` : ""}<span style="color:#555">${esc(p.nota)}</span></div>`,
      );
      const m = marcadores.current.get(p.id);
      if (m) info.current?.open({ map, anchor: m });
    }
    abrirRef.current = abrir;
  }, [pronto, origem.latitude, origem.longitude, origem.name, pins, raioKm]);

  useEffect(() => {
    if (!ativo || !pronto) return;
    const p = pins.find((x) => x.id === ativo);
    const m = marcadores.current.get(ativo);
    if (!p || !m || !mapRef.current) return;
    mapRef.current.panTo({ lat: p.latitude, lng: p.longitude });
    abrirRef.current?.(p);
  }, [ativo, pronto, pins]);

  return <div ref={el} className={`w-full overflow-hidden rounded-[20px] ring-1 ring-[var(--line)] ${altura}`} role="region" aria-label="Mapa dos concorrentes" />;
}
