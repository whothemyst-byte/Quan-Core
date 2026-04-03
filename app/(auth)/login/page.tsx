import { redirectIfAuthenticated } from "@/lib/auth/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default async function LoginPage() {
  await redirectIfAuthenticated("/dashboard");

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

