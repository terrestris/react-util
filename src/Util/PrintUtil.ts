import {
  downloadBlob,
  getJobStatus,
  queuePrint
} from '@camptocamp/inkmap';

import { jsPDF } from 'jspdf';
import _isNil from 'lodash/isNil';
import { Coordinate as OlCoordinate } from 'ol/coordinate';

import { Extent as OlExtent } from 'ol/extent';
import OlMap from 'ol/Map';

import { toLonLat } from 'ol/proj';

import Logger from '@terrestris/base-util/dist/Logger';
import MapUtil from '@terrestris/ol-util/dist/MapUtil/MapUtil';

import {
  InkmapPrintSpec
} from './InkmapTypes';

export interface PrintSpec {
  attributions?: InkmapPrintSpec['attributions'];
  extent?: OlExtent;
  extentPadding?: number | [number, number, number, number]; // Padding (in css pixels).
  dpi?: number;
  legendTitle?: string;
  map: OlMap;
  mapSize: InkmapPrintSpec['size'];
  northArrow?: InkmapPrintSpec['northArrow'];
  onProgressChange?: (val: number) => void;
  outputFileName?: string;
  scaleBar?: InkmapPrintSpec['scaleBar'];
  title?: string;
}

export interface PngPrintSpec extends PrintSpec {
  format: 'png';
}

export interface PdfPrintSpec extends PrintSpec {
  format: 'pdf';
  pdfPrintFunc: (
    mapImgUrl: string,
    thePdfSpec: any,
    mapTitle: string,
    theLegendTitle: string
  ) => Promise<jsPDF>;
}

export class PrintUtil {

  /**
   * The default values for printouts, if not given
   */
  static PRINT_DEFAULTS = {
    attributions: 'bottom-right',
    northArrow: 'top-right',
    scaleBar: {
      position: 'bottom-left',
      units: 'metric'
    },
    dpi: 120,
    outputFileName: 'react-util-image',
    format: 'png',
    title: 'Print',
    legendTitle: 'Legend'
  };

  /**
   * Method used to create printouts in png format.
   * Does not contain e.g. legends, titles etc.
   */
  static async printPng(printSpec: PngPrintSpec) {
    const {
      attributions,
      dpi,
      extent,
      extentPadding,
      format,
      map,
      mapSize,
      northArrow,
      onProgressChange,
      outputFileName,
      scaleBar
    } = printSpec;

    if (_isNil(map)) {
      return Promise.reject('No map given in print config');
    }
    if (_isNil(mapSize)) {
      return Promise.reject('Map size not given in print config');
    }

    const printConfigByMap = await MapUtil.generatePrintConfig(map);
    let printConfig = {
      ...printConfigByMap,
      attributions: attributions === false ? false : attributions || PrintUtil.PRINT_DEFAULTS.attributions,
      dpi: dpi || PrintUtil.PRINT_DEFAULTS.dpi,
      format: format || PrintUtil.PRINT_DEFAULTS.format,
      northArrow: northArrow === false ? false : northArrow || PrintUtil.PRINT_DEFAULTS.northArrow,
      outputFileName: outputFileName || PrintUtil.PRINT_DEFAULTS.outputFileName,
      scaleBar: scaleBar === false ? false : scaleBar || PrintUtil.PRINT_DEFAULTS.scaleBar,
      size: mapSize
    };

    if (!_isNil(extent)) {
      const scaleAndCenter = PrintUtil.applyExtent(map, extent, extentPadding);
      if (!_isNil(scaleAndCenter)) {
        printConfig = {
          ...printConfig,
          ...scaleAndCenter
        };
      }
    }

    const jobId = await queuePrint(printConfig);

    getJobStatus(jobId).subscribe((printStatus: any) => {
      // update the job progress
      const progressPercent = Math.round(printStatus.progress * 100);
      if (onProgressChange) {
        onProgressChange(progressPercent);
      }

      if (printStatus.progress === 1) {
        // job is finished
        const name = outputFileName || PrintUtil.PRINT_DEFAULTS.outputFileName;
        const suffix = format || PrintUtil.PRINT_DEFAULTS.format;
        downloadBlob(printStatus.imageBlob, `${name}.${suffix}`);
      }

      if (printStatus.sourceLoadErrors.length > 0) {
        // display errors
        let errorMessage = '';
        printStatus.sourceLoadErrors.forEach((element: any) => {
          errorMessage = `${errorMessage} - ${element.url}`;
        });
        Logger.error('Inkmap error: ', errorMessage);
      }
    });
  };

