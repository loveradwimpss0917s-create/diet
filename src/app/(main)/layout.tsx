import { BottomNav } from "@/components/ui/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
