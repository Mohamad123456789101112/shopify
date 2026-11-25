import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/Shell";
import { Overview } from "@/components/dashboard/Overview";

export const metadata: Metadata = { title: "Explore the dashboard · BLY Demo", robots: { index: false, follow: false } };
export default function DemoPage() {
  const products = [
    { name: "Everyday linen shirt", sold: 42, price: "890", image: "/demo/linen.svg" },
    { name: "The essential tote", sold: 31, price: "1250", image: "/demo/tote.svg" },
    { name: "Classic cotton tee", sold: 24, price: "450", image: "/demo/tee.svg" },
  ];
  return <DashboardShell name="Atelier Studio" storeSlug="atelier-studio" plan="growth" unread={0} notifications={[]} isOwner={false} demo>
    <Overview name="Alex Morgan" slug="atelier-studio" plan="growth" suspended={false} suspendedReason={null} demo publishedAt="2026-11-01" days={30}
      kpis={{ revenue30: 48250, revenue_prev: 38600, orders30: 124, orders_prev: 108, customers: 89, orders_total: 236 }}
      chart={[420,680,520,1150,790,900,750,1430,1100,1620,1280,1700,1480,2280].map((value,i) => ({label:`Nov ${i+12}`,value}))}
      top={products} low={[{id:"sample",name:"Everyday linen shirt",stock:2}]} productCount={28} currency="EGP"
      recent={[
        {id:1,tracking_code:"AT-1048",customer:{name:"Nour Ahmed"},status:"Processing",total:"1780"},
        {id:2,tracking_code:"AT-1047",customer:{name:"Omar Hassan"},status:"Delivered",total:"1250"},
        {id:3,tracking_code:"AT-1046",customer:{name:"Salma Ali"},status:"New",total:"890"},
        {id:4,tracking_code:"AT-1045",customer:{name:"Youssef Adel"},status:"Shipped",total:"450"},
      ]}
    />
  </DashboardShell>;
}
