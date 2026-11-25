import { isDatabaseConfigured } from "@/db";
import { AuthForm } from "@/components/auth/AuthForm";
export const dynamic = "force-dynamic";
export default function Page() {
  return <AuthForm mode="forgot" databaseAvailable={isDatabaseConfigured()} />;
}
