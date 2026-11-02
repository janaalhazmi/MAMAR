// src/services/workZoneLayer.js
// ---------------------------------------------------------------------------
// The project location lives in ArcGIS Online, as in Stage 3:
//   MAMAR Projects (layer 4)        -> the work zone polygon of each project_id
//   MAMAR Traffic Devices (layer 1) -> the planned point of each device
//
// Reading works now. SAVING needs "Create" and "Update" turned on for the
// MAMAR Projects layer in ArcGIS Online (Settings > Editing). Until then
// saveWorkZone() fails with a clear message and the project is still saved in
// PostgreSQL.
// ---------------------------------------------------------------------------

const SERVICE_URL =
  "https://services5.arcgis.com/kGzNyz7ldsPH1gDF/arcgis/rest/services/MAMAR_Web_Map_WFL1/FeatureServer";
const PROJECTS_LAYER = `${SERVICE_URL}/4`;
const DEVICES_LAYER = `${SERVICE_URL}/1`;

const EDITING_OFF =
  "The project location could not be saved on the map, because editing is turned off for the MAMAR Projects layer in ArcGIS Online.";

async function arcgis(url, params, method = "GET") {
  const body = new URLSearchParams({ ...params, f: "json" });
  let response;
  try {
    response =
      method === "POST"
        ? await fetch(url, { method: "POST", body })
        : await fetch(`${url}?${body}`);
  } catch {
    throw new Error("The map service could not be reached. Please try again.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.error) {
    const error = new Error(data?.error?.message || "The map service refused the request.");
    error.code = data?.error?.code;
    throw error;
  }
  return data;
}

function toEpoch(dateText) {
  // "2026-11-01" -> milliseconds, as ArcGIS date fields expect.
  return dateText ? new Date(`${dateText}T00:00:00Z`).getTime() : null;
}

function centerOf(ring) {
  // The average of the boundary points: close enough for a work zone of a few streets.
  const points = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring.slice(0, -1)
    : ring;
  const sum = points.reduce((total, [x, y]) => [total[0] + x, total[1] + y], [0, 0]);
  return { longitude: sum[0] / points.length, latitude: sum[1] / points.length };
}

async function findProjectFeature(projectId) {
  const data = await arcgis(`${PROJECTS_LAYER}/query`, {
    where: `project_id = ${Number(projectId)}`,
    outFields: "OBJECTID,project_id",
    returnGeometry: "true",
    outSR: "4326",
  });
  return data.features?.[0] || null;
}

export async function saveWorkZone({ projectId, contractorId, project }) {
  // Adds the polygon of a new project, or updates it if the project is already in the layer.
  const ring = project.workZone || [];
  if (ring.length < 3) throw new Error("Draw the work zone before saving.");

  const feature = {
    geometry: {
      rings: [[...ring, ring[0]]],
      spatialReference: { wkid: 4326 },
    },
    attributes: {
      project_id: Number(projectId),
      project_name: project.name,
      contractor_id: contractorId ?? null,
      project_status: "Draft",
      start_date: toEpoch(project.startDate),
      end_date: toEpoch(project.endDate),
      description: (project.description || "").slice(0, 500),
      work_zone_area: project.area ?? null,
    },
  };

  try {
    const existing = await findProjectFeature(projectId);
    const edits = existing
      ? { updates: JSON.stringify([{ ...feature, attributes: { ...feature.attributes, OBJECTID: existing.attributes.OBJECTID } }]) }
      : { adds: JSON.stringify([feature]) };
    const result = await arcgis(`${PROJECTS_LAYER}/applyEdits`, edits, "POST");
    const outcome = (result.addResults || result.updateResults || [])[0];
    if (!outcome?.success) {
      throw new Error(outcome?.error?.description || "The map service did not save the work zone.");
    }
    return true;
  } catch (error) {
    if (error.code === 400 || /not supported|editing|permission/i.test(error.message)) {
      throw new Error(EDITING_OFF, { cause: error });
    }
    throw error;
  }
}

export async function getWorkZone(projectId) {
  // { latitude, longitude, workZone: [[lon, lat], ...] } of a project, or null.
  if (projectId == null) return null;
  const feature = await findProjectFeature(projectId);
  const ring = feature?.geometry?.rings?.[0];
  if (!ring || ring.length < 3) return null;
  const workZone = ring.slice(0, -1).map(([x, y]) => [Number(x.toFixed(6)), Number(y.toFixed(6))]);
  return { ...centerOf(ring), workZone };
}

export async function getTrafficDevice(device) {
  // A device by its number (3001) or code (TC-001), with its planned point.
  const where = /^\d+$/.test(device)
    ? `device_id = ${Number(device)}`
    : `device_code = '${String(device).replace(/[^A-Za-z0-9_-]/g, "")}'`;
  const data = await arcgis(`${DEVICES_LAYER}/query`, {
    where,
    outFields: "device_id,device_code,device_type,device_status,project_id",
    returnGeometry: "true",
    outSR: "4326",
  });
  const feature = data.features?.[0];
  if (!feature) return null;
  return {
    ...feature.attributes,
    latitude: feature.geometry?.y,
    longitude: feature.geometry?.x,
  };
}
