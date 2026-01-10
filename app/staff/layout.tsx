import { checkUserRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { StaffSideBar } from "../components/sidebar/staffnavlink";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authorized, user } = await checkUserRole(['staff', 'admin']);
  
  if (!authorized) {
    redirect('/auth');
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StaffSideBar />
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-background p-4">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}