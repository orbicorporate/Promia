"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Field, Input, PriceTag, Sheet, cn } from "@/components/ui";
import { PhotoEditor, type PhotoProduct } from "./photo-editor";

export type Row = PhotoProduct & {
  brand: string | null;
  category: string | null;
  unit: string | null;
  price: number | null;
  cost: number | null;
  active: boolean;
  sku: string;
  ean: string | null;
};

const STATUS: Record<string, { label: string; tone: "ok" | "atencao" | "perigo" | "neutro" | "ia" }> = {
  encontrada: { label: "com foto", tone: "ok" },
  revisar: { label: "revisar foto", tone: "atencao" },
  pendente: { label: "na fila", tone: "ia" },
  nao_encontrada: { label: "sem foto", tone: "neutro" },
};

const brl = (n: number | null) => (n == null ? "" : n.toFixed(2).replace(".", ","));

export function ProductList({ rows, review, categories }: { rows: Row[]; review: boolean; categories: string[] }) {
  const router = useRouter();
  const [items, setItems] = useState(rows);
  const [prevRows, setPrevRows] = useState(rows);
  const [openId, setOpenId] = useState<string | null>(null);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setItems(rows);
  }
  const open = items.find((r) => r.id === openId) ?? null;
  const patch = (id: string, p: Partial<Row>) => setItems((list) => list.map((r) => (r.id === id ? { ...r, ...p } : r)));

  if (review) {
    const pending = items.filter((r) => r.image_status === "revisar" || r.image_status === "nao_encontrada");
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {pending.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
              className="vidro rounded-[22px] p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{r.name}</p>
                  <p className="text-xs text-[var(--ink-3)]">{[r.brand, r.ean ? `EAN ${r.ean}` : null].filter(Boolean).join(" · ") || r.category}</p>
                </div>
                <Badge tone={STATUS[r.image_status ?? ""]?.tone ?? "neutro"}>{STATUS[r.image_status ?? ""]?.label ?? "sem foto"}</Badge>
              </div>
              <PhotoEditor
                compact
                product={r}
                onChange={(p) => {
                  if (p.image_status === "encontrada") {
                    setTimeout(() => patch(r.id, p), 450);
                  } else patch(r.id, p);
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {pending.length === 0 && (
          <div className="vidro col-span-full rounded-[22px] p-8 text-center">
            <p className="font-display text-2xl font-bold">Tudo revisado</p>
            <p className="mt-1 text-[var(--ink-2)]">Nenhuma foto esperando conferência.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <ul className="vidro divide-y divide-[var(--line)] overflow-hidden rounded-[22px]">
        {items.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setOpenId(r.id)}
              className={cn("flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-[var(--glass-strong)] sm:px-4", !r.active && "opacity-50")}
            >
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-[var(--line)]">
                {r.image_url ? <img src={r.image_url} alt="" loading="lazy" className="h-full w-full object-contain" /> : <ImageOff className="size-5 text-[#9aa8a0]" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.name}</span>
                <span className="flex items-center gap-2 text-xs text-[var(--ink-3)]">
                  <span className="truncate">{[r.brand, r.category].filter(Boolean).join(" · ") || "sem categoria"}</span>
                  {r.image_status && r.image_status !== "encontrada" && (
                    <Badge tone={STATUS[r.image_status]?.tone ?? "neutro"} className="hidden sm:inline-flex">
                      {STATUS[r.image_status]?.label}
                    </Badge>
                  )}
                  {!r.active && <Badge>fora do catálogo</Badge>}
                </span>
              </span>
              <PriceTag value={r.price} unit={r.unit} size="sm" />
            </button>
          </li>
        ))}
      </ul>
      <EditSheet
        key={open?.id ?? "none"}
        product={open}
        categories={categories}
        onClose={() => setOpenId(null)}
        onSaved={(p) => {
          if (open) patch(open.id, p);
          router.refresh();
        }}
      />
    </>
  );
}

function EditSheet({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Row | null;
  categories: string[];
  onClose: () => void;
  onSaved: (p: Partial<Row>) => void;
}) {
  const [form, setForm] = useState(() => ({
    name: product?.name ?? "",
    brand: product?.brand ?? "",
    category: product?.category ?? "",
    unit: product?.unit ?? "",
    price: brl(product?.price ?? null),
    cost: brl(product?.cost ?? null),
    active: product?.active ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<Partial<Row>>({});

  async function save() {
    if (!product) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/produtos/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, price: form.price.trim() || null, cost: form.cost.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Não consegui salvar.");
        return;
      }
      const p = data.product;
      onSaved({ ...photo, ...p, price: p.price == null ? null : Number(p.price), cost: p.cost == null ? null : Number(p.cost) });
      toast.success("Produto salvo.");
      onClose();
    } catch {
      toast.error("Sem conexão agora. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Sheet
      open={!!product}
      onClose={() => {
        if (Object.keys(photo).length && product) onSaved(photo);
        onClose();
      }}
      title={product?.name ?? ""}
      description={product ? `Código ${product.sku.startsWith("n:") ? "criado pelo nome" : product.sku}${product.ean ? ` · EAN ${product.ean}` : ""}` : undefined}
      wide
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--ink-2)]">
            <input type="checkbox" className="size-4 accent-[var(--folha)]" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            No catálogo
          </label>
          <Button onClick={save} loading={saving}>
            Salvar produto
          </Button>
        </div>
      }
    >
      {product && (
        <div className="space-y-6">
          <PhotoEditor product={{ ...product, ...photo }} onChange={(p) => setPhoto((x) => ({ ...x, ...p }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" className="sm:col-span-2">
              <Input value={form.name} onChange={set("name")} maxLength={200} />
            </Field>
            <Field label="Marca">
              <Input value={form.brand} onChange={set("brand")} maxLength={80} />
            </Field>
            <Field label="Categoria">
              <Input value={form.category} onChange={set("category")} list="categorias" maxLength={80} />
              <datalist id="categorias">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Preço de venda">
              <Input value={form.price} onChange={set("price")} inputMode="decimal" placeholder="0,00" className="tabular" />
            </Field>
            <Field label="Custo" hint="Só a IA vê, para sugerir ofertas com margem">
              <Input value={form.cost} onChange={set("cost")} inputMode="decimal" placeholder="opcional" className="tabular" />
            </Field>
            <Field label="Unidade" hint="un, kg, g, l, ml, cx, pct">
              <Input value={form.unit} onChange={set("unit")} maxLength={10} />
            </Field>
          </div>
        </div>
      )}
    </Sheet>
  );
}
