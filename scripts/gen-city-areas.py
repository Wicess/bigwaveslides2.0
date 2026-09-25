#!/usr/bin/env python3
"""
gen-city-areas.py — build lib/city-areas.ts: the real neighbouring communities
we deliver to, for every city that has no hand-written list.

WHY THIS EXISTS
Naming the actual places around a town is the one fact that is true of that page
and false of every other, and it is what the growth playbook (§1) calls the
strongest "genuinely about this city" signal. 123 cities had such a list, written
by hand. The other 629 had nothing — including 179 of the 189 cities in the
low-competition states that the playbook's Search Console data shows are the
ones that actually rank and convert.

Hand-writing 629 lists is not realistic, and asking a language model to name
suburbs invents places that do not exist. So the list is derived instead:

  * US Census Bureau 2023 Gazetteer — every place in the country, with
    coordinates. Public domain.
  * Census Population Estimates (sub-est2023), incorporated places — so the
    places named are ones a local would recognise, not the nearest hamlet.
    Public domain.

Every name is a real, incorporated US place. Nothing is generated prose.

Two deliberate exclusions:
  * the city itself;
  * any place that is already a city in lib/locations.ts, because those have
    their own page and are listed separately as "nearby cities we also serve".
    Without this the two lists on the page would repeat each other.

Hand-written entries in lib/city-local.ts always win — see getCityLocal. This
file only fills the gaps.

Run:
    python3 scripts/gen-city-areas.py
"""

import csv
import io
import json
import math
import re
import subprocess
import sys
import unicodedata
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache" / "climate"
OUT = ROOT / "lib" / "city-areas.ts"

GAZETTEER = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_place_national.zip"
POPULATION = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2023/cities/totals/sub-est2023.csv"

# A named place should be somewhere a local would actually recognise as nearby.
NEAR_MI = 30.0
# Rural states genuinely have nothing within 30 miles; widen before giving up.
FAR_MI = 50.0
MIN_POP = 1000
MAX_AREAS = 8
MIN_AREAS = 2

STATE_FIPS_TO_USPS = {}

LSAD_SUFFIXES = [
    " consolidated government (balance)", " metropolitan government (balance)",
    " unified government (balance)", " metro government (balance)",
    " city and borough", " city", " town", " village", " borough",
    " municipality", " cdp", " (balance)",
]


