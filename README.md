# react-util

A set of utilities enhancing the development of react applications.

## Installation

```sh
npm i @terrestris/react-util
```

## Usage

```js
import { useObjectState } from '@terrestris/react-util';
// or
import { useObjectState } from '@terrestris/react-util/dist/hooks/useObjectState/useObjectState';
```

## Development

`npm run watch:buildto` can be used to inject an updated version of `react-util` into another project, e.g. `react-geo`.
The script will also watch for further changes.

```sh
npm run watch:buildto ../react-geo/node_modules/@terrestris/react-geo/
```
