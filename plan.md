1. **Understand the problem**:
   - The user wants a performance improvement specific to this codebase.
   - The codebase has a frontend (React) and a backend (Python/ML).
   - Bolt's philosophy: "Replace O(n^2) nested loop with O(n) hash map lookup" and avoiding `find()` inside array generation maps (`useMemo`).
   - `.jules/bolt.md` specifically notes: "Array find inside loop inside render" and "Extract expensive lookups that don't depend on the loop index outside of the array generation map, and wrap the data generation block in `useMemo`".
   - In `apex/apps/web/src/pages/TyreLapPredictor.tsx` lines 207-228, we have exactly this:
     ```typescript
     const chartData = useMemo(() => {
       const softCurve = compoundsData.find(d => d.compound === "SOFT")?.degradation_curve;
       const mediumCurve = compoundsData.find(d => d.compound === "MEDIUM")?.degradation_curve;
       const hardCurve = compoundsData.find(d => d.compound === "HARD")?.degradation_curve;

       return Array.from({ length: 25 }, (_, idx) => {
         const lap = idx + 1;
         const softPt = softCurve?.find(p => p.stint_lap === lap);
         const mediumPt = mediumCurve?.find(p => p.stint_lap === lap);
         const hardPt = hardCurve?.find(p => p.stint_lap === lap);
         ...
         const simLap = simulatedLaps.find(sl => sl.lap === lap);
         ...
       });
     }, [...]);
     ```
   - This creates an $O(N^2)$ algorithm (specifically 25 laps * length of curves, running every time `simulatedLaps` updates on the live ticker). The ticker ticks every 700ms.
   - We can fix this by replacing the `.find` lookups inside the loop with simple array indexing, since `stint_lap` and `lap` are simple 1-indexed integers.
2. **Implementation details**:
   - In `apex/apps/web/src/pages/TyreLapPredictor.tsx`, modify `chartData` `useMemo`.
   - Before the `Array.from` loop, create lookup arrays:
     ```typescript
     const softMap: any[] = [];
     if (softCurve) softCurve.forEach(p => softMap[p.stint_lap] = p);

     const mediumMap: any[] = [];
     if (mediumCurve) mediumCurve.forEach(p => mediumMap[p.stint_lap] = p);

     const hardMap: any[] = [];
     if (hardCurve) hardCurve.forEach(p => hardMap[p.stint_lap] = p);

     const simLapMap: any[] = [];
     simulatedLaps.forEach(sl => simLapMap[sl.lap] = sl);
     ```
   - Inside the loop, replace:
     ```typescript
     const softPt = softCurve?.find(p => p.stint_lap === lap);
     const mediumPt = mediumCurve?.find(p => p.stint_lap === lap);
     const hardPt = hardCurve?.find(p => p.stint_lap === lap);
     ...
     const simLap = simulatedLaps.find(sl => sl.lap === lap);
     ```
     with:
     ```typescript
     const softPt = softMap[lap];
     const mediumPt = mediumMap[lap];
     const hardPt = hardMap[lap];
     ...
     const simLap = simLapMap[lap];
     ```
3. **Verify**:
   - Ensure the typescript compiles (`bun run lint`).
   - Run tests if available.
   - Ensure app still works.
4. **Complete Pre-Commit Steps**:
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. **Submit**:
   - Submit PR with title `⚡ Bolt: [performance improvement] O(1) lookups in TyreLapPredictor` and description matching Bolt's preferred format.
