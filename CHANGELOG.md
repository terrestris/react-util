# [12.3.0](https://github.com/terrestris/react-util/compare/v12.2.0...v12.3.0) (2025-10-23)


### Bug Fixes

* linting ([80015b4](https://github.com/terrestris/react-util/commit/80015b469d77d13fcc1eb22e168ea0bbde4bc77d))


### Features

* **useMeasure:** add segment length to currently drawn line ([074e77c](https://github.com/terrestris/react-util/commit/074e77cbf7dc1b62a2b4c76c1aadea4ae1cb99bf))

# [12.2.0](https://github.com/terrestris/react-util/compare/v12.1.1...v12.2.0) (2025-10-23)


### Features

* **useMeasure:** add option to show lengths of segments ([c937e30](https://github.com/terrestris/react-util/commit/c937e30a98d413683d66c41429f6cdd53c3fa69c))

## [12.1.1](https://github.com/terrestris/react-util/compare/v12.1.0...v12.1.1) (2025-05-21)


### Bug Fixes

* use non-barrel imports for geometry classes from ol ([f7c90ac](https://github.com/terrestris/react-util/commit/f7c90ac36627e89b9da5b39d1bfc092bc9d45d4e))

# [12.1.0](https://github.com/terrestris/react-util/compare/v12.0.0...v12.1.0) (2025-04-14)


### Features

* added useDrawCut hook ([77da592](https://github.com/terrestris/react-util/commit/77da592556c96696dd1cbcfaa6b4f0a786c6efe3))

# [12.0.0](https://github.com/terrestris/react-util/compare/v11.0.1...v12.0.0) (2025-04-10)


### Bug Fixes

* typings changed in OpenLayers 10.5.0 ([9cfdc91](https://github.com/terrestris/react-util/commit/9cfdc91124ef9c2a5b9fe530cde85152f6ab924d))


### Features

* **inkmap:** introduce extent property for constrained prints ([20c57a2](https://github.com/terrestris/react-util/commit/20c57a2a8d5ffdbec3767cc2f5493f585bb73a54))


### BREAKING CHANGES

* **inkmap:** Numerous properties of print functions have been moved
to a new type PrintSpec

## [11.0.1](https://github.com/terrestris/react-util/compare/v11.0.0...v11.0.1) (2025-03-24)


### Bug Fixes

* **deps:** bump OpenLayers to version 10.4.0 ([5113794](https://github.com/terrestris/react-util/commit/5113794f7616eff322d39ac87aaf07bb3f648964))

# [11.0.0](https://github.com/terrestris/react-util/compare/v10.1.1...v11.0.0) (2025-03-21)


### Bug Fixes

* adds id property as fallback ([8d467a8](https://github.com/terrestris/react-util/commit/8d467a8b98fd78999561aaa8e4f5d8381c16294f))
* prevent map zoom on double click ([0568f1c](https://github.com/terrestris/react-util/commit/0568f1cfeaec862ccb6d2b58523d7f206ae298c2))
* return pixel coordinate as well ([018b66a](https://github.com/terrestris/react-util/commit/018b66aa222862a77693b42b8d0977e671e0d128))


### Features

* adds possibility to define click event ([5dfd664](https://github.com/terrestris/react-util/commit/5dfd664492e0edd6cbe2049a3427faa8cb8fefab))
* **coodinateInfo:** adds pointerrest and functions for layerfilter and infoFormat ([9c3ff7b](https://github.com/terrestris/react-util/commit/9c3ff7b67aa6c540527156ec0b471d4f6a4becc2))
* support WMSGetFeatureInfo format as well (e.g. msGMLOutput) ([8009ad0](https://github.com/terrestris/react-util/commit/8009ad0038b4649a29f6bb28a187ee7594e64eae))


### BREAKING CHANGES

* **coodinateInfo:** queryLayers is replaced by layerFilter and fix info
format by function

## [10.1.1](https://github.com/terrestris/react-util/compare/v10.1.0...v10.1.1) (2025-03-19)


### Bug Fixes

* adds quickselect to transformIgnorePatterns ([49bfdfd](https://github.com/terrestris/react-util/commit/49bfdfdb9ed893ca7ae583b8edd5b99ca2cb0027))
* linting error exhaustive check for switch ([14b51b6](https://github.com/terrestris/react-util/commit/14b51b6ff6d5389122140caadb12e9c30e933721))
* linting issues ([79602de](https://github.com/terrestris/react-util/commit/79602de6e30830f91eea4019fb767a01efb48e25))

# [10.1.0](https://github.com/terrestris/react-util/compare/v10.0.1...v10.1.0) (2025-02-28)


### Features

* add configurable GML version selection and fallback ([bd36fe8](https://github.com/terrestris/react-util/commit/bd36fe886691eb99f7dc67dbecae68bef79f49a9))

## [10.0.1](https://github.com/terrestris/react-util/compare/v10.0.0...v10.0.1) (2024-10-24)


### Bug Fixes

* rename to cjs file since project is defined as module ([1af2036](https://github.com/terrestris/react-util/commit/1af203636fef5ec74d1933988a962789b7ddf08b))

# [10.0.0](https://github.com/terrestris/react-util/compare/v9.0.0...v10.0.0) (2024-10-21)


### chore

* upgrade eslint to v9 ([823fe25](https://github.com/terrestris/react-util/commit/823fe25eb44d70d3b9ed21f99e97eb275e46cdf4))


### BREAKING CHANGES

* upgrade eslint to v9

# [9.0.0](https://github.com/terrestris/react-util/compare/v8.0.5...v9.0.0) (2024-09-20)


### chore

* update to latest ol ([3ed364a](https://github.com/terrestris/react-util/commit/3ed364aeeac2ca72e2d8777218dca15661ec4e53))


### BREAKING CHANGES

* required peer dependency for ol is >= 10 now

## [8.0.5](https://github.com/terrestris/react-util/compare/v8.0.4...v8.0.5) (2024-06-19)


### Bug Fixes

* **useCoordinateInfo:** clone before setting state ([766dfe6](https://github.com/terrestris/react-util/commit/766dfe6a3c8475181d253074d1cc115b771e8fea))
* **useCoordinateInfo:** propagate state ([85fb3d8](https://github.com/terrestris/react-util/commit/85fb3d8518b30a8f4bf1d81f3710ca45a39acf7e))
* **useCoordinateInfo:** remove return and use continue ([0cd2bc7](https://github.com/terrestris/react-util/commit/0cd2bc76bad79b813cd4c419fe0b72ec3b5b6059))

## [8.0.4](https://github.com/terrestris/react-util/compare/v8.0.3...v8.0.4) (2024-06-17)


### Bug Fixes

* **useCoordinateInfo:** do not use loading state in hook where it is used ([685bcd5](https://github.com/terrestris/react-util/commit/685bcd5120690dca31c2dd2efe9d668ac361815d))

## [8.0.3](https://github.com/terrestris/react-util/compare/v8.0.2...v8.0.3) (2024-06-12)


### Bug Fixes

* cleanup tooltips also when the containing component gets removed ([0aa866b](https://github.com/terrestris/react-util/commit/0aa866bc6da060b5b933b8f57512fed692cfbcf5))
* missing semicolon ([6e5da12](https://github.com/terrestris/react-util/commit/6e5da12671318bce9ccf9e896c809e5e36c1bdda))

## [8.0.2](https://github.com/terrestris/react-util/compare/v8.0.1...v8.0.2) (2024-06-10)


### Bug Fixes

* remove functions from dependency lists that normally change on every render ([30d8e5b](https://github.com/terrestris/react-util/commit/30d8e5b1bec1400093093b484f2a62e28e9f8e03))

## [8.0.1](https://github.com/terrestris/react-util/compare/v8.0.0...v8.0.1) (2024-06-10)


### Bug Fixes

* add eslint react linting and fix warnings about dependency lists ([89e70e2](https://github.com/terrestris/react-util/commit/89e70e2e51a3efbbbffe1935d42c6493735ca8f1))
* add react hooks eslint plugin & fix dependencies ([1d521c3](https://github.com/terrestris/react-util/commit/1d521c39f86fb57967005ec55bfcd9a618db66be))
* remove defaultFunc from dependencies of usePropOrDefault ([f10b2b2](https://github.com/terrestris/react-util/commit/f10b2b244fdf3e57be5c7f3cdf57a3aaf923e596))

## [8.0.0](https://github.com/terrestris/react-util/compare/v7.0.0...v8.0.0) (2024-06-06)


### ⚠ BREAKING CHANGES

* The features result of the useCoordinateInfo hook is no longer grouped by featureType but returns an object for each feature that contains the feature, the layer and the feature type.

If you need the grouping, you can do the following
```
import {groupBy, mapValues} from 'lodash';

const { features } = useCoordinateInfo();

const grouped = groupBy(features, 'featureType');
const groupedAndMapped = mapValues(grouped, results => results.map(r => r.feature));
```

### Features

* include layer in coordinate info result ([11a4c70](https://github.com/terrestris/react-util/commit/11a4c70e099aae6914d3248b4c7130e6791e6e85))

## [7.0.0](https://github.com/terrestris/react-util/compare/v6.0.2...v7.0.0) (2024-06-03)


### ⚠ BREAKING CHANGES

* The `useWfs` and `useNominatim` hooks are removed. You can instead now use the `useSearch` hook with the needed search functions for example like this:

```
const [searchTerm, setSearchTerm] = useState<string>('');
const searchFunction = useCallback(createNominatimSearchFunction({}), []);
const {
  featureCollection,
  loading
} = useSearch(searchFunction, searchTerm);
```

### Features

* unify functionality of useWfs and useNominatim into on useSearch hook ([9d37d20](https://github.com/terrestris/react-util/commit/9d37d20939c44d4f2132aca603116bdc301b8497))

## [6.0.2](https://github.com/terrestris/react-util/compare/v6.0.1...v6.0.2) (2024-05-27)


### Bug Fixes

* remove conditional hook calls ([8c3c222](https://github.com/terrestris/react-util/commit/8c3c222f5d54e04986e84d8b0a4a91b5da1cf1a4))

## [6.0.1](https://github.com/terrestris/react-util/compare/v6.0.0...v6.0.1) (2024-05-27)


### Bug Fixes

* update dependencies ([300feaa](https://github.com/terrestris/react-util/commit/300feaa754b0e994f93b291d7562ed384b148f6b))

## [6.0.0](https://github.com/terrestris/react-util/compare/v5.2.0...v6.0.0) (2024-05-24)


### ⚠ BREAKING CHANGES

* switch to es2022 build

### Code Refactoring

* switch to es2022 build ([0d892e1](https://github.com/terrestris/react-util/commit/0d892e1cd6809f8a045e36bbb37621d41a492b3c))

## [5.2.0](https://github.com/terrestris/react-util/compare/v5.1.0...v5.2.0) (2024-05-22)


### Features

* allow CoordinateInfo to request Feature Info in json format ([8ddc8b9](https://github.com/terrestris/react-util/commit/8ddc8b91acfd1a8cf0cb36328df24177baa66f4f))

## [5.1.0](https://github.com/terrestris/react-util/compare/v5.0.0...v5.1.0) (2024-05-15)


### Features

* add onFetchSuccess callbacks to useWfs and useNominatim ([8f9bae4](https://github.com/terrestris/react-util/commit/8f9bae4caed6b4bfc3874697bced701bb5435ee2))

## [5.0.0](https://github.com/terrestris/react-util/compare/v5.0.0-beta.1...v5.0.0) (2024-05-14)


### ⚠ BREAKING CHANGES

* removes the wms layer type utils. These live now in `ol-util`

### Features

* remove type utils and use the ones from `ol-util` ([bf62700](https://github.com/terrestris/react-util/commit/bf62700526f3ae0fc5bfd3cdd0062aecffefae29))

## [5.0.0-beta.1](https://github.com/terrestris/react-util/compare/v5.0.0-beta.0...v5.0.0-beta.1) (2024-05-06)


### Features

* adds wfs feature info handling ([#692](https://github.com/terrestris/react-util/issues/692)) ([7fe12bd](https://github.com/terrestris/react-util/commit/7fe12bd9d0a407f54353e05d57fc5ed0ed0d2b41))

## [5.0.0-beta.0](https://github.com/terrestris/react-util/compare/v4.0.0...v5.0.0-beta.0) (2024-05-06)


### ⚠ BREAKING CHANGES

* the removed components have been moved to react-geo

### Features

* init useMeasure ([2beae76](https://github.com/terrestris/react-util/commit/2beae764e600c6a408d0ed28a6a27c8beae256e3))


### Bug Fixes

* include the style ([6e1aaae](https://github.com/terrestris/react-util/commit/6e1aaaeb1a5a07fb1faafddcf4c6b7f3bc11178f))
* restore display of selected layer in preview ([c3c72d1](https://github.com/terrestris/react-util/commit/c3c72d16e43a7a946acb07bd16a81d0d14a05e9f))
* several styling and functional issues ([06e98d8](https://github.com/terrestris/react-util/commit/06e98d884f4c2fca68360f12b57804157b99a119))


### Code Refactoring

* remove ui components ([ad66adc](https://github.com/terrestris/react-util/commit/ad66adc562a2e459308e939ffb2524412e13aada))

## [4.0.0](https://github.com/terrestris/react-util/compare/v4.0.0-beta.4...v4.0.0) (2024-04-30)

## [4.0.0-beta.4](https://github.com/terrestris/react-util/compare/v4.0.0-beta.3...v4.0.0-beta.4) (2024-04-04)


### ⚠ BREAKING CHANGES

* ol 9 is now the minimum required peer version

### Miscellaneous Chores

* update peer dependencies ([c57370c](https://github.com/terrestris/react-util/commit/c57370cc155be4870455680a0411a5320f14bc32))

## [4.0.0-beta.3](https://github.com/terrestris/react-util/compare/v4.0.0-beta.2...v4.0.0-beta.3) (2024-03-11)


### Features

* introduce wfs hook ([a9b17c2](https://github.com/terrestris/react-util/commit/a9b17c2c4d4eedcf260e9f600a5dfb719d578c88))


### Bug Fixes

* null check for searchConfig ([29f0797](https://github.com/terrestris/react-util/commit/29f0797ec73ab46d8930a95309636c1227a357f2))
* set features and loading state to init values for empty search term ([4cb06b7](https://github.com/terrestris/react-util/commit/4cb06b78b4058553445e25b76caa815d3c928c5c))

## [4.0.0-beta.2](https://github.com/terrestris/react-util/compare/v4.0.0-beta.1...v4.0.0-beta.2) (2024-02-29)


### Features

* introduce useCoordinateInfoHook ([45a132a](https://github.com/terrestris/react-util/commit/45a132a9009290c1cc7d34c9a7dc06ef8ae03f8e))
* introduce useNominatim hook ([db4375b](https://github.com/terrestris/react-util/commit/db4375b33089c293684164a9b5a74bf58ee57f93))
* introduce useProjFromEpsgIO hook ([8cf5fb2](https://github.com/terrestris/react-util/commit/8cf5fb24306ae076ad8dd730085e49c9a9aae67b))


### Bug Fixes

* adds missing inkmap dependency ([83eb5c5](https://github.com/terrestris/react-util/commit/83eb5c57e4db06bea44a419bbab26dd1fc57f1ca))
* remove [@types-react](https://github.com/types-react) from peer-dependencies ([0cebe8b](https://github.com/terrestris/react-util/commit/0cebe8b81c978a65179dde9bfe6c71e8ccfff672))
* use async function call and return CoordinateInfoResult directly ([894cd83](https://github.com/terrestris/react-util/commit/894cd830b440c480ad44d182587f43da0dbbe3cd))

## [4.0.0-beta.1](https://github.com/terrestris/react-util/compare/v4.0.0-beta.0...v4.0.0-beta.1) (2024-02-16)


### ⚠ BREAKING CHANGES

* ol 8.2.0 is now the minimum required peer version

### Features

* add zoomTo util function ([e3fb4ee](https://github.com/terrestris/react-util/commit/e3fb4ee86fdd66d18e65c7b2a9df4a6dc9a75b15))


### Bug Fixes

* typings of digitize layer ([51e301e](https://github.com/terrestris/react-util/commit/51e301e2cb209e9667a658c73a5e0e83f297f95a))


### Miscellaneous Chores

* update to ol 8.2.0 ([ddbd97a](https://github.com/terrestris/react-util/commit/ddbd97a47fc6a16102d5d2237cdc30a3b768fc63))

## [4.0.0-beta.0](https://github.com/terrestris/react-util/compare/v3.0.0...v4.0.0-beta.0) (2023-10-26)


### ⚠ BREAKING CHANGES

* imports must be adjusted
* imports must be adjusted
* removed all HOCs in favour of hooks
* updates several hook export paths

### Features

* move HOCs to hooks ([ac6ef33](https://github.com/terrestris/react-util/commit/ac6ef33723180366594d9d60222ce398549e1a9e))


### Bug Fixes

* export all default exports ([b184210](https://github.com/terrestris/react-util/commit/b184210556d4585c693ddaac4ee2607a7bed2b95))
* harmonize hooks files/folders ([6eae470](https://github.com/terrestris/react-util/commit/6eae470de68ef4ddb296250e77416c8233ef4416))
* hide the layer depending on the active status and add NaN check ([2508d21](https://github.com/terrestris/react-util/commit/2508d21b766027e14f5cfb042537e33d86725f23))
* list required peer dependencies ([17ec6ff](https://github.com/terrestris/react-util/commit/17ec6ff58ad31a0a6c1a94cd43e91f6d644d9427))
* place components in dedicated subdirectory ([8c9bc29](https://github.com/terrestris/react-util/commit/8c9bc29331e21d9da4e14d7dac7e261d12a9db7b))
* rename hooks directory to Hooks ([36597a2](https://github.com/terrestris/react-util/commit/36597a209008e80335c8706f973ce6494bf2690f))
* replace react-geo statics with react-util ([8fb8353](https://github.com/terrestris/react-util/commit/8fb835344f8f244405241a5bcccc310d48ccdc19))
* set correct import paths ([6472a3a](https://github.com/terrestris/react-util/commit/6472a3a410ee55dccb764039198eaf1ded99d86d))
* update doc ([9157002](https://github.com/terrestris/react-util/commit/9157002e13c006f142ea38a43cbde101fb92c93a))

## [3.0.0](https://github.com/terrestris/react-util/compare/v2.2.0-beta.2...v3.0.0) (2023-09-19)


### Features

* `useModify` hook ([786610e](https://github.com/terrestris/react-util/commit/786610e523665c329eeaad005006ac2a50d62ad7))
* add support vor mapbox vector tiles ([52a6982](https://github.com/terrestris/react-util/commit/52a6982818e25c72cad7d4c697a468a2712ea0d7))
* create `useSelectFeatures` and `usePropOrDefault` hooks ([c0df0ed](https://github.com/terrestris/react-util/commit/c0df0ed95c182abfaab08edd92ea7e87943976dd))
* introduce useGeoLocation hook ([db0bc0d](https://github.com/terrestris/react-util/commit/db0bc0ded7f209e61ab26dcc2dfb49e5a83ec4dc))
* refactor code into `useDraw` hook ([920f823](https://github.com/terrestris/react-util/commit/920f8233f3998222f2140722fceab597f7321a1e))


### Bug Fixes

* add docs regarding vector tile layer support ([459fdcc](https://github.com/terrestris/react-util/commit/459fdccfede863d57444b06463affac1f51231dd))
* clear collection on deactivate ([605cb90](https://github.com/terrestris/react-util/commit/605cb90fa0a40635a66df8536bc8215d755b74bc))
* fix prepublish script ([68a95fe](https://github.com/terrestris/react-util/commit/68a95fe95225c5e52859754d2c5eb48a58475880))
