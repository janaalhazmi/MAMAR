import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";

function MamarMap() {
  return (
    <div className="mamar-map-container">
      <arcgis-map
        item-id="7371729f1ff240038c3a8155edebfeda"
        className="mamar-map"
      >
        <arcgis-zoom slot="top-left" />
      </arcgis-map>
    </div>
  );
}

export default MamarMap;