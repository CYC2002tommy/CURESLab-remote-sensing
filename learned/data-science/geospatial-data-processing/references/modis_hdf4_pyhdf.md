# Reading NASA MODIS HDF4 Files safely

When processing NASA MODIS `.hdf` files (e.g., MOD17A3HGF, MOD16A2), standard `rasterio.open()` often fails with `CPLE_OpenFailedError` due to missing HDF4 subdataset support or Sinusoidal projection quirks in the local GDAL build.

**Robust Workaround:**
Use `pyhdf.SD` to extract the raw array and metadata, then `pyproj` to transform the Sinusoidal projection into standard EPSG:4326 Lat/Lon arrays.

```python
from pyhdf.SD import SD, SDC
from pyproj import Transformer
import re
import numpy as np

# 1. Read subdataset and metadata
hdf = SD("MOD17A3HGF.A2015001.hdf", SDC.READ)
data = hdf.select('Npp_500m').get().astype(float)
meta = hdf.attributes()['StructMetadata.0']
hdf.end()

# 2. Parse Sinusoidal bounds (meters)
ul_match = re.search(r'UpperLeftPointMtrs=\((.*?),(.*?)\)', meta)
lr_match = re.search(r'LowerRightMtrs=\((.*?),(.*?)\)', meta)
ul_x, ul_y = float(ul_match.group(1)), float(ul_match.group(2))
lr_x, lr_y = float(lr_match.group(1)), float(lr_match.group(2))

# 3. Create meshgrid for the tile
rows, cols = data.shape
x = np.linspace(ul_x, lr_x, cols)
y = np.linspace(ul_y, lr_y, rows)
xx, yy = np.meshgrid(x, y)

# 4. Transform to WGS84 (Lat/Lon)
# Note the specific MODIS sphere radius: 6371007.181
transformer = Transformer.from_crs("+proj=sinu +R=6371007.181 +nadgrids=@null +wktext", "EPSG:4326", always_xy=True)
lon, lat = transformer.transform(xx, yy)

# Now `lon` and `lat` perfectly map to the `data` array for downstream interpolation.
```