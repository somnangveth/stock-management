import { redirect } from "next/navigation";
import { checkUserRole } from "@/lib/auth/roles";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { AppSideBar } from "../components/sidebar/adminnavlink";


export default async function AdminLayout({ 
  children,
}: { 
  children: React.ReactNode,
}) {

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  const {authorized, user} = await checkUserRole(['admin']);

  if(!authorized){
    redirect('/auth');
  }
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSideBar />
      <SidebarInset>
        <main className="flex-1 p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
