"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AlertCircle,
  AtSign,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  X,
} from "lucide-react";

interface AuthFormProps {
  mode: "login" | "register";
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const inputBase =
  "w-full border bg-white py-3 pl-10 pr-10 text-sm text-ink transition-colors placeholder:text-ink/35 focus:outline-none focus:ring-1";

const defaultBorder = "border-line focus:border-ink focus:ring-ink";

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function checkUsernameAvailability(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      setUsernameStatus("idle");
      return;
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", trimmed)
      .maybeSingle();

    if (error) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus(data ? "taken" : "available");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === "register") {
      const trimmedUser = username.trim();
      if (!USERNAME_REGEX.test(trimmedUser)) {
        setErrorMessage("Kullanıcı adı 3-20 karakter uzunluğunda olmalı ve sadece harf, rakam ve alt çizgi içerebilir.");
        return;
      }
      if (password.length < 8) {
        setErrorMessage("Şifre en az 8 karakter olmalıdır.");
        return;
      }

      setSubmitting(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: trimmedUser },
        },
      });

      setSubmitting(false);

      if (error) {
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("unique")) {
          setErrorMessage("Bu e-posta veya kullanıcı adı zaten kullanımda.");
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setSuccessMessage("Kayıt başarılı! Lütfen gelen kutunu kontrol ederek e-posta adresini onayla.");
      }
    } else {
      setSubmitting(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      setSubmitting(false);

      if (error) {
        setErrorMessage(
          error.message.includes("Invalid login credentials")
            ? "E-posta veya şifre hatalı."
            : error.message
        );
        return;
      }

      router.push("/");
      router.refresh();
    }
  }

  const usernameBorder =
    usernameStatus === "taken" || usernameStatus === "invalid"
      ? "border-alert focus:border-alert focus:ring-alert"
      : usernameStatus === "available"
        ? "border-ink focus:border-ink focus:ring-ink"
        : defaultBorder;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 border border-line border-l-2 border-l-alert bg-white p-3 text-xs leading-relaxed text-ink"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alert" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-2.5 border border-line border-l-2 border-l-ink bg-smoke p-3 text-xs leading-relaxed text-ink"
        >
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {mode === "register" && (
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/65"
          >
            Kullanıcı adı
          </label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                checkUsernameAvailability(e.target.value);
              }}
              placeholder="ornek_kullanici"
              className={`${inputBase} ${usernameBorder}`}
            />
            {usernameStatus === "checking" && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink/35" />
            )}
            {usernameStatus === "available" && (
              <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" />
            )}
            {usernameStatus === "taken" && (
              <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-alert" />
            )}
          </div>

          <div className="min-h-4 font-mono text-[9px] tracking-[0.02em]">
            {usernameStatus === "checking" && <span className="text-ink/65">Kontrol ediliyor...</span>}
            {usernameStatus === "available" && <span className="font-semibold text-ink">Müsait</span>}
            {usernameStatus === "taken" && <span className="font-semibold text-alert">Bu kullanıcı adı alınmış</span>}
            {usernameStatus === "invalid" && <span className="text-alert">3-20 karakter; harf, rakam, alt çizgi</span>}
            {usernameStatus === "idle" && <span className="text-ink/65">Toplulukta bu isimle görüneceksin</span>}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/65"
        >
          E-posta
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="eposta@ornek.com"
            className={`${inputBase} ${defaultBorder}`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/65"
        >
          Şifre
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifreni gir"
            minLength={8}
            className={`${inputBase} ${defaultBorder} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-ink/35 transition-colors hover:text-ink"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {mode === "register" && (
          <p className="font-mono text-[9px] text-ink/65">En az 8 karakter</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting || (mode === "register" && (usernameStatus === "taken" || usernameStatus === "invalid"))}
        className="flex w-full items-center justify-center gap-2 bg-ink py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-paper transition-colors hover:bg-signal hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-40"
      >
        {submitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{mode === "login" ? "Giriş yapılıyor" : "Kayıt olunuyor"}</span>
          </>
        ) : mode === "login" ? (
          "Giriş Yap"
        ) : (
          "Kayıt Ol"
        )}
      </button>

      <div className="border-t border-line pt-4 text-center text-xs text-ink/70">
        {mode === "login" ? (
          <p>
            Hesabın yok mu?{" "}
            <Link
              href="/register"
              className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4 transition-colors hover:bg-signal"
            >
              Kayıt ol
            </Link>
          </p>
        ) : (
          <p>
            Zaten hesabın var mı?{" "}
            <Link
              href="/login"
              className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4 transition-colors hover:bg-signal"
            >
              Giriş yap
            </Link>
          </p>
        )}
      </div>
    </form>
  );
}
