export type SpeciesTaxonomy = {
  pursuitGroup: { key: string; name: string };
  speciesGroup?: { key: string; name: string };
};

const speciesTaxonomy: Record<string, SpeciesTaxonomy> = {
  'axis-deer': { pursuitGroup: { key: 'big-game', name: 'Big game' }, speciesGroup: { key: 'deer-and-antelope', name: 'Deer and antelope' } },
  blackbuck: { pursuitGroup: { key: 'big-game', name: 'Big game' }, speciesGroup: { key: 'deer-and-antelope', name: 'Deer and antelope' } },
  'red-stag': { pursuitGroup: { key: 'big-game', name: 'Big game' }, speciesGroup: { key: 'deer-and-antelope', name: 'Deer and antelope' } },
  'water-buffalo': { pursuitGroup: { key: 'big-game', name: 'Big game' }, speciesGroup: { key: 'buffalo', name: 'Buffalo' } },
  'fallow-deer': { pursuitGroup: { key: 'big-game', name: 'Big game' }, speciesGroup: { key: 'deer-and-antelope', name: 'Deer and antelope' } },
  'wild-boar': { pursuitGroup: { key: 'big-game', name: 'Big game' }, speciesGroup: { key: 'wild-pig', name: 'Wild pig' } },
  'wild-sheep': { pursuitGroup: { key: 'big-game', name: 'Big game' }, speciesGroup: { key: 'sheep-and-goat', name: 'Sheep and goat' } },
  'feral-goat': { pursuitGroup: { key: 'big-game', name: 'Big game' }, speciesGroup: { key: 'sheep-and-goat', name: 'Sheep and goat' } },
  duck: { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'waterfowl', name: 'Waterfowl' } },
  'cinnamon-teal': { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'waterfowl', name: 'Waterfowl' } },
  'rosy-billed-pochard': { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'waterfowl', name: 'Waterfowl' } },
  'yellow-billed-pintail': { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'waterfowl', name: 'Waterfowl' } },
  'silver-teal': { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'waterfowl', name: 'Waterfowl' } },
  'whistling-ducks': { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'waterfowl', name: 'Waterfowl' } },
  dove: { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'dove-and-pigeon', name: 'Dove and pigeon' } },
  'eared-dove': { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'dove-and-pigeon', name: 'Dove and pigeon' } },
  pigeon: { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'dove-and-pigeon', name: 'Dove and pigeon' } },
  'picazuro-pigeon': { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'dove-and-pigeon', name: 'Dove and pigeon' } },
  'spot-winged-pigeon': { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'dove-and-pigeon', name: 'Dove and pigeon' } },
  perdiz: { pursuitGroup: { key: 'game-birds', name: 'Game birds' }, speciesGroup: { key: 'upland-birds', name: 'Upland birds' } },
  'golden-dorado': { pursuitGroup: { key: 'fishing', name: 'Fishing' }, speciesGroup: { key: 'freshwater-fish', name: 'Freshwater fish' } },
};

export const speciesKey = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

export function speciesTaxonomyFor(name: string, published?: SpeciesTaxonomy | null): SpeciesTaxonomy {
  return published ?? speciesTaxonomy[speciesKey(name)] ?? {
    pursuitGroup: { key: 'other-species', name: 'Other species' },
  };
}
