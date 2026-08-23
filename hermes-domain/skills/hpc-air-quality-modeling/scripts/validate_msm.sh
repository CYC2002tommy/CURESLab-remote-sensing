#!/bin/bash
# Validate availability of MSM meteorological data (sfc and sigma) in NCHC storage.
# GTx requires BOTH ground (sfc) and high-altitude (sigma) data.

echo "🔍 Scanning /home/j40kuo00/data/msm.nc.v5/ for complete meteorology data..."
for year in 2024 2025 2026; do
  for month in {01..12}; do
    # Count sfc (surface) and sigma (high-altitude) files for the month
    sfc_count=$(find /home/j40kuo00/data/msm.nc.v5/$year/ -name "msm.sfc.${year}${month}*.nc" 2>/dev/null | wc -l)
    sigma_count=$(find /home/j40kuo00/data/msm.nc.v5/$year/ -name "msm.sigma.${year}${month}*.nc" 2>/dev/null | wc -l)
    
    if [ "$sfc_count" -gt 0 ] || [ "$sigma_count" -gt 0 ]; then
      if [ "$sigma_count" -eq 0 ]; then
         echo "⚠️ PARTIAL: ${year}-${month} (sfc: $sfc_count, MISSING sigma) -> WILL CRASH ('only ONE level is available')"
      else
         echo "✅ COMPLETE: ${year}-${month} (sfc: $sfc_count, sigma: $sigma_count)"
      fi
    fi
  done
done
echo "🎉 Scan complete."
