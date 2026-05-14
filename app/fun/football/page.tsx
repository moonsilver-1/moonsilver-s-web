import type { Metadata } from "next";
import { FootballWidgetPage } from "@/app/fun/football/football-widget-page";

export const metadata: Metadata = {
  title: "Football / 足球数据站",
  description: "A research dashboard for major football competitions over the last 20 years.",
};

export default function FootballPage() {
  return <FootballWidgetPage />;
}
