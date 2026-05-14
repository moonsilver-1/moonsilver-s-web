import type { Metadata } from "next";
import { AccountClient } from "@/app/account/account-client";

export const metadata: Metadata = {
  title: "Request Access",
  description: "Request a moonsilver account.",
};

export default function RegisterPage() {
  return <AccountClient mode="register" />;
}
