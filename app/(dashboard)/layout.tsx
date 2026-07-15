import { Sidebar } from "@/components/drive/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ExpiryChecker } from "@/components/drive/expiry-checker";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* pt-14 on mobile for top bar, pb-16 for bottom nav */}
      <main className="flex-1 overflow-auto pt-14 pb-16 md:pt-0 md:pb-0">
        {children}
      </main>
      <Toaster richColors position="top-center" />
      <ExpiryChecker />
    </div>
  );
}
