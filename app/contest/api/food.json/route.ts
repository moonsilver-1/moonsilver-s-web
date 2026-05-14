import { NextResponse } from "next/server";
import { pickRandomItem, PRODUCT_ENDPOINTS } from "@/app/contest/product-json-site-data";

export function GET() {
  const data = PRODUCT_ENDPOINTS[0];
  return NextResponse.json({
    code: 200,
    result: pickRandomItem(data.items),
  });
}
