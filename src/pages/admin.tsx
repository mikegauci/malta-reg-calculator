import { supabase } from "../lib/supabase";
import React, { useEffect, useState } from "react";

const AdminPage = () => {
  interface Entry {
    id: number;
    co2_emissions: number;
    rv: number;
    length: number;
    euro_standard: string;
    vehicle_type: string;
    total_tax: number;
    classic_car_tax: number;
  }

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const { data, error } = await supabase.from("submissions").select("*");
        if (error) throw error;
        setEntries(data || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || "Failed to fetch entries");
        } else {
          setError("Failed to fetch entries");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="w-full border-collapse border border-gray-700">
          <thead>
            <tr>
              <th className="border border-gray-700 p-2">CO2 Emissions</th>
              <th className="border border-gray-700 p-2">RV</th>
              <th className="border border-gray-700 p-2">Length</th>
              <th className="border border-gray-700 p-2">Euro Standard</th>
              <th className="border border-gray-700 p-2">Vehicle Type</th>
              <th className="border border-gray-700 p-2">Total Tax (€)</th>
              <th className="border border-gray-700 p-2">Classic Tax (€)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="border border-gray-700 p-2">{entry.co2_emissions}</td>
                <td className="border border-gray-700 p-2">{entry.rv}</td>
                <td className="border border-gray-700 p-2">{entry.length}</td>
                <td className="border border-gray-700 p-2">{entry.euro_standard}</td>
                <td className="border border-gray-700 p-2">{entry.vehicle_type}</td>
                <td className="border border-gray-700 p-2">{entry.total_tax.toFixed(2)}</td>
                <td className="border border-gray-700 p-2">{entry.classic_car_tax.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPage;
