"use client";
import { useEffect, useState } from "react";
import { TrendingUp, ShoppingCart, BarChart3, AlertCircle } from "lucide-react";

type Itemset = {
  items: string[];
  support: number;
};

type Rule = {
  lhs: string[];
  rhs: string[];
  confidence: number;
  lift: number;
};

export default function AprioriPage() {
  const [itemsets, setItemsets] = useState<Itemset[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"itemsets" | "rules">("itemsets");

  useEffect(() => {
    fetch("/api/admin/apriori")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch Apriori result");
        return res.json();
      })
      .then(data => {
        setItemsets(data.itemsets ?? []);
        setRules(data.rules ?? []);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Running Apriori Analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Error</h2>
          <p className="text-red-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">Apriori Analysis</h1>
          </div>
          <p className="text-gray-600 ml-11">Discover patterns and associations in your product data</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Frequent Itemsets</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{itemsets.length}</p>
              </div>
              <ShoppingCart className="h-12 w-12 text-indigo-500 opacity-80" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Association Rules</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{rules.length}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setSelectedTab("itemsets")}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  selectedTab === "itemsets"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ShoppingCart className="inline-block h-5 w-5 mr-2 mb-1" />
                Frequent Itemsets
              </button>
              <button
                onClick={() => setSelectedTab("rules")}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  selectedTab === "rules"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <TrendingUp className="inline-block h-5 w-5 mr-2 mb-1" />
                Association Rules
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Frequent Itemsets Tab */}
            {selectedTab === "itemsets" && (
              <div>
                {itemsets.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No frequent itemsets found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                            Support (%)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {itemsets.map((set, i) => (
                          <tr key={i} className="hover:bg-indigo-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-2">
                                {set.items.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center">
                                <div className="relative w-32 h-2 bg-gray-200 rounded-full mr-3">
                                  <div
                                    className="absolute top-0 left-0 h-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                                    style={{ width: `${set.support * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  {(set.support * 100).toFixed(2)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Association Rules Tab */}
            {selectedTab === "rules" && (
              <div>
                {rules.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No association rules found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Rule
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                            Confidence (%)
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                            Lift
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rules.map((rule, i) => (
                          <tr key={i} className="hover:bg-green-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex flex-wrap gap-2">
                                  {rule.lhs.map((item, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-2xl text-gray-400">→</span>
                                <div className="flex flex-wrap gap-2">
                                  {rule.rhs.map((item, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center">
                                <div className="relative w-24 h-2 bg-gray-200 rounded-full mr-3">
                                  <div
                                    className="absolute top-0 left-0 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                    style={{ width: `${rule.confidence * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  {(rule.confidence * 100).toFixed(2)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                  rule.lift > 1
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {rule.lift.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}