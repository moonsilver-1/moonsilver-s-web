import type { Metadata } from "next";
import { OracleClient } from "@/app/fun/oracle/oracle-client";

export const metadata: Metadata = {
  title: "\u77e5\u6653\u4e00\u5207\u4e4b\u4eba",
  description: "\u8ba9\u6211\u731c\u731c\u4f60\u5fc3\u91cc\u60f3\u7684\u662f\u4ec0\u4e48\u5927\u5b66\u3002",
};

export default function OraclePage() {
  return <OracleClient />;
}
