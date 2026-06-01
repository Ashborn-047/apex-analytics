import { test, expect } from '@playwright/test';

// Seed mock data for API routing
const MOCK_SIMULATION_DATA = {
  as_of_round: 12,
  total_rounds: 24,
  simulations_run: 1000000,
  wdc: [
    { driver_id: "VER", driver_name: "Max Verstappen",  team: "Red Bull Racing",  team_color: "#1e3a8a", current_points: 287, championship_probability: 0.634, max_possible_points: 627, eliminated: false, trend: -0.041, points_scenarios: { p10: 341, p25: 368, p50: 401, p75: 438, p90: 471 } },
    { driver_id: "NOR", driver_name: "Lando Norris",    team: "McLaren",          team_color: "#ea580c", current_points: 261, championship_probability: 0.298, max_possible_points: 601, eliminated: false, trend: +0.038, points_scenarios: { p10: 295, p25: 325, p50: 362, p75: 401, p90: 441 } },
    { driver_id: "LEC", driver_name: "Charles Leclerc", team: "Ferrari",          team_color: "#dc2626", current_points: 198, championship_probability: 0.051, max_possible_points: 538, eliminated: false, trend: +0.008, points_scenarios: { p10: 225, p25: 255, p50: 295, p75: 335, p90: 378 } },
    { driver_id: "RUS", driver_name: "George Russell",  team: "Mercedes",         team_color: "#047857", current_points: 175, championship_probability: 0.012, max_possible_points: 515, eliminated: false, trend: +0.004, points_scenarios: { p10: 198, p25: 225, p50: 265, p75: 308, p90: 352 } },
    { driver_id: "PIA", driver_name: "Oscar Piastri",   team: "McLaren",          team_color: "#ea580c", current_points: 142, championship_probability: 0.004, max_possible_points: 482, eliminated: false, trend: +0.002, points_scenarios: { p10: 162, p25: 188, p50: 228, p75: 272, p90: 318 } },
    { driver_id: "SAI", driver_name: "Carlos Sainz",    team: "Ferrari",          team_color: "#dc2626", current_points: 98,  championship_probability: 0.001, max_possible_points: 438, eliminated: false, trend: -0.001, points_scenarios: { p10: 115, y25: 138, p50: 172, p75: 212, p90: 255 } },
  ],
  wcc: [
    { constructor_id: "red_bull", constructor_name: "Red Bull Racing", current_points: 412, championship_probability: 0.548, color: "#1e3a8a" },
    { constructor_id: "mclaren",  constructor_name: "McLaren",         current_points: 389, championship_probability: 0.361, color: "#ea580c" },
    { constructor_id: "ferrari",  constructor_name: "Ferrari",         current_points: 341, championship_probability: 0.078, color: "#dc2626" },
    { constructor_id: "mercedes", constructor_name: "Mercedes",        current_points: 298, championship_probability: 0.013, color: "#047857" },
  ],
  actual_wdc: [
    { driver_id: "VER", points: 410 },
    { driver_id: "NOR", points: 380 },
    { driver_id: "LEC", points: 310 },
    { driver_id: "RUS", points: 280 },
    { driver_id: "PIA", points: 250 },
    { driver_id: "SAI", points: 180 },
  ],
  actual_wcc: [
    { constructor_id: "red_bull", points: 790 },
    { constructor_id: "mclaren", points: 630 },
    { constructor_id: "ferrari", points: 490 },
    { constructor_id: "mercedes", points: 420 },
  ]
};

test.describe('F1 Race Intelligence Web App E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept and mock dynamic API calls to ensure test reliability regardless of local database status
    await page.route('**/api/predict/simulation/championship*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SIMULATION_DATA),
      });
    });

    // Navigate to local baseURL
    await page.goto('/');
  });

  test('should load the home page (Driver Elo tab) correctly', async ({ page }) => {
    // Assert title wordmark is present
    await expect(page.locator('text=Race Intelligence')).toBeVisible();

    // Assert active tab is Driver Elo and standings load
    await expect(page.getByRole('button', { name: 'Driver Elo' })).toBeVisible();
    await expect(page.locator('text=Driver Elo Standings')).toBeVisible();
  });

  test('should navigate across all telemetry dashboards successfully', async ({ page }) => {
    // 1. Tyre & Lap
    await page.getByRole('button', { name: 'Tyre & Lap' }).click();
    await expect(page.locator('text=Tyre Degradation Model')).toBeVisible();

    // 2. Pit Wall
    await page.getByRole('button', { name: 'Pit Wall' }).click();
    await expect(page.locator('text=Pit Window Timeline')).toBeVisible();

    // 3. Monte Carlo
    await page.getByRole('button', { name: 'Monte Carlo' }).click();
    await expect(page.locator('text=MONTE CARLO LOOPS').first()).toBeVisible();
  });

  test('should support dynamic season selection changes', async ({ page }) => {
    const seasonSelect = page.locator('select');
    await expect(seasonSelect).toBeVisible();

    // Change season to 2025
    await seasonSelect.selectOption('2025');
    
    // Check that select value updates
    await expect(seasonSelect).toHaveValue('2025');
    
    // Check that header displays the correct season (p tag containing 2025 SEASON)
    await expect(page.locator('p:has-text("2025 SEASON")')).toBeVisible();
  });

  test('should open driver detail panel in Elo Dashboard', async ({ page }) => {
    // Click on a driver card containing Max Verstappen
    const verCard = page.locator('text=Max Verstappen').first();
    await expect(verCard).toBeVisible();
    await verCard.click();

    // Verify detail panel / teammate comparison loads
    await expect(page.locator('text=Teammate H2H')).toBeVisible();
    await expect(page.locator('text=H2H DOMINANCE')).toBeVisible();
  });

  test('should toggle compound selections in Tyre Lap Predictor', async ({ page }) => {
    // Navigate to Tyre page
    await page.getByRole('button', { name: 'Tyre & Lap' }).click();

    // Click SOFT compound card selector
    const softCard = page.locator('text=SOFT').first();
    await expect(softCard).toBeVisible();
    await softCard.click();

    // Verify it updates selected state
    await expect(page.locator('text=SOFT Stint Pace & Actuals')).toBeVisible();
  });

  test('should open simulated vs actual comparison panel in Monte Carlo simulator', async ({ page }) => {
    // Navigate to Monte Carlo page
    await page.getByRole('button', { name: 'Monte Carlo' }).click();

    // Click on Oscar Piastri card
    const piastriCard = page.locator('text=Oscar Piastri').first();
    await expect(piastriCard).toBeVisible();
    await piastriCard.click();

    // Check that simulated vs actual table shows up
    await expect(page.locator('text=SIMULATED vs ACTUAL SEASON STATUS')).toBeVisible();
    await expect(page.locator('text=Prediction Model Error')).toBeVisible();
  });
});
