#!/usr/bin/env python3
"""
gen-city-climate.py — build lib/city-climate.ts from public-domain US government
data, so every city page can state its own water-slide season in real numbers.

WHY THIS EXISTS
Google sent visitors to exactly the 17 city pages with hand-written local
profiles and to none of the 629 that were templates. Those templates were
56-78% word-for-word identical once the city name was swapped out — Amarillo and
Grand Prairie read as the same page, though one sits on the high plains at
3,590 ft and the other in the Dallas-Fort Worth heat. They differ; the pages did
not say so.

Writing 735 local profiles by hand is not realistic, and generating local prose
with a language model invents things — park names, permit offices — that are
wrong somewhere the day they publish. So this uses only measured data:

  * NOAA NCEI U.S. Climate Normals, 1991-2020, monthly. Average high and low,
    and the average number of days each month the high reaches 80 F and 90 F.
    Every figure traces to a named station. Public domain.
  * US Census Bureau 2023 Gazetteer (places + county subdivisions). The
    coordinates used to find each city's nearest station and its nearest
    neighbours. Public domain.
  * USGS 3DEP Elevation Point Query Service. Ground elevation, looked up only
    for cities where nearby stations sit at very different heights, so the
    station chosen is one at the city's own altitude. Public domain.

Nothing is inferred that the numbers do not show directly. The page copy built
from this file (lib/city-content.ts) attributes the station and its distance, so
a reader can check any figure.

Run:
    python3 scripts/gen-city-climate.py

Downloads ~30 MB into .cache/climate/ on the first run (gitignored), then writes
lib/city-climate.ts. Re-run after adding a city to lib/locations.ts.
"""

import csv
import io
import json
import math
import re
import subprocess
import sys
import tarfile
import unicodedata
import time
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache" / "climate"
OUT = ROOT / "lib" / "city-climate.ts"

SOURCES = {
    "places": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_place_national.zip",
    "cousubs": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_cousubs_national.zip",
    "temps": "https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/archive/us-climate-normals_1991-2020_v1.0.1_monthly_temperature_by-variable_c20230403.tar.gz",
}

# A month is "slide weather" when, on average, at least this many of its days
# reach 80 F. Ten is roughly a third of the month: enough that a booked date is
# likely to be warm, not merely possible.
WARM_DAYS_THRESHOLD = 10.0
# Only name a neighbouring city as nearby within this distance.
NEARBY_MAX_MI = 60.0
NEARBY_COUNT = 4

# "Nearest station" is wrong wherever the terrain is steep. Kihei, on Maui's
# sea-level leeward coast, was matched to Kula Hospital at 3,030 ft up
# Haleakala — and reported one warm day a year, when a sea-level station 1.3 mi
# farther shows 300+. Air cools about 3.5 F per 1,000 ft of climb, far more than
# ten flat miles changes it, so a station's elevation mismatch is charged as
# distance at this rate. Conservative: it only overrides "nearest" when the
# elevation gap is large.
MILES_PER_1000_FT = 10.0
# Only look a city's ground elevation up when its candidate stations disagree by
# at least this much. In flat country every nearby station sits at the same
# height, the choice cannot matter, and there is no reason to query USGS for it.
ELEV_SPREAD_FT = 500.0
CANDIDATE_RADIUS_MI = 25.0
ELEVATION_API = "https://epqs.nationalmap.gov/v1/json?x={lon}&y={lat}&units=Feet&wkid=4326"

