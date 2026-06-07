import { test, expect } from '@playwright/test';

// Seed mock data for API routing
const MOCK_SIMULATION_DATA = {
  as_of_round: 12,
  total_rounds: 24,
  simulations_run: 100000,
  wdc: [
    { driver_id: "VER", driver_name: "Max Verstappen",  team: "Red Bull Racing",  team_color: "#1e3a8a", current_points: 287, championship_probability: 0.634, max_possible_points: 627, eliminated: false, trend: -0.041, points_scenarios: { p10: 341, p25: 368, p50: 401, p75: 438, p90: 471 } },
    { driver_id: "NOR", driver_name: "Lando Norris",    team: "McLaren",          team_color: "#ea580c", current_points: 261, championship_probability: 0.298, max_possible_points: 601, eliminated: false, trend: +0.038, points_scenarios: { p10: 295, p25: 325, p50: 362, p75: 401, p90: 441 } }
  ],
  wcc: [
    { constructor_id: "red_bull", constructor_name: "Red Bull Racing", current_points: 412, championship_probability: 0.548, color: "#1e3a8a" },
    { constructor_id: "mclaren",  constructor_name: "McLaren",         current_points: 389, championship_probability: 0.361, color: "#ea580c" }
  ],
  actual_wdc: [
    { driver_id: "VER", points: 410 },
    { driver_id: "NOR", points: 380 }
  ],
  actual_wcc: [
    { constructor_id: "red_bull", points: 790 },
    { constructor_id: "mclaren", points: 630 }
  ]
};

const MOCK_ELO_RANKINGS = {
  rankings: [
    { driver_id: "VER", driver_name: "Max Verstappen", team: "Red Bull Racing", elo_rating: 2150, uncertainty: 21, trend_5_rounds: 4.5, trend: 4.5, team_color: "#1e3a8a", h2h_record: { wins: 18, losses: 4, ties: 0 }, quali_dominance_pct: 82, nationality_flag: "🇳🇱", history: [{ round: 1, elo: 2100 }, { round: 2, elo: 2150 }] },
    { driver_id: "NOR", driver_name: "Lando Norris", team: "McLaren", elo_rating: 2080, uncertainty: 24, trend_5_rounds: 10.2, trend: 10.2, team_color: "#ea580c", h2h_record: { wins: 16, losses: 6, ties: 0 }, quali_dominance_pct: 73, nationality_flag: "🇬🇧", history: [{ round: 1, elo: 2050 }, { round: 2, elo: 2080 }] }
  ]
};

const MOCK_STRATEGY_WINDOW = {
  recommendations: [
    {
      name: "Soft-Medium-Hard 2-Stop",
      compound_current: "SOFT",
      compound_new: "MEDIUM",
      pit_lap: 18,
      sc_probability: 0.42,
      net_delta_s: -24.5,
      confidence: "HIGH"
    }
  ]
};

const MOCK_STRATEGY_ACTUALS = {
  stops: [
    { driver_id: "VER", stint_number: 1, current_compound: "SOFT", new_compound: "MEDIUM", pit_lap: 17, pace_loss_s: 22.8 }
  ]
};

const MOCK_LAP_TIME_PREDICTION = {
  predicted_lap_time_s: 81.5,
  confidence_interval: [81.25, 81.75],
  degradation_curve: Array.from({ length: 25 }, (_, i) => ({ stint_lap: i + 1, predicted_s: 81.5 + i * 0.05 })),
  cliff_lap: 19,
  cliff_severity_s_per_lap: 0.18,
  compound: "MEDIUM",
  circuit_id: "monza"
};

const MOCK_LAP_TIME_ACTUALS = {
  laps: [
    { driver_id: "VER", compound: "MEDIUM", stint_number: 1, stint_lap: 1, lap_time_s: 81.6 }
  ]
};

