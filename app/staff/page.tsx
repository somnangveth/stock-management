"use client";
import Link from "next/link";
import { Package, DollarSign, ShoppingCart, Truck, TrendingUp, AlertTriangle, Users, BarChart3 } from "lucide-react";
import TotalUsersCatalog from "../components/catalog/totaluserscatalog";
import TotalAll from "../components/catalog/totalall";
import TotalStockPanel from "../components/chart/totalstock";
import ProfileWelcome from "../components/profile/profilewelcome";
import ExpiryStockPanel from "../components/chart/expirystock";
import AlertExpiredPanel from "../components/notifications/alertexpiredpanel";
import SaleChart from "../components/catalog/salechart";

export default function AdminPage() {
  const panelStyle = 'group relative flex-1 border-2 border-amber-500/20 bg-gradient-to-br from-amber-600 to-amber-700 text-white font-semibold rounded-2xl shadow-md hover:shadow-2xl hover:scale-[1.02] hover:border-amber-400/40 transition-all duration-300 p-6 overflow-hidden';
  
  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* 欢迎区域 */}
      <ProfileWelcome />
      
     <div className="flex h-28 gap-4">
        <div className={panelStyle}>
          <Link href="/admin/products" className="text-lg hover:text-amber-100 transition-colors flex flex-col items-center gap-2">
            <Package size={32} />
            Inventory
          </Link>
        </div>
        <div className={panelStyle}>
          <Link href="/staff/price" className="text-lg hover:text-amber-100 transition-colors flex flex-col items-center gap-2">
            <DollarSign size={32} />
            Price Management
          </Link>
        </div>
        <div className={panelStyle}>
          <Link href="/staff/salesb2c" className="text-lg hover:text-amber-100 transition-colors flex flex-col items-center gap-2">
            <ShoppingCart size={32} />
            Sales Management
          </Link>
        </div>
      </div>

      
      {/* 统计卡片行 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="shadow-md rounded-lg overflow-hidden">
          <TotalStockPanel />
        </div>
        <div className="shadow-md rounded-lg overflow-hidden">
          <ExpiryStockPanel />
        </div>
      </div>
      
      {/* 下方内容区 */}
      <div className="grid grid-cols-2 gap-4">

        {/* 中间占位符 */}
        <div className="shadow-md rounded-lg overflow-hidden">
          <SaleChart />
        </div>

        {/* 右侧过期提醒 */}
        <div className="bg-white border-2 border-slate-200 shadow-md rounded-lg overflow-hidden flex flex-col h-96">
          {/* 标题栏 */}
          <div className="h-14 border-b-2 border-amber-600 bg-white flex items-center px-6">
            <h3 className="text-slate-800 font-bold text-base flex items-center gap-2">
              <div className="w-1 h-6 bg-amber-600 rounded-full"></div>
              Product Expiry Alerts
            </h3>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-amber-400 scrollbar-track-gray-100">
            <AlertExpiredPanel />
          </div>
        </div>
      </div>
    </div>
  );
}