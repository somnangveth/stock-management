import { LuLayoutGrid } from "react-icons/lu";
import { FaArchive, FaDollarSign, FaChartBar, FaUsers, FaReceipt } from "react-icons/fa";
import { FaCubesStacked, FaArrowRightFromBracket, FaUsersLine, FaBoxesStacked, FaDesktop } from "react-icons/fa6";
import { BsFillDiagram3Fill } from "react-icons/bs";
import { ChevronRight, ChevronUp, User2 } from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarHeader
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SignOut from "@/app/auth/components/signout";
import { SidebarTrigger } from "@/components/ui/sidebar";

// Menu items
const items = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LuLayoutGrid,
  },
  {
    title: "Inventory",
    url: "/admin/products",
    icon: FaArchive,
    subitems: [
      {
        title: "Products",
        url: "/admin/products",
        icon: FaBoxesStacked,
      },
      {
        title: "Categories",
        url: "/admin/categories",
        icon: BsFillDiagram3Fill
      }
    ]
  },
  {
    title: "Stock Management",
    url: "/admin/stock",
    icon: FaCubesStacked,
  },
  {
    title: "Price Management",
    url: "/admin/price",
    icon: FaDollarSign,
  },
  {
    title: "Sales Management",
    url: "/admin/sales",
    icon: FaChartBar,
    subitems: [
      {
        title: "General Customer",
        url: "/admin/salesb2c",
        icon: FaReceipt
      },
      {
        title: "Dealer",
        url: "/admin/salesb2b",
        icon: FaDesktop
      }
    ]
  },
  {
    title: "Users Management",
    url: "/admin/user",
    icon: FaUsers
  },
  {
    title: "Supplier Management",
    url: "/admin/vendors",
    icon: FaUsersLine
  }
];

export function AppSideBar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <span className="font-semibold">Admin Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={false}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    {item.subitems ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            <item.icon />
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subitems.map((subitem) => (
                              <SidebarMenuSubItem key={subitem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={subitem.url}>
                                    <subitem.icon />
                                    <span>{subitem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : (
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 />
                  Username
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span className="flex items-center gap-2">
                    <FaArrowRightFromBracket />
                    <SignOut />
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}