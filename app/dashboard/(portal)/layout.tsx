import "leaflet/dist/leaflet.css";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

// Authenticated portal layout: persistent sidebar + top bar around every page.
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
