"use client";

import Link from "next/link";
import { Package, DollarSign, ShoppingCart, Truck } from "lucide-react";
import ProfileWelcome from "../components/profile/profilewelcome";
import SaleChart from "../components/catalog/salechart";
import AlertExpiredPanel from "../components/notifications/alertexpiredpanel";
import TotalStockPanel from "../components/chart/totalstock";
import AverageSalesPanel from "../components/chart/saleproductpanel";
import ExpiryStockPanel from "../components/chart/expirystock";
// 导入新的模块化组件



export default function staffPage() {
  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header with Welcome */}
      <div className="border-b border-amber-50 bg-gradient-to-r from-yellow-50 to-white">
        <div className="max-w-full mx-auto px-6 py-6">
          <ProfileWelcome />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-6 py-8">
        {/* Quick Navigation - Horizontal */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <Link href="/admin/products">
            <div className="shrink-0 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full hover:bg-amber-100 transition-all flex items-center gap-2">
              <Package size={16} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-900 whitespace-nowrap">
                Inventory
              </span>
            </div>
          </Link>
          <Link href="/admin/price">
            <div className="shrink-0 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-all flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900 whitespace-nowrap">
                Pricing
              </span>
            </div>
          </Link>
          <Link href="/admin/sales">
            <div className="flex-shrink-0 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-all flex items-center gap-2">
              <ShoppingCart size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-900 whitespace-nowrap">
                Sales
              </span>
            </div>
          </Link>
          <Link href="/admin/vendors">
            <div className="flex-shrink-0 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full hover:bg-orange-100 transition-all flex items-center gap-2">
              <Truck size={16} className="text-orange-600" />
              <span className="text-sm font-medium text-orange-900 whitespace-nowrap">
                Suppliers
              </span>
            </div>
          </Link>
        </div>

        {/* Stats Row - 3 Cards (改用新组件) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Average Sales Card */}
          <AverageSalesPanel />

          {/* Expiry Stock Card */}
          <ExpiryStockPanel />

          <TotalStockPanel/>
        </div>

        {/* Bottom Section - Chart and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 hover:shadow-md transition-all">
            <h2 className="text-lg font-semibold text-amber-800 mb-4">
              Sales Trend
            </h2>
            <SaleChart />
          </div>

          {/* Expiry Alerts Table */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 hover:shadow-md transition-all">
            <h2 className="text-lg font-semibold text-amber-800 mb-4">
              Expiring Soon
            </h2>
            <div className="max-h-96 overflow-y-auto">
              <AlertExpiredPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
