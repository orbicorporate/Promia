"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui";
import { PromiaLogo } from "@/components/shell/logo";

const TAGS = [
  { name: "Banana prata", unit: "kg", price: "4,99", rot: -8, x: "8%", y: "14%", delay: 0.1 },
  { name: "Arroz 5 kg", unit: "", price: "21,90", rot: 6, x: "52%", y: "6%", delay: 0.25 },
  { name: "Picanha", unit: "kg", price: "59,90", rot: -4, x: "30%", y: "42%", delay: 0.4 },
  { name: "Café 500 g", unit: "", price: "16,49", rot: 9, x: "62%", y: "56%", delay: 0.55 },
  { name: "Leite integral", unit: "", price: "4,79", rot: -10, x: "6%", y: "70%", delay: 0.7 },
];

export default function LoginPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password: senha });
      if (error) {
        setErro("Email ou senha não conferem. Confira e tente de novo.");
        setCarregando(false);
        return;
      }
    } catch {
      setErro("Sem conexão agora. Confira a internet e tente de novo.");
      setCarregando(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col justify-between gap-10 px-5 py-8 sm:px-10 lg:py-12">
        <PromiaLogo className="h-9" />
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-4xl font-extrabold leading-[1.02] sm:text-5xl">Ofertas da semana, prontas para postar.</h1>
          <p className="mt-3 text-[var(--ink-2)]">Entre para montar os encartes do seu mercado.</p>
          <form onSubmit={handleSubmit} className="vidro mt-8 space-y-4 rounded-[26px] p-6">
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Senha" htmlFor="senha">
              <div className="relative">
                <Input id="senha" type={ver ? "text" : "password"} autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} className="pr-11" />
                <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-[var(--ink-3)] hover:bg-[var(--line)]" aria-label={ver ? "Esconder senha" : "Mostrar senha"}>
                  {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            {erro && (
              <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} className="text-sm text-[var(--perigo)]" role="alert">
                {erro}
              </motion.p>
            )}
            <Button type="submit" size="lg" className="w-full" loading={carregando}>
              Entrar
            </Button>
          </form>
        </div>
        <p className="text-xs text-[var(--ink-3)]">Esqueceu a senha? Fale com o time Promia pelo WhatsApp.</p>
      </section>

      <section className="relative hidden overflow-hidden lg:block" aria-hidden>
        <div className="absolute inset-6 overflow-hidden rounded-[36px] bg-[linear-gradient(160deg,#ef4127_0%,#d4321b_55%,#9d1f0d_100%)] shadow-[0_40px_80px_-40px_rgba(157,31,13,0.8)]">
          <div className="absolute inset-0 opacity-25 [background:repeating-conic-gradient(from_0deg_at_50%_120%,rgba(255,255,255,0.35)_0deg_6deg,transparent_6deg_18deg)]" />
          <p className="absolute bottom-10 left-10 right-10 font-display text-[clamp(3rem,6vw,6.5rem)] font-extrabold leading-[0.9] text-white/95">
            Preço
            <br />
            baixo
            <br />
            <span className="text-[#ffcf3a]">de verdade.</span>
          </p>
          {TAGS.map((t) => (
            <motion.div
              key={t.name}
              className="absolute w-44 rounded-2xl bg-white p-3 shadow-[0_24px_40px_-20px_rgba(0,0,0,0.55)]"
              style={{ left: t.x, top: t.y }}
              initial={reduce ? false : { opacity: 0, y: 40, rotate: 0, scale: 0.9 }}
              animate={reduce ? { rotate: t.rot } : { opacity: 1, y: [0, -8, 0], rotate: t.rot, scale: 1 }}
              transition={reduce ? undefined : { opacity: { delay: t.delay, duration: 0.5 }, scale: { delay: t.delay, type: "spring" }, rotate: { delay: t.delay, type: "spring" }, y: { delay: t.delay + 0.6, duration: 5 + t.delay * 3, repeat: Infinity, ease: "easeInOut" } }}
            >
              <p className="text-sm font-semibold text-[#1d2420]">{t.name}</p>
              <span className="mt-2 inline-flex items-start gap-0.5 rounded-xl bg-[#ffcf3a] px-2.5 py-1 font-display font-extrabold leading-none text-[#b8240f] shadow-[0_3px_0_#c99a00]">
                <span className="mt-0.5 text-xs">R$</span>
                <span className="text-3xl">{t.price.split(",")[0]}</span>
                <span className="flex flex-col text-sm">
                  ,{t.price.split(",")[1]}
                  {t.unit && <span className="text-[10px] opacity-80">/{t.unit}</span>}
                </span>
              </span>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
