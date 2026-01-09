"use client";

import { useEffect, useState } from "react";

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
    return <p className="p-6 text-gray-600">Running Apriori…</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold">Apriori Analysis</h1>

      {/* ================= Frequent Itemsets ================= */}
      <section>
        <h2 className="text-xl font-semibold mb-3">
          Frequent Itemsets
        </h2>

        {itemsets.length === 0 ? (
          <p className="text-gray-500">No frequent itemsets found.</p>
        ) : (
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Items</th>
                <th className="p-2 border">Support (%)</th>
              </tr>
            </thead>
            <tbody>
              {itemsets.map((set, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-2 border">
                    {set.items.join(", ")}
                  </td>
                  <td className="p-2 border text-center">
                    {(set.support * 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ================= Association Rules ================= */}
      <section>
        <h2 className="text-xl font-semibold mb-3">
          Association Rules
        </h2>

        {rules.length === 0 ? (
          <p className="text-gray-500">No association rules found.</p>
        ) : (
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Rule</th>
                <th className="p-2 border">Confidence (%)</th>
                <th className="p-2 border">Lift</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-2 border">
                    {rule.lhs.join(", ")} → {rule.rhs.join(", ")}
                  </td>
                  <td className="p-2 border text-center">
                    {(rule.confidence * 100).toFixed(2)}
                  </td>
                  <td className="p-2 border text-center">
                    {rule.lift.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
