"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui";
import { PromiaLogo } from "@/components/shell/logo";

type Estado = "verificando" | "pronto" | "invalido";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const supabase = useRef(createClient());
  const [estado, setEstado] = useState<Estado>("verificando");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // o link do e-mail traz um código na URL; o cliente do Supabase troca por uma sessão de recuperação
  useEffect(() => {
    const sb = supabase.current;
    const { data } = sb.auth.onAuthStateChange((evento, sessao) => {
      if (evento === "PASSWORD_RECOVERY" || (evento === "SIGNED_IN" && sessao)) setEstado("pronto");
    });
    const t = setTimeout(async () => {
      const { data: s } = await sb.auth.getSession();
      setEstado((e) => (e === "verificando" ? (s.session ? "pronto" : "invalido") : e));
    }, 2500);
    return () => {
      data.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha.length < 8) return setErro("Use pelo menos 8 caracteres.");
    if (senha !== confirma) return setErro("As duas senhas precisam ser iguais.");
    setSalvando(true);
    try {
      const { error } = await supabase.current.auth.updateUser({ password: senha });
      if (error) {
        setErro(/same|different/i.test(error.message) ? "Escolha uma senha diferente da anterior." : "Não consegui salvar a senha. Peça um link novo e tente de novo.");
        setSalvando(false);
        return;
      }
    } catch {
      setErro("Sem conexão agora. Confira a internet e tente de novo.");
      setSalvando(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        <PromiaLogo className="mx-auto h-14" />
        <div className="vidro space-y-4 rounded-[26px] p-6">
          <h1 className="text-2xl font-extrabold">Escolha a sua senha nova</h1>
          {estado === "verificando" && <p className="text-[var(--ink-2)]" role="status">Conferindo o link...</p>}
          {estado === "invalido" && (
            <div className="space-y-4">
              <p className="text-[var(--ink-2)]" role="alert">Este link venceu ou já foi usado. Peça um link novo na tela de login.</p>
              <Link href="/login" className="inline-flex h-11 items-center rounded-full bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--bg)]">
                Voltar para o login
              </Link>
            </div>
          )}
          {estado === "pronto" && (
            <form onSubmit={salvar} className="space-y-4">
              <Field label="Senha nova" htmlFor="nova" hint="Pelo menos 8 caracteres">
                <Input id="nova" type="password" autoComplete="new-password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} />
              </Field>
              <Field label="Repita a senha" htmlFor="confirma">
                <Input id="confirma" type="password" autoComplete="new-password" required value={confirma} onChange={(e) => setConfirma(e.target.value)} />
              </Field>
              {erro && <p className="text-sm text-[var(--perigo)]" role="alert">{erro}</p>}
              <Button type="submit" size="lg" className="w-full" loading={salvando}>
                Salvar e entrar
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
