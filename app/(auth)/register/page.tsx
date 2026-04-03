import { redirectIfAuthenticated } from "@/lib/auth/server";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  await redirectIfAuthenticated("/dashboard");

  return <RegisterForm />;
}

