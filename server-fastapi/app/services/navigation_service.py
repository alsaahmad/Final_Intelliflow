import os
import math
import heapq
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Tuple, Optional, Set
from fastapi import HTTPException, status
from scipy.spatial import cKDTree

ROUTABLE_HIGHWAYS = {
    "primary", "secondary", "tertiary", "residential", "unclassified",
    "trunk", "motorway", "motorway_link", "trunk_link", "primary_link",
    "secondary_link", "tertiary_link", "living_street", "service"
}

SPEED_FALLBACKS_KMPH = {
    "primary": 60.0,
    "trunk": 60.0,
    "primary_link": 50.0,
    "secondary": 50.0,
    "secondary_link": 40.0,
    "tertiary": 40.0,
    "tertiary_link": 30.0,
    "residential": 30.0,
    "unclassified": 30.0,
    "living_street": 20.0,
    "service": 20.0,
}
DEFAULT_SPEED_KMPH = 30.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance between two points in meters using Haversine formula."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class NavigationService:
    def __init__(self, osm_path: Optional[str] = None):
        if osm_path is None:
            # Default relative path from backend root to sector_a.osm
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
            osm_path = os.path.join(base_dir, "SUMO", "networks", "sector_a", "sector_a.osm")
        
        self.osm_path = os.path.abspath(osm_path)
        self.nodes: Dict[str, Tuple[float, float]] = {}  # node_id -> (lat, lon)
        self.graph: Dict[str, List[Dict[str, Any]]] = {}  # u -> list of edge dicts
        self.node_id_list: List[str] = []
        self.kdtree: Optional[cKDTree] = None
        self._is_loaded = False
        
        # Parse and build graph lazily or on init
        self._load_osm_graph()

    def _load_osm_graph(self):
        """Parses sector_a.osm and constructs spatial routing graph."""
        if not os.path.exists(self.osm_path):
            raise FileNotFoundError(f"OSM network dataset missing at path: {self.osm_path}")

        tree = ET.parse(self.osm_path)
        root = tree.getroot()

        # 1. Parse all nodes
        for node in root.findall("node"):
            nid = node.attrib["id"]
            lat = float(node.attrib["lat"])
            lon = float(node.attrib["lon"])
            self.nodes[nid] = (lat, lon)

        # 2. Parse ways and construct directed edges
        for way in root.findall("way"):
            tags = {t.attrib["k"]: t.attrib["v"] for t in way.findall("tag")}
            hw = tags.get("highway")
            if not hw or hw not in ROUTABLE_HIGHWAYS:
                continue

            way_id = way.attrib["id"]
            street_name = tags.get("name", f"{hw.capitalize()} Road")

            # Determine speed limit
            speed_kmph = SPEED_FALLBACKS_KMPH.get(hw, DEFAULT_SPEED_KMPH)
            if "maxspeed" in tags:
                try:
                    val = "".join(filter(str.isdigit, tags["maxspeed"]))
                    if val:
                        speed_kmph = float(val)
                except ValueError:
                    pass

            speed_mps = (speed_kmph * 1000.0) / 3600.0

            # One-way directional logic
            oneway_tag = tags.get("oneway", "no").lower()
            is_junction_roundabout = tags.get("junction") == "roundabout"
            
            is_oneway_forward = oneway_tag in ["yes", "1", "true"] or is_junction_roundabout
            is_oneway_reverse = oneway_tag == "-1"

            nd_refs = [nd.attrib["ref"] for nd in way.findall("nd") if nd.attrib["ref"] in self.nodes]

            for i in range(len(nd_refs) - 1):
                u = nd_refs[i]
                v = nd_refs[i + 1]
                lat1, lon1 = self.nodes[u]
                lat2, lon2 = self.nodes[v]
                seg_len = haversine_distance(lat1, lon1, lat2, lon2)
                if seg_len <= 0.001:
                    continue  # Ignore zero-length overlapping nodes

                seg_time = seg_len / speed_mps

                edge_forward = {
                    "v": v,
                    "way_id": way_id,
                    "name": street_name,
                    "highway": hw,
                    "length": seg_len,
                    "speed_kmph": speed_kmph,
                    "time_sec": seg_time,
                    "coords": [(lat1, lon1), (lat2, lon2)],
                }
                edge_reverse = {
                    "v": u,
                    "way_id": way_id,
                    "name": street_name,
                    "highway": hw,
                    "length": seg_len,
                    "speed_kmph": speed_kmph,
                    "time_sec": seg_time,
                    "coords": [(lat2, lon2), (lat1, lon1)],
                }

                if is_oneway_forward:
                    self.graph.setdefault(u, []).append(edge_forward)
                elif is_oneway_reverse:
                    self.graph.setdefault(v, []).append(edge_reverse)
                else:
                    self.graph.setdefault(u, []).append(edge_forward)
                    self.graph.setdefault(v, []).append(edge_reverse)

        # 3. Construct spatial KDTree for snapping
        routable_nodes = list(self.graph.keys())
        coords_matrix = []
        for nid in routable_nodes:
            lat, lon = self.nodes[nid]
            # Approximate metric projection around center of Delhi (lat ~ 28.61, lon ~ 77.22)
            x = lon * 111320.0 * math.cos(math.radians(28.61))
            y = lat * 110540.0
            coords_matrix.append((x, y))
            self.node_id_list.append(nid)

        if coords_matrix:
            self.kdtree = cKDTree(coords_matrix)

        self._is_loaded = True

    def snap_to_nearest_node(self, lat: float, lon: float, max_distance_meters: float = 500.0) -> Tuple[str, float, float, float]:
        """Snaps lat/lon coordinate to nearest routable node in OSM graph within distance threshold."""
        if not self.kdtree or not self.node_id_list:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"success": False, "error": "GRAPH_NOT_INITIALIZED", "message": "OSM navigation graph is not initialized."}
            )

        qx = lon * 111320.0 * math.cos(math.radians(28.61))
        qy = lat * 110540.0
        dist, idx = self.kdtree.query((qx, qy))
        
        nearest_nid = self.node_id_list[idx]
        n_lat, n_lon = self.nodes[nearest_nid]
        actual_dist = haversine_distance(lat, lon, n_lat, n_lon)

        if actual_dist > max_distance_meters:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": "COORDINATE_OUT_OF_BOUNDS",
                    "message": f"Requested coordinate ({lat:.5f}, {lon:.5f}) is {actual_dist:.1f}m away, exceeding maximum snap threshold of {max_distance_meters}m from routing network.",
                }
            )

        return nearest_nid, n_lat, n_lon, actual_dist

    def _find_path_astar(self, start_node: str, end_node: str, preference: str = "FASTEST", penalized_edges: Optional[Set[Tuple[str, str]]] = None) -> Optional[Dict[str, Any]]:
        """Executes A* search algorithm over the OSM graph."""
        if start_node not in self.nodes or end_node not in self.nodes:
            return None

        dest_lat, dest_lon = self.nodes[end_node]
        penalized_edges = penalized_edges or set()

        # Priority queue: (f_score, current_node)
        open_set = []
        heapq.heappush(open_set, (0.0, start_node))

        came_from: Dict[str, Tuple[str, Dict[str, Any]]] = {}  # node -> (parent_node, edge_used)
        g_score: Dict[str, float] = {start_node: 0.0}

        max_speed_mps = 60.0 * 1000.0 / 3600.0

        def heuristic(nid: str) -> float:
            nlat, nlon = self.nodes[nid]
            dist = haversine_distance(nlat, nlon, dest_lat, dest_lon)
            if preference == "SHORTEST":
                return dist
            return dist / max_speed_mps

        f_score: Dict[str, float] = {start_node: heuristic(start_node)}

        visited = set()

        while open_set:
            _, current = heapq.heappop(open_set)

            if current == end_node:
                # Reconstruct path
                path_edges = []
                curr = end_node
                while curr in came_from:
                    parent, edge = came_from[curr]
                    path_edges.append(edge)
                    curr = parent
                path_edges.reverse()
                return self._build_route_result(start_node, end_node, path_edges, preference)

            if current in visited:
                continue
            visited.add(current)

            for edge in self.graph.get(current, []):
                neighbor = edge["v"]
                edge_cost = edge["length"] if preference == "SHORTEST" else edge["time_sec"]

                # Apply penalty for alternative route calculation
                if (current, neighbor) in penalized_edges:
                    edge_cost *= 1.5

                tentative_g = g_score[current] + edge_cost

                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = (current, edge)
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = tentative_g + heuristic(neighbor)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))

        return None

    def _build_route_result(self, start_node: str, end_node: str, edges: List[Dict[str, Any]], preference: str) -> Dict[str, Any]:
        """Formats reconstructed path edges into route geometry and step maneuvers."""
        if not edges:
            s_lat, s_lon = self.nodes[start_node]
            return {
                "distance_meters": 0.0,
                "duration_seconds": 0.0,
                "formatted_eta": "0 min 0 sec",
                "geometry": {"type": "LineString", "coordinates": [[s_lon, s_lat]]},
                "steps": [],
                "edges": [],
            }

        total_distance = sum(e["length"] for e in edges)
        total_duration = sum(e["time_sec"] for e in edges)

        # Build continuous GeoJSON LineString coordinates [lon, lat]
        coordinates: List[List[float]] = []
        coordinates.append([edges[0]["coords"][0][1], edges[0]["coords"][0][0]])

        for edge in edges:
            coordinates.append([edge["coords"][1][1], edge["coords"][1][0]])

        # Format turn steps by grouping consecutive edges with identical street names
        steps: List[Dict[str, Any]] = []
        if edges:
            curr_name = edges[0]["name"]
            curr_hw = edges[0]["highway"]
            curr_dist = 0.0
            curr_dur = 0.0

            for edge in edges:
                if edge["name"] == curr_name:
                    curr_dist += edge["length"]
                    curr_dur += edge["time_sec"]
                else:
                    steps.append({
                        "street_name": curr_name,
                        "highway_type": curr_hw,
                        "distance_meters": round(curr_dist, 1),
                        "duration_seconds": round(curr_dur, 1),
                        "instruction": f"Follow {curr_name} for {int(curr_dist)}m",
                    })
                    curr_name = edge["name"]
                    curr_hw = edge["highway"]
                    curr_dist = edge["length"]
                    curr_dur = edge["time_sec"]

            steps.append({
                "street_name": curr_name,
                "highway_type": curr_hw,
                "distance_meters": round(curr_dist, 1),
                "duration_seconds": round(curr_dur, 1),
                "instruction": f"Follow {curr_name} for {int(curr_dist)}m to destination",
            })

        # Format ETA string
        mins = int(total_duration // 60)
        secs = int(total_duration % 60)
        eta_str = f"{mins} min {secs} sec" if mins > 0 else f"{secs} sec"

        return {
            "distance_meters": round(total_distance, 1),
            "duration_seconds": round(total_duration, 1),
            "formatted_eta": eta_str,
            "geometry": {"type": "LineString", "coordinates": coordinates},
            "steps": steps,
            "edges": [(e["coords"][0], e["coords"][1]) for e in edges],
        }

    def calculate_route(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        preference: str = "FASTEST",
        include_alternatives: bool = True,
    ) -> Dict[str, Any]:
        """Snaps origin/destination and calculates primary and optional alternative routes."""
        pref_upper = preference.upper()
        if pref_upper not in ["FASTEST", "SHORTEST"]:
            pref_upper = "FASTEST"

        start_nid, s_lat, s_lon, s_dist = self.snap_to_nearest_node(origin_lat, origin_lon)
        end_nid, d_lat, d_lon, d_dist = self.snap_to_nearest_node(dest_lat, dest_lon)

        # Primary route calculation
        primary_res = self._find_path_astar(start_nid, end_nid, preference=pref_upper)
        if not primary_res:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": "NO_ROUTE_FOUND",
                    "message": "No valid road route exists between the specified origin and destination points.",
                }
            )

        routes_list = [
            {
                "route_type": f"PRIMARY_{pref_upper}",
                "distance_meters": primary_res["distance_meters"],
                "duration_seconds": primary_res["duration_seconds"],
                "formatted_eta": primary_res["formatted_eta"],
                "geometry": primary_res["geometry"],
                "steps": primary_res["steps"],
            }
        ]

        # Alternative route calculation (if requested and path has multiple edges)
        if include_alternatives and len(primary_res.get("edges", [])) > 2:
            penalized = set()
            for u_coord, v_coord in primary_res.get("edges", []):
                # Find matching edge nodes
                for u_node, edges in self.graph.items():
                    for edge in edges:
                        if edge["coords"][0] == u_coord and edge["coords"][1] == v_coord:
                            penalized.add((u_node, edge["v"]))

            alt_res = self._find_path_astar(start_nid, end_nid, preference=pref_upper, penalized_edges=penalized)
            if alt_res and alt_res["distance_meters"] > 0:
                # Check that alternative is distinct (not identical geometry)
                if alt_res["geometry"]["coordinates"] != primary_res["geometry"]["coordinates"]:
                    routes_list.append({
                        "route_type": "ALTERNATIVE",
                        "distance_meters": alt_res["distance_meters"],
                        "duration_seconds": alt_res["duration_seconds"],
                        "formatted_eta": alt_res["formatted_eta"],
                        "geometry": alt_res["geometry"],
                        "steps": alt_res["steps"],
                    })

        route_id = f"route_osm_{start_nid}_{end_nid}"

        return {
            "success": True,
            "route_id": route_id,
            "origin": {"latitude": origin_lat, "longitude": origin_lon},
            "snapped_origin": {
                "latitude": s_lat,
                "longitude": s_lon,
                "osm_node_id": start_nid,
                "distance_to_road_meters": round(s_dist, 1),
            },
            "destination": {"latitude": dest_lat, "longitude": dest_lon},
            "snapped_destination": {
                "latitude": d_lat,
                "longitude": d_lon,
                "osm_node_id": end_nid,
                "distance_to_road_meters": round(d_dist, 1),
            },
            "selected_preference": pref_upper,
            "routes": routes_list,
            "data_source": "OPENSTREETMAP_SECTOR_A",
            "is_simulated": False,
            "data_origin": "REAL_OSM_NETWORK",
        }


# Singleton instance
navigation_service = NavigationService()