# Exact Census names the generic matcher cannot reach: consolidated
# city-counties, CDPs, and New England / NJ towns and townships, which Census
# files as county subdivisions rather than places. `lat` picks between
# duplicates — Hawaii has two "Kailua CDP"s, New Jersey two "Hamilton township"s.
ALIASES = {
    ("GA", "Augusta"): ("places", "Augusta-Richmond County consolidated government (balance)", None),
    ("GA", "Macon"): ("places", "Macon-Bibb County", None),
    ("GA", "Athens"): ("places", "Athens-Clarke County unified government (balance)", None),
    ("HI", "Honolulu"): ("places", "Urban Honolulu CDP", None),
    ("HI", "Kailua-Kona"): ("places", "Kailua CDP", 19.6),  # Big Island, not Oahu (~21.4)
    ("HI", "Mililani"): ("places", "Mililani Town CDP", None),
    ("ID", "Boise"): ("places", "Boise City city", None),
    ("IN", "Indianapolis"): ("places", "Indianapolis city (balance)", None),
    ("KY", "Lexington"): ("places", "Lexington-Fayette urban county", None),
    ("MT", "Butte"): ("places", "Butte-Silver Bow (balance)", None),
    ("MT", "Anaconda"): ("places", "Anaconda-Deer Lodge County", None),
    ("NV", "Carson City"): ("places", "Carson City", None),
    ("NY", "New York City"): ("places", "New York city", None),
    ("TN", "Nashville"): ("places", "Nashville-Davidson metropolitan government (balance)", None),
    ("CT", "Milford"): ("cousubs", "Milford town", None),
    ("NH", "Salem"): ("cousubs", "Salem town", None),
    ("NH", "Merrimack"): ("cousubs", "Merrimack town", None),
    ("NJ", "Edison"): ("cousubs", "Edison township", None),
    ("NJ", "Hamilton"): ("cousubs", "Hamilton township", 40.2),  # Mercer Co., not Atlantic (~39.4)
    ("NJ", "Brick"): ("cousubs", "Brick township", None),
    ("NJ", "Cherry Hill"): ("cousubs", "Cherry Hill township", None),
    ("RI", "Coventry"): ("cousubs", "Coventry town", None),
    ("RI", "Cumberland"): ("cousubs", "Cumberland town", None),
    ("RI", "North Providence"): ("cousubs", "North Providence town", None),
}

# Census "internal points" that are not where the city is. A place's internal
# point only has to fall somewhere inside its boundary, and for a city that
# legally covers a huge area that can be nowhere near where anyone lives:
#   * San Francisco's sits ~33 mi out in the Pacific — the Farallon Islands are
#     part of the city — so its "nearest" station was chosen from the ocean.
#   * Anchorage's sits ~20 mi east of downtown in the Chugach Mountains (USGS
#     puts the ground there at 3,993 ft), which matched it to a mountain
#     trailhead station for a city that is essentially at sea level.
#   * Juneau, Sitka, Anaconda and Butte are consolidated city-boroughs and
#     city-counties spanning 700-2,900 sq mi of icefield and mountain.
# Checked against every city covering 300+ sq mi; the other 19 (Houston,
# Phoenix, Jacksonville...) are on flat ground within a few miles of downtown,
# where the offset changes nothing. Values are each city's downtown centre.
COORD_OVERRIDES = {
    "california/san-francisco": (37.7793, -122.4193),
    "alaska/anchorage": (61.2181, -149.9003),
    "alaska/juneau": (58.3019, -134.4197),
    "alaska/sitka": (57.0531, -135.3300),
    "montana/anaconda": (46.1285, -112.9423),
    "montana/butte": (46.0038, -112.5348),
}

LSAD_SUFFIXES = [
    " consolidated government (balance)", " metropolitan government (balance)",
    " unified government (balance)", " metro government (balance)",
    " city and borough", " city", " town", " village", " borough",
    " municipality", " cdp", " (balance)",
]
LSAD_RANK = {"city": 0, "municipality": 1, "town": 2, "village": 3, "borough": 3, "cdp": 5}


def fetch(name: str) -> Path:
    """Download a source once into the cache and return its path."""
    CACHE.mkdir(parents=True, exist_ok=True)
    url = SOURCES[name]
    dest = CACHE / url.rsplit("/", 1)[1]
    if not dest.exists():
        print(f"  downloading {name} ...", file=sys.stderr)
        urllib.request.urlretrieve(url, dest)
    return dest


def gazetteer_rows(name: str):
    with zipfile.ZipFile(fetch(name)) as z:
        member = next(n for n in z.namelist() if n.endswith(".txt"))
        text = z.read(member).decode("utf-8", errors="replace")
    reader = csv.reader(io.StringIO(text), delimiter="\t")
    header = [h.strip() for h in next(reader)]
    ix = {h: i for i, h in enumerate(header)}
    for row in reader:
        row = [c.strip() for c in row]
        yield {
            "usps": row[ix["USPS"]],
            "name": row[ix["NAME"]],
            "lat": float(row[ix["INTPTLAT"]]),
            "lon": float(row[ix["INTPTLONG"]]),
            "sqmi": float(row[ix["ALAND_SQMI"]]),
        }


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = s.replace("saint ", "st ").replace("st. ", "st ").replace("fort ", "ft ")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def split_lsad(name: str):
    low = name.lower()
    for suf in LSAD_SUFFIXES:
        if low.endswith(suf):
            kind = suf.strip().replace("(balance)", "").strip() or "city"
            return name[: -len(suf)], kind.split()[-1] if kind else "city"
    return name, "other"


