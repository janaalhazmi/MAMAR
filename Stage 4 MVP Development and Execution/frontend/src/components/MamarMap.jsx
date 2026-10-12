import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";

function MamarMap() {
  return (
    <div className="mamar-map-container">
      <arcgis-map
        basemap="streets-navigation-vector"
        center="46.6753,24.7136"
        zoom="11"
        className="mamar-map"
      >
        <arcgis-zoom slot="top-left" />
      </arcgis-map>
    </div>
  );
}

export default MamarMap;
