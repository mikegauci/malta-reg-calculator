"use client";

import Link from "next/link";
import React, { useState } from "react";

type VehicleType = "petrol" | "diesel" | "hybrid" | "plugin-hybrid" | "electric";

interface Inputs {
  co2Emissions: string;
  rv: string;
  length: string;
  euroStandard: number;
  vehicleType: VehicleType;
  manufacturer: string;
  model: string;
  year: string;
  electricRange?: string;
}

interface Results {
  totalTax: number;
  classicCarTax: number | null;
  workings: string[];
}

const VehicleTaxCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<Inputs>({
    co2Emissions: "",
    rv: "",
    length: "",
    euroStandard: 6,
    vehicleType: "petrol",
    manufacturer: "",
    model: "",
    year: "",
    electricRange: "",
  });

  const [results, setResults] = useState<Results | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
  };

  const calculateTax = async () => {
    const { co2Emissions, rv, length, euroStandard, vehicleType, year, electricRange } = inputs;
    const numericCo2Emissions = parseFloat(co2Emissions);
    const numericRv = parseFloat(rv);
    const numericLength = parseFloat(length);
    const numericYear = parseInt(year);
    const numericElectricRange = parseFloat(electricRange || "0");

    if (
      isNaN(numericCo2Emissions) ||
      isNaN(numericRv) ||
      isNaN(numericLength) ||
      isNaN(numericYear)
    ) {
      alert(
        "Please enter valid numeric values for CO2 Emissions, Registration Value, Length, and Year."
      );
      return;
    }

    if (vehicleType === "plugin-hybrid" && isNaN(numericElectricRange)) {
      alert("Please enter a valid numeric value for Electric Range.");
      return;
    }

    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - numericYear;

    let totalTax = 0;
    let classicCarTax: number | null = null;
    const workings: string[] = [];

    if (vehicleType === "electric") {
      // Electric vehicles always have zero tax
      totalTax = 0;
      workings.push("Electric vehicles are exempt from registration tax.");
    } else if (vehicleType === "plugin-hybrid" && numericElectricRange >= 50) {
      // Plugin hybrids with electric range >= 50 have zero tax
      totalTax = 0;
      workings.push(
        `Plug-in hybrid with electric range ${numericElectricRange}km is exempt from registration tax.`
      );
    } else {
      const lengthTaxRate = getLengthTaxRate(numericLength);
      const adjustedCo2 = (vehicleType === "hybrid")
        ? Math.round(numericCo2Emissions * 0.70)
        : numericCo2Emissions;

      const co2TaxRate = getCo2TaxRate(
        vehicleType,
        adjustedCo2,
        euroStandard,
        numericYear
      );

      const lengthTax = parseFloat(
        ((numericLength * numericRv * lengthTaxRate) / 100).toFixed(2)
      );
      const co2Tax = parseFloat(
        (adjustedCo2 * numericRv * co2TaxRate).toFixed(2)
      );
      totalTax = parseFloat((lengthTax + co2Tax).toFixed(2));

      // Calculate classicCarTax only for vehicles older than 30 years
      classicCarTax = vehicleAge >= 30 ? Math.round(totalTax * 0.40) : null;

      workings.push(
        `Length Tax Calculation: ${numericLength} * ${numericRv} * ${lengthTaxRate.toFixed(
          4
        )} / 100 = ${lengthTax.toFixed(2)}`,
        `CO2 Tax Calculation: ${adjustedCo2} * ${numericRv} * ${co2TaxRate.toFixed(
          4
        )} = ${co2Tax.toFixed(2)}`,
        `Total Tax Calculation: ${lengthTax.toFixed(2)} + ${co2Tax.toFixed(
          2
        )} = ${totalTax.toFixed(2)}`
      );

      // Add the hybrid-specific workings
      if (vehicleType === "hybrid" || vehicleType === "plugin-hybrid") {
        workings.unshift(
          `Adjusted CO2 (Hybrid): ${numericCo2Emissions} * 30% = ${adjustedCo2}`
        );
      }
    }

    setResults({
      totalTax,
      classicCarTax: classicCarTax ?? 0,
      workings,
    });

    // Submit data to API after successful calculation
    await submitData({
      ...inputs,
      totalTax,
      classicCarTax,
      workings: [],
    });
  };

  const submitData = async (data: Inputs & Results) => {
    try {
      const response = await fetch("/api/save-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Data submitted successfully!");
      } else {
        const error = await response.json();
        alert("Failed to submit data: " + error.message);
      }
    } catch (err) {
      alert("An error occurred while submitting data.");
      console.error(err);
    }
  };

  const getLengthTaxRate = (length: number): number => {
    if (length <= 3450) return 0.0020;
    if (length <= 3640) return 0.0022;
    if (length <= 3770) return 0.0024;
    if (length <= 4030) return 0.0026;
    if (length <= 4370) return 0.0028;
    if (length <= 4570) return 0.0030;
    if (length <= 4770) return 0.0032;
    return 0.0034;
  };

  const getCo2TaxRate = (
    vehicleType: VehicleType,
    co2Emissions: number,
    euroStandard: number,
    year: number
  ): number => {
    // Define a common rate table for all relevant vehicle types
    const commonRateTable = [
      { range: [0, 100], rates: [0.07, 0.15, 0.20, 0.23] },
      { range: [101, 130], rates: [0.09, 0.17, 0.23, 0.26] },
      { range: [131, 140], rates: [0.10, 0.19, 0.26, 0.30] },
      { range: [141, 150], rates: [0.11, 0.22, 0.29, 0.33] },
      { range: [151, 180], rates: [0.16, 0.24, 0.32, 0.37] },
      { range: [181, 220], rates: [0.18, 0.26, 0.35, 0.40] },
      { range: [221, 250], rates: [0.21, 0.29, 0.38, 0.44] },
      { range: [251, Infinity], rates: [0.23, 0.31, 0.41, 0.47] },
    ];

    // Special diesel rates for vehicles older than 2012
    const dieselOldRateTable = [
      { range: [0, 100], rates: [0.0021, 0.0021, 0.0032, 0.0037] },
      { range: [101, 130], rates: [0.0024, 0.0024, 0.0036, 0.0042] },
      { range: [131, 140], rates: [0.0027, 0.0027, 0.0041, 0.0047] },
      { range: [141, 150], rates: [0.0031, 0.0031, 0.0045, 0.0053] },
      { range: [151, 180], rates: [0.0033, 0.0033, 0.0051, 0.0060] },
      { range: [181, 220], rates: [0.0036, 0.0036, 0.0056, 0.0065] },
      { range: [221, 250], rates: [0.0040, 0.0040, 0.0060, 0.0070] },
      { range: [251, Infinity], rates: [0.0043, 0.0043, 0.0065, 0.0075] },
    ];


    // Determine euro index
    const euroIndex = Math.max(0, Math.min(6 - euroStandard, 3));

    // Use special diesel table if year is before 2012
    if (vehicleType === "diesel" && year < 2012) {
      for (const { range, rates } of dieselOldRateTable) {
        if (co2Emissions >= range[0] && co2Emissions <= range[1]) {
          return rates[Math.min(euroIndex, 3)];
        }
      }
    }

    // For all other types, use the common rate table
    const ranges = commonRateTable;
    for (const { range, rates } of ranges) {
      if (co2Emissions >= range[0] && co2Emissions <= range[1]) {
        return rates[Math.max(0, Math.min(6 - euroStandard, 3))] / 100;
      }
    }

    throw new Error("CO2 emissions out of range.");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-xl font-bold text-center mb-2">Malta Car Registration Tax Calculator</h1>
        <form className="space-y-6 text-sm"> {/* Apply text-sm for 14px font size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Manufacturer:</label>
              <input
                type="text"
                name="manufacturer"
                placeholder="Honda"
                value={inputs.manufacturer}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              />
            </div>
            <div>
              <label className="block mb-1">Model:</label>
              <input
                type="text"
                name="model"
                placeholder="NSX"
                value={inputs.model}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Year:</label>
              <input
                type="number"
                name="year"
                placeholder="1991"
                value={inputs.year}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              />
            </div>
            <div>
              <label className="block mb-1">CO2 Emissions (g/km):</label>
              <input
                type="number"
                name="co2Emissions"
                placeholder="237"
                value={inputs.co2Emissions}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label className="relative block mb-1 flex items-center">
                Registration Value (RV):
                <span className="absolute ml-2 text-blue-500 cursor-pointer group" style={{ right: 35, top: 35 }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                    />
                  </svg>
                  <div className="absolute hidden group-hover:block bg-gray-800 text-gray-100 text-xs rounded p-2 shadow-lg mt-1 w-52">
                    Divide the car's price by 30% to estimate its registration value. For instance, a €30,000 car would have an estimated registration value of <strong>€21,000</strong>.
                  </div>
                </span>
                <style jsx>{`
                  @media (max-width: 768px) {
                    span {
                      right: 6px !important;
                    }
                  }
                `}</style>
              </label>
              <input
                type="number"
                name="rv"
                placeholder="Market value in €"
                value={inputs.rv}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              />
            </div>

            <div>
              <label className="block mb-1">Vehicle Length (mm):</label>
              <input
                type="number"
                name="length"
                placeholder="4420"
                value={inputs.length}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Fuel:</label>
              <select
                name="vehicleType"
                value={inputs.vehicleType}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="plugin-hybrid">Plug-in Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Euro Standard:</label>
              <select
                name="euroStandard"
                value={inputs.euroStandard}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                {[6, 5, 4, 3, 2, 1].map((num) => (
                  <option key={num} value={num}>
                    Euro {num}
                  </option>
                ))}
              </select>
            </div>
            <div>
              {inputs.vehicleType === "plugin-hybrid" && (
                <div>
                  <label className="block mb-1">Electric Range (km):</label>
                  <input
                    type="number"
                    name="electricRange"
                    placeholder="Enter electric range"
                    value={inputs.electricRange}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                  />
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={calculateTax}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm"
          >
            Calculate and Submit
          </button>
        </form>
        {results && (
          <div className="mt-6 text-sm">
            <h2 className="text-lg font-bold text-center mb-4">Results</h2>
            <table className="w-full border-collapse border border-gray-700 mb-4 text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-700 p-2">Fuel</th>
                  <th className="border border-gray-700 p-2">Total Registration Tax (€)</th>
                  {results.classicCarTax !== null && (
                    <th className="border border-gray-700 p-2">Classic Car Tax (€)</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-700 p-2 capitalize">{inputs.vehicleType}</td>
                  <td className="border border-gray-700 p-2">
                    {new Intl.NumberFormat().format(Math.round(results.totalTax))}
                  </td>
                  {results.classicCarTax !== null && (
                    <td className="border border-gray-700 p-2">
                      {new Intl.NumberFormat().format(Math.round(results.classicCarTax))}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
            <h3 className="text-lg font-bold mb-2">Calculation Workings:</h3>
            <ul className="list-disc pl-6 space-y-2">
              {results.workings.map((line, index) => (
                <li key={index} className="text-gray-300">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
        <h3 className="text-center mt-4">
          <Link href="/admin" className="text-blue-500 underline">
            Go to Database
          </Link>
        </h3>
      </div>
    </div>
  );
};

export default VehicleTaxCalculator;
