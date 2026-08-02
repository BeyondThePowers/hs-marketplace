import { requestPendingPublicationBuild } from '../src/lib/publication-build';

const result = await requestPendingPublicationBuild();
console.log(JSON.stringify(result, null, 2));
