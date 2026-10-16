import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Giriş Yap | ThisOrThat",
  description: "ThisOrThat hesabına giriş yap.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tekrar Hoş Geldin</h1>
        <p className="mt-1 text-sm text-gray-500">Oy vermek ve anket oluşturmak için giriş yap</p>
      </div>

      <AuthForm mode="login" />
    </div>
  );
}
