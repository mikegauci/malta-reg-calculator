"use client";

import React, { useState } from "react";

type VehicleType = "petrol" | "diesel";

interface Inputs {
  co2Emissions: string;
  rv: string;
  length: string;
  euroStandard: number;
  vehicleType: VehicleType;
  manufacturer: string;
  model: string;
  year: string;
}

interface Results {
  totalTax: number;
  classicCarTax: number;
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
  });

  const [results, setResults] = useState<Results | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
  };

  const calculateTax = async () => {
    const { co2Emissions, rv, length, euroStandard, vehicleType } = inputs;

    const numericCo2Emissions = parseFloat(co2Emissions);
    const numericRv = parseFloat(rv);
    const numericLength = parseFloat(length);

    if (isNaN(numericCo2Emissions) || isNaN(numericRv) || isNaN(numericLength)) {
      alert(
        "Please enter valid numeric values for CO2 Emissions, Registration Value, and Length."
      );
      return;
    }

    const lengthTaxRate = getLengthTaxRate(numericLength);
    const co2TaxRate = getCo2TaxRate(
      vehicleType,
      numericCo2Emissions,
      euroStandard
    );

    const lengthTax = (numericLength * numericRv * lengthTaxRate) / 100;
    const co2Tax = numericCo2Emissions * numericRv * co2TaxRate;

    const totalTax = lengthTax + co2Tax;
    const classicCarTax = totalTax * 0.40;

    setResults({
      totalTax,
      classicCarTax,
    });

    // Submit data to API after successful calculation
    await submitData({
      ...inputs,
      totalTax,
      classicCarTax,
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
    euroStandard: number
  ): number => {
    const co2RateTable: Record<VehicleType, Record<number, number[]>> = {
      petrol: {
        0: [0.07, 0.15, 0.20, 0.23],
        101: [0.09, 0.17, 0.23, 0.26],
        131: [0.10, 0.19, 0.26, 0.30],
        141: [0.11, 0.22, 0.29, 0.33],
        151: [0.16, 0.24, 0.32, 0.37],
        181: [0.18, 0.26, 0.35, 0.40],
        221: [0.21, 0.29, 0.38, 0.44],
        251: [0.23, 0.31, 0.41, 0.47],
      },
      diesel: {
        0: [0.07, 0.15, 0.20, 0.23],
        101: [0.09, 0.17, 0.23, 0.26],
        131: [0.10, 0.19, 0.26, 0.30],
        141: [0.11, 0.22, 0.29, 0.33],
        151: [0.16, 0.24, 0.32, 0.37],
        181: [0.18, 0.26, 0.35, 0.40],
        221: [0.21, 0.29, 0.38, 0.44],
        251: [0.23, 0.31, 0.41, 0.47],
      },
    };

    const euroIndex = Math.max(0, Math.min(6 - euroStandard, 3));

    for (const [threshold, rates] of Object.entries(co2RateTable[vehicleType])) {
      if (co2Emissions <= parseFloat(threshold)) {
        return rates[euroIndex] / 100;
      }
    }
    return 0;
  };

  return (
<div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-6">
  <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-md p-6">
    <h1 className="text-2xl font-bold text-center mb-6">
      Malta Car Registration Tax Calculator
    </h1>
    <form className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Manufacturer:</label>
          <input
            type="text"
            name="manufacturer"
            value={inputs.manufacturer}
            onChange={handleInputChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model:</label>
          <input
            type="text"
            name="model"
            value={inputs.model}
            onChange={handleInputChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Year:</label>
          <input
            type="number"
            name="year"
            value={inputs.year}
            onChange={handleInputChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            CO2 Emissions (g/km):
          </label>
          <input
            type="number"
            name="co2Emissions"
            value={inputs.co2Emissions}
            onChange={handleInputChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Registration Value (RV):
          </label>
          <input
            type="number"
            name="rv"
            value={inputs.rv}
            onChange={handleInputChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Vehicle Length (mm):
          </label>
          <input
            type="number"
            name="length"
            value={inputs.length}
            onChange={handleInputChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle Type:</label>
          <select
            name="vehicleType"
            value={inputs.vehicleType}
            onChange={handleInputChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Euro Standard:</label>
          <select
            name="euroStandard"
            value={inputs.euroStandard}
            onChange={handleInputChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          >
            {[6, 5, 4, 3, 2, 1].map((num) => (
              <option key={num} value={num}>
                Euro {num}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={calculateTax}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded"
      >
        Calculate and Submit
      </button>
    </form>
    {results && (
      <div className="mt-6">
        <h2 className="text-xl font-bold text-center mb-4">Results</h2>
        <table className="w-full border-collapse border border-gray-700">
          <thead>
            <tr>
              <th className="border border-gray-700 p-2">Vehicle Type</th>
              <th className="border border-gray-700 p-2">
                Total Registration Tax (€)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-700 p-2 capitalize">
                {inputs.vehicleType}
              </td>
              <td className="border border-gray-700 p-2">
                {results.totalTax.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-700 p-2">Classic</td>
              <td className="border border-gray-700 p-2">
                {results.classicCarTax.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )}
  </div>
</div>

  );
};

export default VehicleTaxCalculator;
