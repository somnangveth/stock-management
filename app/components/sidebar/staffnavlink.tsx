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
import { PermissionGate } from "../permission/permissiongate";

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
        permission: ["product.view", "category.view"],
      },
      {
        title: "Categories",
        url: "/staff/categories",
        icon: BsFillDiagram3Fill,
        permission: ["category.view"]
      },
      {
        title: "Stock",
        url: "/admin/stock",
        icon: FaCubesStacked,
        permission: ["stock.view"]
      }
    ]
  },
  {
    title: "Price",
    url: "/admin/price",
    icon: FaDollarSign,
    permission: ["price.view"]
  },
  {
    title: "Sales",
    url: "/admin/sales",
    icon: FaChartBar,
    subitems: [
      {
        title: "General Customer",
        url: "/admin/salesb2c",
        icon: FaReceipt,
        permission: ["sale.view"]
      },
      {
        title: "Dealer",
        url: "/admin/salesb2b",
        icon: FaDesktop,
        permission: ["sale.view"]
      }
    ]
  },
  {
    title: "Supplier Management",
    url: "/admin/vendors",
    icon: FaUsersLine,
    permission: ["vendor.view"]
  }
];

export function StaffSideBar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Staff Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                // For items with subitems, collect all subitem permissions
                const subitemPermissions = item.subitems
                  ?.flatMap(sub => Array.isArray(sub.permission) ? sub.permission : (sub.permission ? [sub.permission] : []))
                  .filter(Boolean) || [];
                
                // Use item's own permission or all subitem permissions
                const itemPermission = item.permission || (subitemPermissions.length > 0 ? subitemPermissions : []);
                
                return (
                  <PermissionGate
                    key={item.title}
                    permission={itemPermission}
                    fallback={<></>}
                  >
                    <Collapsible
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
                                  <PermissionGate
                                    key={subitem.title}
                                    permission={subitem.permission || []}
                                    fallback={<></>}
                                  >
                                    <SidebarMenuSubItem>
                                      <SidebarMenuSubButton asChild>
                                        <Link href={subitem.url}>
                                          <subitem.icon />
                                          <span>{subitem.title}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  </PermissionGate>
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
                  </PermissionGate>
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