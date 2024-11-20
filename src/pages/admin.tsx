"use client";

import { supabase } from "../lib/supabase";
import React, { useEffect, useState } from "react";
import "../app/globals.css";
import Link from "next/link";
import Head from "next/head"; // Import Head for meta tags

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
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Entry; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const { data, error } = await supabase
          .from("submissions")
          .select("*")
          .order("id", { ascending: false }); // Sort by id descending
        if (error) throw error;
        setEntries(data || []);
        setFilteredEntries(data || []); // Initialize filtered entries
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
          setFilteredEntries((prev) => [newEntry, ...prev]); // Add to filtered entries as well
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update filtered entries based on search query
  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = entries.filter((entry) =>
      Object.values(entry)
        .some((value) =>
          value
            .toString()
            .toLowerCase()
            .includes(lowercasedQuery)
        )
    );
    setFilteredEntries(filtered);
  }, [searchQuery, entries]);

  // Apply sorting to filtered entries
  const sortedEntries = React.useMemo(() => {
    if (!sortConfig) return filteredEntries;
    const sorted = [...filteredEntries];
    sorted.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [filteredEntries, sortConfig]);

  const requestSort = (key: keyof Entry) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <>
      <Head>
        <title>Dashboard - Malta Car Registration Tax Calculator</title>
        <meta name="description" content="View and manage submissions for the car tax calculator." />
      </Head>
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-6xl bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-center mb-2">
            <Link href="/" className="text-blue-500 underline">
              Go to Calculator
            </Link>
          </h3>
          <h1 className="text-2xl font-bold text-center mb-6">Admin Dashboard</h1>

          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-300"
            />
          </div>

          {loading ? (
            <p className="text-center text-gray-300">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : sortedEntries.length === 0 ? (
            <p className="text-center text-gray-300">No matching entries found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-700 text-left">
                <thead>
                  <tr className="bg-gray-700">
                    {[
                      { key: "manufacturer", label: "Manufacturer" },
                      { key: "model", label: "Model" },
                      { key: "year", label: "Year" },
                      { key: "co2_emissions", label: "CO2" },
                      { key: "rv", label: "RV" },
                      { key: "length", label: "Length (MM)" },
                      { key: "euro_standard", label: "Euro" },
                      { key: "vehicle_type", label: "Fuel" },
                      { key: "total_tax", label: "Total Tax (€)" },
                      { key: "classic_car_tax", label: "Classic Tax (€)" },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        className="border border-gray-600 p-2 cursor-pointer hover:bg-gray-600 hover:text-white transition-colors"
                        onClick={() => requestSort(key as keyof Entry)}
                      >
                        <div className="flex items-center justify-between">
                          {label}
                          {sortConfig?.key === key && (
                            <span>
                              {sortConfig.direction === "asc" ? "▲" : "▼"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={index % 2 === 0 ? "bg-gray-800" : "bg-gray-700"}
                    >
                      <td className="border border-gray-600 p-2">{entry.manufacturer}</td>
                      <td className="border border-gray-600 p-2">{entry.model}</td>
                      <td className="border border-gray-600 p-2">{entry.year}</td>
                      <td className="border border-gray-600 p-2">{entry.co2_emissions}</td>
                      <td className="border border-gray-600 p-2">{entry.rv}</td>
                      <td className="border border-gray-600 p-2">{entry.length}</td>
                      <td className="border border-gray-600 p-2">{entry.euro_standard}</td>
                      <td className="border border-gray-600 p-2 capitalize">{entry.vehicle_type}</td>
                      <td className="border bg-emerald-600 border-gray-600 p-2">
                        {new Intl.NumberFormat().format(Math.round(entry.total_tax))}
                      </td>
                      <td
                        className={`border border-gray-600 p-2 ${Math.round(entry.classic_car_tax) === 0 ? "bg-red-700" : "bg-emerald-700"
                          }`}
                      >
                        {new Intl.NumberFormat().format(Math.round(entry.classic_car_tax))}
                      </td>

                    </tr>
                  ))}
                </tbody>


              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPage;
