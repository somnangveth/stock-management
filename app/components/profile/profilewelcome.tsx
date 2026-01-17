'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, Plus } from 'lucide-react';
import { getLoggedInUser } from '@/app/auth/actions';
import { createSupabaseBrowserClient } from '@/lib/storage/browser';
import { fetchSalesStats } from '@/app/functions/admin/api/controller';

export default function ProfileWelcome() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    monthProfit: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    const res = await getLoggedInUser();
    setProfile(res);
    setLoading(false);
  };

  const loadSalesStats = async () => {
    try {
      setStatsLoading(true);
      const salesStats = await fetchSalesStats();
      setStats({
        todaySales: salesStats.todaySales,
        monthProfit: salesStats.monthProfit,
      });
    } catch (error) {
      console.error('Failed to fetch sales stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    loadSalesStats();

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel('sales-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sale',
        },
        (payload) => {
          console.log('Sale updated:', payload);
          loadSalesStats();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-yellow-200 via-amber-400 to-amber-600 rounded-3xl p-8 shadow-lg flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-white/30 border-t-white"></div>
          <p className="text-white font-semibold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-gradient-to-r from-yellow-200 via-amber-400 to-amber-600 rounded-3xl p-8 shadow-lg flex items-center justify-center min-h-[200px]">
        <p className="text-white font-semibold text-lg">Please check the login information</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-xl">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-amber-500 to-amber-700"></div>

      {/* Decorative light effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-300/15 rounded-full -mr-64 -mt-64 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-700/20 rounded-full -ml-48 -mb-48 blur-3xl"></div>
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>

      {/* Content area */}
      <div className="relative z-10 px-8 py-10">
        <div className="flex items-start justify-between gap-8">
          {/* Left side */}
          <div className="flex-1">
            {/* Welcome section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-amber-900">
                  Welcome Back!
                </h1>
                <span className="text-4xl">👋</span>
              </div>
              <p className="text-amber-700 font-semibold text-lg">
                {profile?.name || 'User'}
              </p>
              <p className="text-amber-600 text-sm mt-2">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>
            </div>


            {/* Stats cards */}
            <div className="flex gap-6">
              {/* Today's Sales */}
              <div className="group relative overflow-hidden rounded-2xl bg-white/25 backdrop-blur-lg border border-white/40 px-8 py-6 min-w-fit shadow-lg hover:shadow-xl hover:bg-white/30 transition-all duration-300 cursor-default">
                <div className="relative z-10">
                  <div className="text-amber-700 font-semibold text-sm mb-2 uppercase tracking-wider">
                    Today Sales
                  </div>
                  <div className="text-4xl font-black text-white drop-shadow-lg">
                    {statsLoading ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : (
                      `$${stats.todaySales.toLocaleString()}`
                    )}
                  </div>
                </div>
                {/* Background light effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Monthly Sales */}
              <div className="group relative overflow-hidden rounded-2xl bg-white/25 backdrop-blur-lg border border-white/40 px-8 py-6 min-w-fit shadow-lg hover:shadow-xl hover:bg-white/30 transition-all duration-300 cursor-default">
                <div className="relative z-10">
                  <div className="text-amber-700 font-semibold text-sm mb-2 uppercase tracking-wider">
                    Month Sale
                  </div>
                  <div className="text-4xl font-black text-white drop-shadow-lg">
                    {statsLoading ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : (
                      `$${stats.monthProfit.toLocaleString()}`
                    )}
                  </div>
                </div>
                {/* Background light effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex gap-4 items-start">
          </div>
        </div>
      </div>
    </div>
  );
}