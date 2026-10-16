"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface AuthFormProps {
  mode: "login" | "register";
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {mode === "register" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              checkUsernameAvailability(e.target.value);
            }}
            placeholder="ornek_kullanici"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="mt-1 text-xs">
            {usernameStatus === "checking" && <span className="text-gray-500">Müsaitlik kontrol ediliyor...</span>}
            {usernameStatus === "available" && <span className="text-green-600 font-medium">Bu kullanıcı adı müsait ✓</span>}
            {usernameStatus === "taken" && <span className="text-red-600 font-medium">Bu kullanıcı adı zaten alınmış ✗</span>}
            {usernameStatus === "invalid" && <span className="text-amber-600">3-20 karakter, sadece harf, rakam ve alt çizgi.</span>}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">E-posta</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="eposta@ornek.com"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Şifre</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={8}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {mode === "register" && <p className="mt-1 text-xs text-gray-500">En az 8 karakter</p>}
      </div>

      <button
        type="submit"
        disabled={submitting || (mode === "register" && (usernameStatus === "taken" || usernameStatus === "invalid"))}
        className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : mode === "login" ? (
          "Giriş Yap"
        ) : (
          "Kayıt Ol"
        )}
      </button>

      <div className="pt-2 text-center text-sm text-gray-600">
        {mode === "login" ? (
          <p>
            Hesabın yok mu?{" "}
            <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
              Kayıt Ol
            </Link>
          </p>
        ) : (
          <p>
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
              Giriş Yap
            </Link>
          </p>
        )}
      </div>
    </form>
  );
}
