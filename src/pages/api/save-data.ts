import { supabase } from "../../lib/supabase";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { co2Emissions, rv, length, euroStandard, vehicleType, totalTax, classicCarTax } = req.body;

    try {
      const { data, error } = await supabase.from("submissions").insert([
        {
          co2_emissions: co2Emissions,
          rv,
          length,
          euro_standard: euroStandard,
          vehicle_type: vehicleType,
          total_tax: totalTax,
          classic_car_tax: classicCarTax,
        },
      ]);

      if (error) throw error;

      res.status(200).json({ message: "Submission saved successfully", data });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
