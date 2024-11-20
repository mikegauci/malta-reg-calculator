import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabase"; // Ensure correct import path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const {
        manufacturer,
        model,
        year,
        co2Emissions,
        rv,
        length,
        euroStandard,
        vehicleType,
        totalTax,
        classicCarTax,
      } = req.body;

      const { data, error } = await supabase.from("submissions").insert([
        {
          manufacturer,
          model,
          year,
          co2_emissions: co2Emissions,
          rv,
          length,
          euro_standard: euroStandard,
          vehicle_type: vehicleType,
          total_tax: totalTax,
          classic_car_tax: classicCarTax,
        },
      ]);

      if (error) {
        console.error("Database Insertion Error:", error);
        return res.status(500).json({ message: "Database insertion failed", details: error });
      }

      res.status(200).json({ message: "Submission saved successfully", data });
    } catch (error) {
      console.error("API Error:", error);
      res.status(500).json({ message: "Internal server error", details: error });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
