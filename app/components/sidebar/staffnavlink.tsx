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
  SidebarFooter
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SignOut from "@/app/auth/components/signout";

// Menu items
const items = [
  {
    title: "Dashboard",
    url: "/staff",
    icon: LuLayoutGrid,
  },
  {
    title: "Inventory",
    url: "/staff/products",
    icon: FaArchive,
    subitems: [
      {
        title: "Products",
        url: "/staff/products",
        icon: FaBoxesStacked,
      },
      {
        title: "Categories",
        url: "/staff/categories",
        icon: BsFillDiagram3Fill,
      },
      {
        title: "Attribute",
        url: "/staff/attribute",
        icon: BsFillDiagram3Fill,
      }
    ]
  },
  {
    title: "Stock",
    url: "/staff/stock",
    icon: FaCubesStacked,
  },
  {
    title: "Sales",
    url: "/staff/salesb2c",
    icon: FaChartBar,
  },
];

export function StaffSideBar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-bold">Staff Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                return (
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
                );
              })}
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
                  <User2 />Username
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span className="flex items-center">
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