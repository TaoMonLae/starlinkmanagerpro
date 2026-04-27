import { getDashboardData } from "../services/dashboardService.js";

export async function dashboard(req, res) {
  res.json(await getDashboardData(req.user.id));
}
