import { Sidebar } from "@/components/drive/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ExpiryChecker } from "@/components/drive/expiry-checker";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
      <Toaster richColors />
      <ExpiryChecker />
    </div>
  );
}
