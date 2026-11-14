import math

# A first traffic control plan for a work zone, from fixed formulas (metric versions of the
# usual work zone rules, as in the MUTCD Part 6 that most TTC manuals follow). The AI only explains
# these numbers in plain words; it never makes them up. This is a guide for the contractor and the
# provider; the final plan follows the municipality permit and the Saudi TTC manual.

LANE_WIDTH_M = 3.6

# Distance between the three advance warning signs (A, B, C), by speed.
SIGN_SPACING = [(60, (30, 30, 30)), (80, (100, 100, 100)), (100, (150, 150, 150)), (999, (300, 450, 800))]

# Buffer space before the work area, by speed (km/h -> m).
BUFFER = [(40, 35), (50, 50), (60, 65), (70, 85), (80, 105), (90, 130), (100, 155), (110, 185), (999, 220)]

CLOSURE_NAMES = {
    "lane_closure": "Lane closure",
    "shoulder_closure": "Shoulder closure",
    "full_closure": "Full road closure (detour)",
    "one_lane_two_way": "One lane, two-way traffic (flaggers)",
}


def pick(table: list, speed: int):
    return next(value for limit, value in table if speed <= limit)


def taper_length(speed: int, width_m: float) -> int:
    # Merging taper: W x S x 0.62 at 70 km/h and above, W x S^2 / 155 below.
    if speed >= 70:
        return math.ceil(width_m * speed * 0.62)
    return math.ceil(width_m * speed * speed / 155)


def plan(
    closure_type: str,
    speed_kmh: int,
    lanes_total: int,
    lanes_closed: int,
    work_length_m: int,
    night_work: bool,
    duration_days: int,
) -> dict:
    lanes_closed = max(0, min(lanes_closed, lanes_total))
    full = closure_type == "full_closure" or lanes_closed >= lanes_total
    flagging = closure_type == "one_lane_two_way"
    shoulder = closure_type == "shoulder_closure" or lanes_closed == 0
    width = LANE_WIDTH_M * max(1, lanes_closed)

    merge = taper_length(speed_kmh, width)
    taper = math.ceil(merge / 3) if shoulder else merge  # a shoulder taper is a third of a merge taper
    if flagging:
        taper = 30  # a short taper before the flagger
    buffer = pick(BUFFER, speed_kmh)
    signs = pick(SIGN_SPACING, speed_kmh)
    taper_gap = max(3, round(speed_kmh * 0.19))  # cone spacing in the taper (about speed in mph, in feet)
    tangent_gap = taper_gap * 2  # along the work area
    end_taper = 30

    taper_cones = (math.ceil(taper / taper_gap) + 1) * max(1, lanes_closed if not shoulder else 1)
    work_cones = math.ceil((buffer + work_length_m) / tangent_gap) + 1
    end_cones = math.ceil(end_taper / 6) + 1
    both_sides = lanes_total >= 3 or speed_kmh >= 80  # repeat the signs on the left on wide or fast roads

    devices = [
        {"name": "Advance warning signs (Road Work Ahead, Lane Closed, Merge)", "qty": 3 * (2 if both_sides else 1),
         "why": "Three signs before the zone" + (", on both sides of the road" if both_sides else "")},
        {"name": "Traffic cones / channelizers", "qty": taper_cones + work_cones + end_cones,
         "why": f"{taper_cones} in the taper, {work_cones} along the buffer and work area, {end_cones} in the end taper"},
        {"name": "End Road Work sign", "qty": 1, "why": "After the work zone"},
    ]
    if speed_kmh >= 70 and not full and not flagging and not shoulder:
        devices.append({"name": "Arrow board", "qty": 1, "why": "Fast road: shows drivers which way to merge"})
    if speed_kmh >= 80 or duration_days > 3:
        devices.append({"name": "Water-filled or concrete barriers", "qty": math.ceil(work_length_m / 2),
                        "why": "Protect the workers on a fast road or a long job (2 m units)"})
    if night_work:
        devices.append({"name": "Warning lights on the cones and barriers", "qty": taper_cones + work_cones,
                        "why": "Night work: every device in the taper and the work area is lit"})
    if flagging:
        devices.append({"name": "Flaggers with STOP/SLOW paddles", "qty": 2, "why": "One at each end of the single lane"})
    if full:
        devices.append({"name": "Detour signs", "qty": 6, "why": "Full closure: guide drivers along the detour route"})
        devices.append({"name": "Road Closed barricade", "qty": 2, "why": "Across the closed road at both ends"})
    devices.append({"name": "Reflective vests and helmets", "qty": 1, "why": "For every worker on site (one set each)"})

    notes = []
    if speed_kmh >= 80:
        notes.append("Fast road: consider asking the traffic police for a speed reduction during the work.")
    if night_work:
        notes.append("Night work: workers need high-visibility vests with reflective strips and the zone must be lit.")
    if full:
        notes.append("A full closure needs an approved detour route from the municipality before work starts.")
    if duration_days > 7:
        notes.append("Long job: check the signs and cones every day and replace any that are damaged or moved.")

    total = signs[0] + signs[1] + signs[2] + taper + buffer + work_length_m + end_taper
    return {
        "closure": CLOSURE_NAMES.get(closure_type, closure_type.replace("_", " ").capitalize()),
        "inputs": {
            "closure_type": closure_type, "speed_kmh": speed_kmh, "lanes_total": lanes_total,
            "lanes_closed": lanes_closed, "work_length_m": work_length_m, "night_work": night_work,
            "duration_days": duration_days,
        },
        "zones": [
            {"name": "Advance warning", "length_m": sum(signs),
             "detail": f"Signs at {signs[2] + signs[1] + signs[0]} m, {signs[1] + signs[0]} m and {signs[0]} m before the taper"},
            {"name": "Taper", "length_m": taper, "detail": f"Cones every {taper_gap} m"},
            {"name": "Buffer space", "length_m": buffer, "detail": "Empty space before the workers: nothing parked here"},
            {"name": "Work area", "length_m": work_length_m, "detail": f"Cones every {tangent_gap} m"},
            {"name": "End taper", "length_m": end_taper, "detail": "Cones every 6 m, then the End Road Work sign"},
        ],
        "total_length_m": total,
        "devices": devices,
        "notes": notes,
    }