def miles(a_lat, a_lon, b_lat, b_lon) -> float:
    r = 3958.8
    la1, lo1, la2, lo2 = map(math.radians, (a_lat, a_lon, b_lat, b_lon))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def load_cities():
    """The city list, straight from lib/locations.ts, so this can never drift."""
    script = (
        "const { getAllCities } = require('./lib/locations');"
        "console.log(JSON.stringify(getAllCities().map(c => ({"
        "key: `${c.state.slug}/${c.slug}`, name: c.name, abbr: c.state.abbr}))));"
    )
    out = subprocess.run(
        ["npx", "tsx", "-e", script], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout
    return json.loads(out.strip().splitlines()[-1])


def locate(cities):
    fuzzy = defaultdict(list)
    exact = {"places": defaultdict(list), "cousubs": defaultdict(list)}
    for kind in ("places", "cousubs"):
        for row in gazetteer_rows(kind):
            exact[kind][(row["usps"], row["name"])].append(row)
            if kind == "places":
                base, lsad = split_lsad(row["name"])
                fuzzy[(row["usps"], norm(base))].append({**row, "lsad": lsad})

    located, missing = [], []
    for c in cities:
        alias = ALIASES.get((c["abbr"], c["name"]))
        if alias:
            kind, cname, lat = alias
            cands = exact[kind].get((c["abbr"], cname), [])
            if lat is not None and len(cands) > 1:
                cands = [min(cands, key=lambda p: abs(p["lat"] - lat))]
        else:
            cands = sorted(
                fuzzy.get((c["abbr"], norm(c["name"])), []),
                key=lambda p: (LSAD_RANK.get(p["lsad"], 4), -p["sqmi"]),
            )
        if not cands:
            missing.append(c["key"])
            continue
        lat, lon = COORD_OVERRIDES.get(c["key"], (cands[0]["lat"], cands[0]["lon"]))
        located.append({**c, "lat": lat, "lon": lon})
    return located, missing


def load_normals():
    """Parse the NOAA files BY COLUMN NAME. Each variable spans four columns
    (value plus three flags); reading by position silently returns the wrong
    threshold, which is exactly what the first prototype of this did."""
    wanted = {
        "mly-normal-allall.csv": ["MLY-TMAX-NORMAL", "MLY-TMIN-NORMAL"],
        "mly-tmax-avgnds.csv": ["MLY-TMAX-AVGNDS-GRTH080", "MLY-TMAX-AVGNDS-GRTH090"],
    }
    data = defaultdict(lambda: defaultdict(dict))
    inventory = {}
    with tarfile.open(fetch("temps")) as tar:
        for member in tar.getmembers():
            base = member.name.rsplit("/", 1)[-1]
            if base == "mly_inventory.txt":
                # Fixed-width, not whitespace-delimited: station names contain
                # spaces, and splitting on whitespace ran the trailing WMO id
                # into the name ("DALLAS FAA AP 72258"). Offsets verified
                # against real rows.
                for line in tar.extractfile(member).read().decode("utf-8", "replace").splitlines():
                    state = line[38:40]
                    if len(line) < 41 or not re.fullmatch(r"[A-Z]{2}", state):
                        continue
                    inventory[line[0:11]] = {
                        "lat": float(line[12:20]),
                        "lon": float(line[21:30]),
                        "elev_ft": round(float(line[31:37]) * 3.28084),
                        "name": line[41:71].strip(),
                    }
            if base in wanted:
                text = tar.extractfile(member).read().decode("utf-8", "replace")
                reader = csv.reader(io.StringIO(text))
                header = [h.strip() for h in next(reader)]
                ix = {h: i for i, h in enumerate(header)}
                for col in wanted[base]:
                    assert col in ix, f"{col} missing from {base}"
                for row in reader:
                    sid, month = row[ix["GHCN_ID"]].strip(), int(row[ix["month"]])
                    for col in wanted[base]:
                        try:
                            data[sid][month][col] = float(row[ix[col]])
                        except ValueError:
                            pass
    cols = [c for cs in wanted.values() for c in cs]
    complete = {
        sid for sid, months in data.items()
        if sid in inventory and len(months) == 12
        and all(col in months[m] for m in range(1, 13) for col in cols)
    }
    return data, inventory, complete


def ground_elevations(points):
    """USGS ground elevation for {key: (lat, lon)}, cached on disk.

    The service takes several seconds a request, so results persist in the
    cache and a re-run asks for nothing it already knows. Concurrency is kept
    low on purpose: this is a free public service, not ours to hammer."""
    # Keyed by COORDINATE, not by city: keyed by city, correcting a city's
    # coordinates would silently keep serving the elevation of the old, wrong
    # point from cache — which is exactly what it did for Anchorage.
    cache_file = CACHE / "elevations-by-coord.json"
    cache = json.loads(cache_file.read_text()) if cache_file.exists() else {}
    coord = {k: f"{lat:.4f},{lon:.4f}" for k, (lat, lon) in points.items()}
    todo = [k for k in points if coord[k] not in cache]

    def one(key):
        lat, lon = points[key]
        for attempt in range(4):
            try:
                with urllib.request.urlopen(ELEVATION_API.format(lat=lat, lon=lon), timeout=60) as r:
                    value = json.loads(r.read())["value"]
                if value is not None and float(value) > -1000:
                    return key, round(float(value))
            except Exception:
                time.sleep(2 * (attempt + 1))
        return key, None

    if todo:
        print(f"  looking up ground elevation for {len(todo)} cities (USGS) ...", file=sys.stderr)
        with ThreadPoolExecutor(max_workers=5) as pool:
            for i, (key, elev) in enumerate(pool.map(one, todo), 1):
                if elev is not None:
                    cache[coord[key]] = elev
                if i % 25 == 0:
                    cache_file.write_text(json.dumps(cache))
        cache_file.write_text(json.dumps(cache))
    return {k: cache.get(coord[k]) for k in points}


def season(d80):
    """Longest contiguous run of months at or above the warm-days threshold.
    Returns (start, end) as 0-based month indexes, "all" for year-round, or None."""
    warm = [v >= WARM_DAYS_THRESHOLD for v in d80]
    if all(warm):
        return "all"
    best, run_start = None, None
    for i, w in enumerate(warm + [False]):
        if w and run_start is None:
            run_start = i
        elif not w and run_start is not None:
            if best is None or (i - run_start) > (best[1] - best[0] + 1):
                best = (run_start, i - 1)
            run_start = None
    return best


def main():
    cities = load_cities()
    located, missing = locate(cities)
    if missing:
        sys.exit(f"Could not place {len(missing)} cities on the map: {', '.join(missing)}")

    data, inventory, complete = load_normals()
    stations = [(sid, inventory[sid]) for sid in complete]
    print(f"  {len(located)} cities located, {len(stations)} complete stations", file=sys.stderr)

    # Candidate stations per city, and which cities sit in terrain steep enough
    # that the nearest station may be at the wrong altitude.
    candidates, steep = {}, {}
    for c in located:
        near = sorted(
            (miles(c["lat"], c["lon"], st["lat"], st["lon"]), sid, st) for sid, st in stations
        )
        pool = [n for n in near if n[0] <= CANDIDATE_RADIUS_MI] or near[:1]
        candidates[c["key"]] = pool
        heights = [st["elev_ft"] for _, _, st in pool]
        if len(heights) > 1 and max(heights) - min(heights) >= ELEV_SPREAD_FT:
            steep[c["key"]] = (c["lat"], c["lon"])
    ground = ground_elevations(steep)

    records = {}
    worst = (0.0, "")
    moved = []
    for c in located:
        pool = candidates[c["key"]]
        city_ft = ground.get(c["key"])
        if city_ft is None:
            dist, sid, st = pool[0]
        else:
            dist, sid, st = min(
                pool, key=lambda n: n[0] + abs(n[2]["elev_ft"] - city_ft) / 1000 * MILES_PER_1000_FT
            )
            if sid != pool[0][1]:
                moved.append((c["key"], pool[0][2]["name"], pool[0][2]["elev_ft"], st["name"], st["elev_ft"], city_ft))
        worst = max(worst, (dist, c["key"]))
        m = data[sid]
        d80_raw = [m[i]["MLY-TMAX-AVGNDS-GRTH080"] for i in range(1, 13)]
        records[c["key"]] = {
            "stationId": sid,
            "station": st["name"],
            "stationMi": round(dist, 1),
            "elevFt": st["elev_ft"],
            "high": [round(m[i]["MLY-TMAX-NORMAL"]) for i in range(1, 13)],
            "low": [round(m[i]["MLY-TMIN-NORMAL"]) for i in range(1, 13)],
            "d80": [round(v) for v in d80_raw],
            "d90": [round(m[i]["MLY-TMAX-AVGNDS-GRTH090"]) for i in range(1, 13)],
            "warmDays": round(sum(d80_raw)),
            "season": season(d80_raw),
            "_lat": c["lat"],
            "_lon": c["lon"],
        }

    for key, r in records.items():
        near = sorted(
            (miles(r["_lat"], r["_lon"], o["_lat"], o["_lon"]), k)
            for k, o in records.items() if k != key
        )
        r["nearby"] = [[k, round(d)] for d, k in near if d <= NEARBY_MAX_MI][:NEARBY_COUNT]

    print(f"  terrain-checked {len(steep)} cities; station changed for {len(moved)}:", file=sys.stderr)
    for key, a, a_ft, b, b_ft, city_ft in sorted(moved):
        print(f"    {key:34} ground {city_ft:>5} ft: {a} ({a_ft} ft) -> {b} ({b_ft} ft)", file=sys.stderr)

    if worst[0] > 30:
        sys.exit(f"Nearest station for {worst[1]} is {worst[0]:.0f} mi away — check its coordinates")

    lines = [
        "// AUTO-GENERATED by scripts/gen-city-climate.py — do not edit by hand.",
        "//",
        "// Sources (both US government, public domain):",
        "//   NOAA NCEI U.S. Climate Normals 1991-2020, monthly temperature normals",
        "//   US Census Bureau 2023 Gazetteer, places and county subdivisions",
        "//",
        "// Every figure is from the named station nearest the city. Nothing here is",
        "// estimated or written: see the generator for how each value is derived.",
        "",
        "export type CityClimate = {",
        "  /** GHCN-Daily station identifier, for anyone checking a figure. */",
        "  stationId: string;",
        "  /** NOAA station name, as NOAA writes it. */",
        "  station: string;",
        "  /** Miles from the city to that station. */",
        "  stationMi: number;",
        "  /** Station elevation in feet. */",
        "  elevFt: number;",
        "  /** Average daily high, Jan..Dec, degrees F. */",
        "  high: number[];",
        "  /** Average daily low, Jan..Dec, degrees F. */",
        "  low: number[];",
        "  /** Average number of days each month the high reaches 80 F. */",
        "  d80: number[];",
        "  /** Average number of days each month the high reaches 90 F. */",
        "  d90: number[];",
        "  /** Average days a year the high reaches 80 F. */",
        "  warmDays: number;",
        f"  /** Longest run of months averaging {int(WARM_DAYS_THRESHOLD)}+ days at 80 F: [first, last] as",
        "      0-based month indexes, \"all\" for year-round, or null if no month qualifies. */",
        "  season: [number, number] | \"all\" | null;",
        f"  /** Other cities we serve within {int(NEARBY_MAX_MI)} miles: [key, miles], nearest first. */",
        "  nearby: [string, number][];",
        "};",
        "",
        "export const CITY_CLIMATE: Record<string, CityClimate> = {",
    ]
    for key in sorted(records):
        r = {k: v for k, v in records[key].items() if not k.startswith("_")}
        lines.append(f"  {json.dumps(key)}: {json.dumps(r, separators=(',', ':'))},")
    lines += [
        "};",
        "",
        "export function getCityClimate(stateSlug: string, citySlug: string): CityClimate | null {",
        "  return CITY_CLIMATE[`${stateSlug}/${citySlug}`] ?? null;",
        "}",
        "",
    ]
    OUT.write_text("\n".join(lines))
    print(f"  wrote {OUT.relative_to(ROOT)}: {len(records)} cities, max station distance {worst[0]:.1f} mi ({worst[1]})", file=sys.stderr)


if __name__ == "__main__":
    main()
