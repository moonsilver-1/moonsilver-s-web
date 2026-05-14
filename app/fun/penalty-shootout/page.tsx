import type { Metadata } from "next";
import { PenaltyShootoutClient } from "./penalty-shootout-client";

export const metadata: Metadata = {
  title: "Penalty Shootout / 点球大战",
  description: "A penalty shootout mini game embedded in the Fun section.",
};

export default function PenaltyShootoutPage() {
  return <PenaltyShootoutClient />;
}
