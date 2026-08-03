# Hunt taxonomy contract

## Purpose

Marketplace discovery must not treat every description of field activity as a
single hunting method. Equipment, technique, terrain, and access answer
different hunter questions and therefore remain separate from authoring through
publication and filtering.

## Authoritative source fields

Each marketing-site hunt record may publish:

- `huntingEquipment`: equipment used to take or pursue game, such as Rifle,
  Bow, Shotgun, or Fishing tackle.
- `huntingTechniques`: how the hunt is conducted, such as Spot and stalk,
  Blind hunting, Decoying, Pass shooting, or Hunting with dogs.
- `terrain`: physical hunting environments, such as Agricultural fields,
  Wetlands, Alpine, Woodland, or River.
- `accessMethods`: how hunters reach or move through the hunting area, such as
  On foot, 4x4 vehicle, Boat, Horseback, or Helicopter.

Values must be factual source content. Missing information remains an empty
array and must not be inferred from the species, region, or package title.

## Species browsing hierarchy

Every published primary and secondary species should include two optional,
backward-compatible taxonomy references in Feed V2:

- `pursuitGroup`: the broad browsing family, such as `big-game`,
  `game-birds`, `fishing`, or `small-game`.
- `speciesGroup`: a narrower biological or hunting convention useful for
  scanning, such as `waterfowl`, `dove-and-pigeon`, or `upland-birds`.

The marketplace renders pursuit and species groups as non-selectable labels
inside one Species facet. Individual species remain the selectable values, so
OR within Species and AND across facets do not change. Group labels must not
silently act as filters. A future parent selection must be exposed explicitly
as an option such as "All waterfowl" with a stable URL parameter.

Publishers own this classification through their site taxonomy configuration.
The marketplace may maintain a compatibility registry for feeds published
before the metadata existed, but must not infer a group from prose or a hunt
title. Unclassified values appear under Other species rather than disappearing.

## Public feed mapping

Feed V2 exposes the same concepts as:

- `classification.equipment`
- `classification.techniques`
- `territory.terrain`
- `territory.accessMethods`

`classification.methods` remains temporarily as the ordered union of equipment
and techniques so existing V2 consumers continue to operate. New consumers
must not use it for facets. It can be removed only in a future major feed
version after every registered consumer has migrated.

## Marketplace behavior

Each category is an independent multi-select facet:

- OR applies within one category.
- AND applies across categories.
- Counts are contextual and ignore selections only in the category whose
  values are being counted.

For example, selecting Rifle and Bow means Rifle OR Bow. Selecting Rifle and
Spot and stalk means Rifle AND Spot and stalk.

## Vocabulary governance

Taxonomy references retain both a stable normalized key and a human-readable
name. Publishers should reuse an existing canonical name before creating a new
one. Synonyms should be resolved at authoring or moderation time, never through
runtime heuristics in the marketplace.

The initial vocabulary includes:

- Equipment: Rifle, Bow, Shotgun, Fishing tackle, Fly tackle.
- Techniques: Spot and stalk, Blind hunting, Calling, Decoying, Pass shooting,
  Walk-up hunting, Hunting with dogs, Glassing, Tracking, Boat fishing, Wade
  fishing, Dry-fly fishing, Streamer fishing.
- Terrain: Agricultural fields, Wetlands, Grassland, Woodland, Alpine, Timber,
  Prairie, River, River canyon.
- Access: On foot, 4x4 vehicle, Boat, Horseback, Helicopter.

This vocabulary is extensible. Additions require a clear category, a distinct
hunter decision value, and evidence in the source record.

## Migration rule

Older records may still contain `huntingMethod`. Marketing builds accept it
only as a compatibility input. Marketplace-enabled records are validated to
contain explicit equipment or techniques, and current JJ, ABH, and canonical
template records have been migrated manually.