  static applyExtent(olMap: OlMap, extent: OlExtent, extentPadding?: number | [number, number, number, number]): {
    center: OlCoordinate;
    scale: number;
  } | undefined {

    if (_isNil(olMap) || _isNil(extent)) {
      return;
    }

    let extentInternal = extent;
    if (!_isNil(extentPadding)) {
      let padding: [number, number, number, number];
      if (!Array.isArray(extentPadding)) {
        padding = Array(4).fill(extentPadding) as [number, number, number, number];
      } else {
        padding = extentPadding;
      }

      const resolution = olMap.getView().getResolution();
      if (!_isNil(resolution)) {
        extentInternal = extentInternal.map((value, index) => {
          const adjustment = (index < 2 ? -1 : 1) * padding[index] * resolution;
          return value + adjustment;
        });
      }
    }

    const scaleAndCenter = MapUtil.calculateScaleAndCenterForExtent(olMap, extentInternal);
    if (_isNil(scaleAndCenter)) {
      return;
    }

    const center: OlCoordinate = toLonLat(scaleAndCenter.center, olMap.getView().getProjection());

    return {
      center,
      scale: scaleAndCenter.scale
    };
  }

  /**
   * Method used for printouts in pdf format.
   * Applies a kind of template through the `pdfPrintFunc`
   * which is used to lay out the final PDF.
   */
  static async printPdf(printSpec: PdfPrintSpec) {
    const {
      dpi,
      extent,
      extentPadding,
      format,
      legendTitle,
      map,
      mapSize,
      northArrow,
      onProgressChange,
      outputFileName,
      pdfPrintFunc,
      scaleBar,
      title
    } = printSpec;

    if (_isNil(map)) {
      return Promise.reject('No map given in print config');
    }
    if (_isNil(mapSize)) {
      return Promise.reject('Map size not given in print config');
    }

    const printConfigByMap = await MapUtil.generatePrintConfig(map);

    let pdfSpec: any = {
      ...printConfigByMap,
      attributions: false,
      dpi: dpi || PrintUtil.PRINT_DEFAULTS.dpi,
      northArrow: northArrow === false ? false : northArrow || PrintUtil.PRINT_DEFAULTS.northArrow,
      scaleBar: scaleBar === false ? false : scaleBar || PrintUtil.PRINT_DEFAULTS.scaleBar,
      size: mapSize
    };

    if (!_isNil(extent)) {
      const scaleAndCenter = PrintUtil.applyExtent(map, extent, extentPadding);
      if (!_isNil(scaleAndCenter)) {
        pdfSpec = {
          ...pdfSpec,
          ...scaleAndCenter
        };
      }
    }

    // create a job, get a promise that resolves when the job is finished
    const jobId = await queuePrint(pdfSpec);

    getJobStatus(jobId).subscribe(async (printStatus: any) => {
      // update the job progress
      const progressPercent = Math.round(printStatus.progress * 100);
      if (onProgressChange) {
        onProgressChange(progressPercent);
      }

      if (printStatus.progress === 1) {
        // create an Object URL from the map image blob
        const mapImgUrl = URL.createObjectURL(printStatus.imageBlob);
        pdfSpec.scaleBar = scaleBar === false ? false :
          scaleBar || PrintUtil.PRINT_DEFAULTS.scaleBar;
        const doc = await pdfPrintFunc(
          mapImgUrl,
          pdfSpec,
          title || PrintUtil.PRINT_DEFAULTS.title,
          legendTitle || PrintUtil.PRINT_DEFAULTS.legendTitle
        );
        // download the result
        if (doc) {
          const name = outputFileName || PrintUtil.PRINT_DEFAULTS.outputFileName;
          const suffix = format || PrintUtil.PRINT_DEFAULTS.format;
          doc.save(`${name}.${suffix}`);
        }
      }

      if (printStatus.sourceLoadErrors.length > 0) {
        // display errors
        let errorMessage = '';
        printStatus.sourceLoadErrors.forEach((element: any) => {
          errorMessage = `${errorMessage} - ${element.url}`;
        });
        Logger.error('Inkmap error: ', errorMessage);
      }
    });
  };
}

export default PrintUtil;