const MOCK_LIVE_STINT_SIMULATION = {
  status: "success",
  compound: "MEDIUM",
  track_temp_c: 35.0,
  starting_fuel_load_kg: 80.0,
  laps: Array.from({ length: 25 }, (_, i) => ({
    lap: i + 1,
    predicted_s: 81.5 + i * 0.05,
    simulated_s: 81.5 + i * 0.05 + Math.sin(i) * 0.1,
    tyre_health_percent: Math.max(0, 100 - (i + 1) * 3),
    is_cliff: (i + 1) >= 19
  }))
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

    await page.route('**/api/predict/elo/rankings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ELO_RANKINGS),
      });
    });

    await page.route('**/api/predict/strategy/pit-window/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STRATEGY_WINDOW),
      });
    });

    await page.route('**/api/predict/strategy/actuals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STRATEGY_ACTUALS),
      });
    });

    await page.route('**/api/predict/lap-time', async (route) => {
      let compound = "MEDIUM";
      try {
        const postData = route.request().postDataJSON();
        if (postData && postData.compound) {
          compound = postData.compound;
        }
      } catch (e) {
        // Fallback
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_LAP_TIME_PREDICTION,
          compound,
        }),
      });
    });

    await page.route('**/api/predict/lap-time/actuals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LAP_TIME_ACTUALS),
      });
    });

    await page.route('**/api/predict/live-stint/simulate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LIVE_STINT_SIMULATION),
      });
    });

    // Navigate to local baseURL
    await page.goto('/');
  });

  // Helper to open mobile drawer if visible, and click tab button
  const navigateToTab = async (page: any, name: string) => {
    const toggle = page.locator('.mobile-toggle');
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(200); // wait for slide transition
    }
    await page.getByRole('button', { name }).click();
  };

  test('should load the home page (Driver Elo tab) correctly', async ({ page }) => {
    // Assert title wordmark is present
    await expect(page.locator('text=Race Intelligence')).toBeVisible();

    // Assert active tab is Driver Elo and standings load
    await expect(page.getByRole('button', { name: 'Driver Elo' })).toBeVisible();
    await expect(page.locator('text=Telemetry Deck')).toBeVisible();
  });

  test('should navigate across all telemetry dashboards successfully', async ({ page }) => {
    // 1. Tyre & Lap
    await navigateToTab(page, 'Tyre & Lap');
    await expect(page.locator('text=Tyre Degradation Model')).toBeVisible();

    // 2. Pit Wall
    await navigateToTab(page, 'Pit Wall');
    await expect(page.locator('text=Race Timeline').first()).toBeVisible();

    // 3. Monte Carlo
    await navigateToTab(page, 'Monte Carlo');
    await expect(page.locator('text=SIMULATIONS').first()).toBeVisible();
  });

  test('should support dynamic season selection changes', async ({ page }) => {
    const seasonSelect = page.locator('select').first();
    await expect(seasonSelect).toBeVisible();

    // Change season to 2025
    await seasonSelect.selectOption('2025');
    
    // Check that select value updates
    await expect(seasonSelect).toHaveValue('2025');
  });

  test('should open driver detail panel in Elo Dashboard', async ({ page }) => {
    // Click on a driver card containing Max Verstappen
    const verCard = page.locator('text=Max Verstappen').first();
    await expect(verCard).toBeVisible();
    await verCard.click({ force: true });

    // Click OPEN DRIVER PROFILE
    const profileBtn = page.locator('text=OPEN DRIVER PROFILE').first();
    await expect(profileBtn).toBeVisible();
    await profileBtn.click({ force: true });

    // Verify detail panel / teammate comparison loads
    await expect(page.locator('text=Teammate Matchup Analysis')).toBeVisible();
    await expect(page.locator('text=H2H DOMINANCE')).toBeVisible();
  });

  test('should toggle compound selections in Tyre Lap Predictor', async ({ page }) => {
    // Navigate to Tyre page
    await navigateToTab(page, 'Tyre & Lap');

    // Click SOFT compound card selector in sidebar
    const softCard = page.locator('.panel-scanner', { hasText: 'SOFT' }).first();
    await expect(softCard).toBeVisible();
    await softCard.click({ force: true });

    // Verify it updates selected state via the active configuration text identifier
    await expect(page.locator('text=ACTIVE CONFIGURATION: SOFT')).toBeVisible();
  });

  test('should open simulated vs actual comparison panel in Monte Carlo simulator', async ({ page }) => {
    // Navigate to Monte Carlo page
    await navigateToTab(page, 'Monte Carlo');

    // Click on Max Verstappen card to select him
    const verCard = page.locator('text=Max Verstappen').first();
    await expect(verCard).toBeVisible();
    await verCard.click({ force: true });

    // Click SIMULATE SCENARIOS button to open scenario view
    const simBtn = page.locator('text=SIMULATE SCENARIOS').first();
    await expect(simBtn).toBeVisible();
    await simBtn.click({ force: true });

    // Check that simulated vs actual details show up
    await expect(page.locator('text=Points Scenario Distribution')).toBeVisible();
    await expect(page.locator('text=Championship Scenarios')).toBeVisible();
  });

  test('should enforce layout responsiveness in mobile viewports', async ({ page }) => {
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 500) {
      // Mobile view testing
      const versionTag = page.locator('text=v0.1.0');
      // Asserting that mobile view renders key branding elements but might hide/stack others
      await expect(versionTag).toBeVisible();
    } else {
      // Desktop view testing
      await expect(page.locator('text=OpenF1 + Jolpica')).toBeVisible();
    }
  });

  test('should handle API failure resilience and error boundary reconnection', async ({ page, context }) => {
    // Break the ratings endpoint
    await page.route('**/api/predict/elo/rankings*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: "Database connection failed" }),
      });
    });

    // Navigate to cause fetch crash
    await page.goto('/');

    // Assert that the page displays the error boundary block
    await expect(page.locator('text=⚠️ TELEMETRY FEED INTERRUPTED')).toBeVisible();
    await expect(page.locator('text=RECONNECT FEED')).toBeVisible();

    // Restore the endpoint back to healthy
    await page.route('**/api/predict/elo/rankings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ELO_RANKINGS),
      });
    });

    // Click reconnect button
    await page.click('text=RECONNECT FEED', { force: true });

    // Verify it loads rankings successfully and error boundary is cleared
    await expect(page.locator('text=Telemetry Deck')).toBeVisible();
    await expect(page.locator('text=Max Verstappen').first()).toBeVisible();
  });

  test('should run live stint simulation in Tyre Lap Predictor', async ({ page }) => {
    // Go to Tyre page
    await navigateToTab(page, 'Tyre & Lap');

    // Verify sliders/settings load
    await expect(page.locator('text=LIVE STINT SIMULATOR')).toBeVisible();
    await expect(page.locator('text=Track Temp').first()).toBeVisible();
    await expect(page.locator('text=Starting Fuel').first()).toBeVisible();

    // Run simulation
    await page.click('text=RUN SIMULATION', { force: true });

    // Verify simulating state
    await expect(page.locator('text=Progress')).toBeVisible();

    // Reset simulation
    await page.click('text=RESET', { force: true });
    await expect(page.locator('text=RUN SIMULATION')).toBeVisible();
  });

  test('should navigate and interact with ML Wiki page', async ({ page }) => {
    // Navigate to ML Wiki page
    await navigateToTab(page, 'ML Wiki');

    // Verify System Overview is visible
    await expect(page.locator('text=F1 Predictive Modeling Overview')).toBeVisible();

    // Click on Driver Elo Ratings article
    await page.click('text=Driver Elo Ratings', { force: true });

    // Verify detail headers for Elo ratings load
    await expect(page.locator('text=SCOPE: ML-SCOPE-01')).toBeVisible();

    // Click Logic & Math sub-tab and verify steps are visible
    await page.click('text=Logic & Math', { force: true });
    await expect(page.locator('text=Algorithmic Execution Steps')).toBeVisible();

    // Click Sandbox Playground sub-tab and verify sandbox content loads
    await page.click('text=Sandbox Playground', { force: true });
    await expect(page.locator('text=PROBABILITY A')).toBeVisible();
  });
});

