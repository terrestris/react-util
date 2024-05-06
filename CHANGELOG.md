

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
