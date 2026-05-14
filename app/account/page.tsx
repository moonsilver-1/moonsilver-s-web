import type { Metadata } from "next";
import { AccountClient } from "@/app/account/account-client";

export const metadata: Metadata = {
  title: "Account",
  description: "Account status and admin approval.",
};

export default function AccountPage() {
  return <AccountClient mode="dashboard" />;
}
