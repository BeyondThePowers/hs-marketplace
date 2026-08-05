# Feed model audit

## Implemented corrections

- Hunt geography is a normalized `destinations[]` collection of country and
  region pairs.
- Species, equipment, techniques, terrain, and access use separate taxonomy
  dimensions.
- The ambiguous compatibility field `classification.methods` is removed.
- Lodge references are typed separately from arranged accommodations.

## Next contract work

The following fields need the same collection-first and typed treatment before
the marketplace is considered broadly complete:

1. Licenses and permits should identify jurisdiction, covered species,
   responsibility, price treatment, and timing instead of one package-level
   text value.
2. Hunting areas should be an explicit collection when a trip uses distinct
   concessions or territories. A display summary can be derived from them.
3. Legal species seasons by jurisdiction must be separate from package booking
   availability. A package window must not imply that every included species is
   legal in every destination for the full window.
4. Itinerary entries should identify day or phase, destination, hunting area,
   accommodation, activity, and transfer when known.
5. Travel should support multiple arrival points and transfer legs rather than
   one airport and one transfer description.
6. Guiding, physical requirements, and access may vary by itinerary phase and
   should be attachable to a phase or hunting area where that distinction
   affects a hunter's decision.

These changes should replace weak shapes directly during development. They
must not add fallback parsing of old prose or preserve conflicting scalar
fields in the public contract.
