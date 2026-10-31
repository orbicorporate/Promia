"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui";
import { PromiaLogo } from "@/components/shell/logo";

// cartões da vitrine: cada um ocupa a própria célula da grade, então nunca se sobrepõem
const TAGS = [
  { name: "Banana prata", unit: "kg", price: 4.99, rot: -3, col: 0, off: 0, delay: 0.15, flutua: 5.2 },
  { name: "Arroz 5 kg", unit: "", price: 21.9, rot: 3, col: 1, off: 28, delay: 0.3, flutua: 6.1 },
  { name: "Picanha", unit: "kg", price: 59.9, rot: 2.5, col: 0, off: 0, delay: 0.45, flutua: 5.7 },
  { name: "Café 500 g", unit: "", price: 16.49, rot: -3.5, col: 1, off: 28, delay: 0.6, flutua: 6.5 },
  { name: "Leite integral", unit: "", price: 4.79, rot: -2.5, col: 0, off: 0, delay: 0.75, flutua: 5.9 },
];
const PALAVRAS = [
  { t: "Preço", cor: "" },
  { t: "baixo", cor: "" },
  { t: "de verdade.", cor: "text-[#ffcf3a]" },
];
const reais = (n: number) => n.toFixed(2).replace(".", ",");

// o preço "cai" de um valor maior até o preço da oferta, e o selo de desconto aparece no fim
function PrecoQueCai({ final, unit, run, delay }: { final: number; unit: string; run: boolean; delay: number }) {
  const de = Math.round(final * 1.3 * 10) / 10 - 0.01;
  const desconto = Math.round((1 - final / de) * 100);
  const valor = useMotionValue(run ? de : final);
  const inteiro = useTransform(valor, (v) => reais(v).split(",")[0]);
  const centavos = useTransform(valor, (v) => reais(v).split(",")[1]);
  const [pronto, setPronto] = useState(!run);
  useEffect(() => {
    if (!run) return;
    const c = animate(valor, final, { delay, duration: 1.2, ease: [0.22, 1, 0.36, 1], onComplete: () => setPronto(true) });
    return () => c.stop();
  }, [run, final, delay, valor]);
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="inline-flex items-start gap-0.5 rounded-xl bg-[#ffcf3a] px-2.5 py-1 font-display font-extrabold leading-none text-[#b8240f] shadow-[0_3px_0_#c99a00] tabular-nums">
        <span className="mt-0.5 text-xs">R$</span>
        <motion.span className="text-3xl">{inteiro}</motion.span>
        <span className="flex flex-col text-sm">
          <span>
            ,<motion.span>{centavos}</motion.span>
          </span>
          {unit && <span className="text-[10px] opacity-80">/{unit}</span>}
        </span>
      </span>
      <motion.span
        className="rounded-full bg-[#b8240f] px-2 py-1 text-[11px] font-extrabold text-white"
        initial={false}
        animate={pronto ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 14 }}
      >
        -{desconto}%
      </motion.span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const [enviado, setEnviado] = useState(false);
  // a cada ciclo os preços caem de novo, para a vitrine nunca ficar parada
  const [ciclo, setCiclo] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setCiclo((c) => c + 1), 9000);
    return () => clearInterval(id);
  }, [reduce]);

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

  async function enviarLink(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/redefinir-senha` });
      if (error) {
        setErro(error.status === 429 ? "Muitos pedidos seguidos. Espere alguns minutos e tente de novo." : "Não consegui enviar o link agora. Tente de novo em instantes.");
        return;
      }
      setEnviado(true);
    } catch {
      setErro("Sem conexão agora. Confira a internet e tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col justify-between gap-10 px-5 py-8 sm:px-10 lg:py-12">
        <PromiaLogo className="h-14" />
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-4xl font-extrabold leading-[1.02] sm:text-5xl">A inteligência artificial do seu mercado.</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--ink-2)] sm:text-lg">Crie tabloides estratégicos, organize promoções, gerencie preços e ofertas com a IA que conhece sua região e sua prateleira.</p>
          {recuperar ? (
            <form onSubmit={enviarLink} className="vidro mt-8 space-y-4 rounded-[26px] p-6">
              <div>
                <h2 className="text-lg font-bold">Criar uma senha nova</h2>
                <p className="mt-1 text-sm text-[var(--ink-2)]">Digite o e-mail da conta. Enviamos um link para você escolher a senha nova.</p>
              </div>
              {enviado ? (
                <p className="rounded-2xl bg-[var(--folha-soft)] p-4 text-sm" role="status">
                  Se esse e-mail tem conta no Promia, o link já está a caminho. Olhe também o spam. Ele vale por pouco tempo.
                </p>
              ) : (
                <>
                  <Field label="Email" htmlFor="email-recuperar">
                    <Input id="email-recuperar" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  {erro && (
                    <p className="text-sm text-[var(--perigo)]" role="alert">
                      {erro}
                    </p>
                  )}
                  <Button type="submit" size="lg" className="w-full" loading={carregando}>
                    Enviar link
                  </Button>
                </>
              )}
              <button type="button" onClick={() => { setRecuperar(false); setEnviado(false); setErro(""); }} className="h-11 w-full text-sm font-semibold text-[var(--ink-2)] hover:text-[var(--ink)]">
                Voltar para o login
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="vidro mt-8 space-y-4 rounded-[26px] p-6">
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Senha" htmlFor="senha">
              <div className="relative">
                <Input id="senha" type={ver ? "text" : "password"} autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} className="pr-11" />
                <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-1.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-[var(--ink-3)] hover:bg-[var(--line)]" aria-label={ver ? "Esconder senha" : "Mostrar senha"}>
                  {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            <button type="button" onClick={() => { setRecuperar(true); setEnviado(false); setErro(""); }} className="-mt-1 h-9 text-sm font-semibold text-[var(--folha)] underline-offset-2 hover:underline">
              Esqueci a senha
            </button>
            {erro && (
              <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} className="text-sm text-[var(--perigo)]" role="alert">
                {erro}
              </motion.p>
            )}
            <Button type="submit" size="lg" className="w-full" loading={carregando}>
              Entrar
            </Button>
          </form>
          )}
        </div>
        <p className="text-xs text-[var(--ink-3)]">Não consegue entrar? Fale com o time Promia pelo WhatsApp.</p>
      </section>

      <section className="relative hidden overflow-hidden lg:block" aria-hidden>
        <div className="absolute inset-6 flex flex-col overflow-hidden rounded-[36px] bg-[linear-gradient(160deg,#ef4127_0%,#d4321b_55%,#9d1f0d_100%)] px-10 pb-10 pt-10 shadow-[0_40px_80px_-40px_rgba(157,31,13,0.8)]">
          {/* raios girando devagar e uma luz que cruza o painel de tempos em tempos */}
          <div className="vitrine-raios pointer-events-none absolute -inset-[60%] opacity-25 [background:repeating-conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.35)_0deg_6deg,transparent_6deg_18deg)]" />
          <div className="vitrine-luz pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="relative grid min-h-0 flex-1 auto-rows-min grid-cols-2 content-start gap-x-8 gap-y-6 overflow-hidden">
            {TAGS.map((t) => (
              <motion.div
                key={t.name}
                className={`w-full max-w-[15rem] justify-self-center ${t.col === 1 ? "col-start-2" : "col-start-1"}`}
                style={{ marginTop: t.off }}
                initial={reduce ? false : { opacity: 0, y: 36, rotate: 0, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, rotate: t.rot, scale: 1 }}
                transition={reduce ? { duration: 0 } : { delay: t.delay, type: "spring", stiffness: 150, damping: 16 }}
              >
                <div className="vitrine-flutua rounded-2xl bg-white p-3 shadow-[0_24px_40px_-20px_rgba(0,0,0,0.55)]" style={{ ["--dur" as string]: `${t.flutua}s`, ["--atraso" as string]: `${t.delay}s` }}>
                  <p className="text-sm font-semibold text-[#1d2420]">{t.name}</p>
                  <PrecoQueCai key={ciclo} final={t.price} unit={t.unit} run={!reduce} delay={t.delay + 0.5} />
                </div>
              </motion.div>
            ))}
          </div>
          <p className="relative mt-6 font-display text-[clamp(2.4rem,4.4vw,5rem)] font-extrabold leading-[0.92] text-white/95">
            {PALAVRAS.map((w, i) => (
              <span key={w.t} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className={`block ${w.cor}`}
                  initial={reduce ? false : { y: "105%" }}
                  animate={{ y: 0 }}
                  transition={reduce ? { duration: 0 } : { delay: 0.9 + i * 0.14, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {w.t}
                </motion.span>
              </span>
            ))}
          </p>
        </div>
      </section>
    </main>
  );
}
