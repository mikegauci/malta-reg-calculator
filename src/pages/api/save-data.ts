import { supabase } from "../../lib/supabase";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === "POST") {
		console.log("Request body:", req.body);

		try {
			const {
				co2Emissions,
				rv,
				length,
				euroStandard,
				vehicleType,
				totalTax,
				classicCarTax,
				manufacturer,
				model,
				year,
			} = req.body;

			const { data, error } = await supabase.from("submissions").insert([
				{
					co2_emissions: parseFloat(co2Emissions),
					rv: parseFloat(rv),
					length: parseFloat(length),
					euro_standard: euroStandard,
					vehicle_type: vehicleType,
					total_tax: parseFloat(totalTax),
					classic_car_tax: parseFloat(classicCarTax),
					manufacturer,
					model,
					year: parseInt(year),
				},
			]);

			if (error) {
				console.error("Database Insertion Error:", error);
				throw error;
			}

			console.log("Data inserted successfully:", data);
			res.status(200).json({ message: "Submission saved successfully", data });
		} catch (error) {
			res.status(500).json({ error: (error as Error).message });
		}
	} else {
		res.status(405).json({ error: "Method not allowed" });
	}
}
