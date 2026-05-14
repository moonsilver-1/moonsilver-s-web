import type { Metadata } from "next";
import { AccountClient } from "@/app/account/account-client";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your moonsilver account.",
};

export default function LoginPage() {
  return <AccountClient mode="login" />;
}
