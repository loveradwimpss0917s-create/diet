import { BottomNav } from "@/components/ui/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <main className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-4 pt-6 pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
