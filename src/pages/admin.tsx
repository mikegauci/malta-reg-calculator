"use client";

import { supabase } from "../lib/supabase";
import React, { useEffect, useState } from "react";
import "../app/globals.css";

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
    manufacturer: string;
    model: string;
    year: number;
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

    // Real-time subscription to new entries
    const channel = supabase
      .channel("public:submissions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        (payload) => {
          const newEntry: Entry = payload.new as Entry;
          setEntries((prev) => [newEntry, ...prev]);
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Entry Database</h1>
        {loading ? (
          <p className="text-center text-gray-300">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-gray-300">No submissions available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-700 text-left">
              <thead>
                <tr className="bg-gray-700">
                  <th className="border border-gray-600 p-2">Manufacturer</th>
                  <th className="border border-gray-600 p-2">Model</th>
                  <th className="border border-gray-600 p-2">Year</th>
                  <th className="border border-gray-600 p-2">CO2 Emissions</th>
                  <th className="border border-gray-600 p-2">RV</th>
                  <th className="border border-gray-600 p-2">Length (MM)</th>
                  <th className="border border-gray-600 p-2">Euro Standard</th>
                  <th className="border border-gray-600 p-2">Vehicle Type</th>
                  <th className="border border-gray-600 p-2">Total Tax (€)</th>
                  <th className="border border-gray-600 p-2">Classic Tax (€)</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={index % 2 === 0 ? "bg-gray-800" : "bg-gray-700"}
                  >
                    <td className="border border-gray-600 p-2">
                      {entry.manufacturer}
                    </td>
                    <td className="border border-gray-600 p-2">{entry.model}</td>
                    <td className="border border-gray-600 p-2">{entry.year}</td>
                    <td className="border border-gray-600 p-2">
                      {entry.co2_emissions}
                    </td>
                    <td className="border border-gray-600 p-2">{entry.rv}</td>
                    <td className="border border-gray-600 p-2">{entry.length}</td>
                    <td className="border border-gray-600 p-2">
                      {entry.euro_standard}
                    </td>
                    <td className="border border-gray-600 p-2 capitalize">
                      {entry.vehicle_type}
                    </td>
                    <td className="border border-gray-600 p-2">
                      {entry.total_tax.toFixed(2)}
                    </td>
                    <td className="border border-gray-600 p-2">
                      {entry.classic_car_tax.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
