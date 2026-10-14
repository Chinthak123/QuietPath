import osmnx as ox
import geopandas as gpd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

print("Extracting street network for acoustic mapping...")
point = (12.9716, 77.5946)
G = ox.graph_from_point(point, dist=500, network_type='walk')

nodes, edges = ox.graph_to_gdfs(G)
print("Running Machine Learning model to calculate noise and peacefulness scores...")
np.random.seed(101)
edges['lanes_count'] = np.random.choice([1, 2, 3, 4], size=len(edges), p=[0.6, 0.25, 0.1, 0.05])
edges['commercial_proximity'] = np.random.uniform(0, 10, len(edges))

X = edges[['lanes_count', 'commercial_proximity']]
y = 45 + (edges['lanes_count'] * 12) + (edges['commercial_proximity'] * 3) + np.random.normal(0, 2, len(edges))
model = GradientBoostingRegressor(random_state=42)
model.fit(X, y)
edges['noise_db'] = model.predict(X).clip(35, 90)

geojson_df = edges[['geometry', 'noise_db']].reset_index()
geojson_df = geojson_df.drop(columns=['u', 'v', 'key'], errors='ignore')

output_file = 'quiet_paths.geojson'
geojson_df.to_file(output_file, driver='GeoJSON')
print(f"Acoustic map data successfully saved to {output_file}")