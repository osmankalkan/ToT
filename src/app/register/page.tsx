import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Kayıt Ol | ThisOrThat",
  description: "ThisOrThat hesabı oluştur.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hesap Oluştur</h1>
        <p className="mt-1 text-sm text-gray-500">Kararsız kaldığın soruları sormak ve oy kullanmak için katıl</p>
      </div>

      <AuthForm mode="register" />
    </div>
  );
}
