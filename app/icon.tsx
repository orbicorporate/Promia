import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Etiqueta de oferta amarela sobre o verde do Promia.
export default function Icon() {
  const s = 512;
  return new ImageResponse(
    (
      <div style={{ width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center", background: "#138a4c", borderRadius: s * 0.22 }}>
        <div
          style={{
            width: s * 0.62,
            height: s * 0.62,
            background: "#ffcf3a",
            borderRadius: s * 0.08,
            transform: "rotate(-12deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#b8240f",
            fontSize: s * 0.36,
            fontWeight: 800,
            boxShadow: `0 ${s * 0.03}px 0 #c99a00`,
          }}
        >
          %
        </div>
      </div>
    ),
    size
  );
}