def fetch(url: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    dest = CACHE / url.rsplit("/", 1)[1]
    if not dest.exists():
        print(f"  downloading {dest.name} ...", file=sys.stderr)
        urllib.request.urlretrieve(url, dest)
    return dest


def strip_lsad(name: str) -> str:
    low = name.lower()
    for suf in LSAD_SUFFIXES:
        if low.endswith(suf):
            return name[: -len(suf)].strip()
    return name.strip()


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def miles(a_lat, a_lon, b_lat, b_lon) -> float:
    r = 3958.8
    la1, lo1, la2, lo2 = map(math.radians, (a_lat, a_lon, b_lat, b_lon))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def load_cities():
    """Our own catalogue, straight from lib/locations.ts so it cannot drift."""
    script = (
        "const { getAllCities } = require('./lib/locations');"
        "const { LOCAL_CITY_KEYS } = require('./lib/city-local');"
        "console.log(JSON.stringify({cities: getAllCities().map(c => ({"
        "key: `${c.state.slug}/${c.slug}`, name: c.name, abbr: c.state.abbr})),"
        "written: LOCAL_CITY_KEYS}));"
    )
    out = subprocess.run(
        ["npx", "tsx", "-e", script], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout
    return json.loads(out.strip().splitlines()[-1])


def load_places():
    """Every incorporated US place with coordinates and a population."""
    pops = {}
    with open(fetch(POPULATION), encoding="latin-1") as f:
        for r in csv.DictReader(f):
            if r["SUMLEV"] != "162":
                continue
            geoid = f'{int(r["STATE"]):02d}{int(r["PLACE"]):05d}'
            try:
                pops[geoid] = int(r["POPESTIMATE2023"] or 0)
            except ValueError:
                pass

    with zipfile.ZipFile(fetch(GAZETTEER)) as z:
        text = z.read(next(n for n in z.namelist() if n.endswith(".txt"))).decode("utf-8", "replace")
    reader = csv.reader(io.StringIO(text), delimiter="\t")
    header = [h.strip() for h in next(reader)]
    ix = {h: i for i, h in enumerate(header)}

    places = []
    for row in reader:
        row = [c.strip() for c in row]
        geoid = row[ix["GEOID"]]
        pop = pops.get(geoid)
        if not pop or pop < MIN_POP:
            continue
        usps = row[ix["USPS"]]
        STATE_FIPS_TO_USPS[geoid[:2]] = usps
        places.append({
            "name": strip_lsad(row[ix["NAME"]]),
            "usps": usps,
            "lat": float(row[ix["INTPTLAT"]]),
            "lon": float(row[ix["INTPTLONG"]]),
            "pop": pop,
        })
    return places


def main():
    cat = load_cities()
    cities, written = cat["cities"], set(cat["written"])
    places = load_places()
    print(f"  {len(places)} incorporated places over {MIN_POP:,} people", file=sys.stderr)

    # Where each of our own cities is, so a neighbour can be matched to a page.
    coords = json.loads((CACHE / "city-coords.json").read_text()) if (CACHE / "city-coords.json").exists() else None
    if not coords:
        sys.exit(
            "Missing .cache/climate/city-coords.json — run scripts/gen-city-climate.py first;\n"
            "this reuses the coordinates it resolves."
        )

    # Names that already have their own page, so they are not repeated here.
    ours = {(norm(c["name"]), c["abbr"]) for c in cities}

    result, thin = {}, []
    for c in cities:
        if c["key"] in written:
            continue  # a person wrote this one; never overwrite it
        pt = coords.get(c["key"])
        if not pt:
            continue
        lat, lon = pt

        near = []
        for p in places:
            if (norm(p["name"]), p["usps"]) in ours:
                continue
            d = miles(lat, lon, p["lat"], p["lon"])
            if d <= FAR_MI:
                near.append((d, p))
        if not near:
            thin.append(c["key"])
            continue

        within = [x for x in near if x[0] <= NEAR_MI] or near
        # Choose by population, so the names are ones a local recognises rather
        # than the nearest hamlet; then list them nearest first, which is how
        # someone thinks about the places around their own town.
        picked = sorted(within, key=lambda x: -x[1]["pop"])[:MAX_AREAS]
        if len(picked) < MIN_AREAS:
            thin.append(c["key"])
            continue
        picked.sort(key=lambda x: x[0])

        result[c["key"]] = [
            p["name"] if p["usps"] == c["abbr"] else f'{p["name"]}, {p["usps"]}'
            for _, p in picked
        ]

    lines = [
        "// AUTO-GENERATED by scripts/gen-city-areas.py — do not edit by hand.",
        "//",
        "// The real neighbouring communities around each city, for the cities nobody",
        "// has written a list for. Every name is an incorporated US place from the",
        "// Census Bureau 2023 Gazetteer, filtered to places of "
        f"{MIN_POP:,}+ people using",
        "// Census population estimates, and within "
        f"{int(NEAR_MI)} miles ({int(FAR_MI)} where a state is",
        "// sparse enough that nothing is closer). Both sources public domain.",
        "//",
        "// Excludes the city itself, and any place that already has its own page —",
        "// those are listed separately as nearby cities we serve.",
        "//",
        "// Hand-written lists in lib/city-local.ts always win; this only fills gaps.",
        "",
        "export const CITY_AREAS: Record<string, string[]> = {",
    ]
    for k in sorted(result):
        lines.append(f"  {json.dumps(k)}: {json.dumps(result[k], separators=(',', ':'))},")
    lines += ["};", ""]
    OUT.write_text("\n".join(lines))

    print(f"  wrote {OUT.relative_to(ROOT)}: {len(result)} cities", file=sys.stderr)
    print(f"  left without neighbours (too remote): {len(thin)}", file=sys.stderr)
    for k in thin[:10]:
        print(f"    {k}", file=sys.stderr)


if __name__ == "__main__":
    main()
