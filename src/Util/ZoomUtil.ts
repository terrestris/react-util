import { AnimationOptions as OlViewAnimationOptions } from 'ol/View';

export interface MapState {
  /**
   * Whether the zoom shall be animated.
   */
  animate: boolean;
  /**
   * The zoom level.
   */
  zoom: number | undefined;
  /**
   * The options for the zoom animation. By default zooming will take 250
   * milliseconds and an easing which starts fast and then slows down will be
   * used.
   */
  animateOptions: OlViewAnimationOptions;
  constrainViewResolution: boolean;
  extent: number[] | undefined;
  center: number[] | undefined;
}

/**
 * This function can be used to control the map state. If you have the zoom, center or extent in your state/
 * store call this function with appropriate arguments to have the map react to changes to their values.
 *
 * Currently, specifying the extent only is supported as well as specifying the zoom level and optionally the center.
 */
export const zoomTo = (
  map,
  options: MapState = {
    animate: false,
    animateOptions: {},
    constrainViewResolution: false,
    zoom: undefined,
    center: undefined,
    extent: undefined
  }
) => {
  const {
    animate,
    zoom,
    animateOptions,
    constrainViewResolution,
    extent,
    center
  } = options;

  if (!map) {
    return undefined;
  }
  const view = map.getView();
  if (!view) { // no view, no zooming
    return undefined;
  }
  if (view.getAnimating()) {
    view.cancelAnimations();
  }
  view.setConstrainResolution(constrainViewResolution);

  if (animate && animateOptions) {
    const {
      duration,
      easing
    } = animateOptions;
    const finalOptions = {
      zoom,
      duration,
      easing,
      center
    };
    if (extent) {
      view.fit(extent, finalOptions);
    } else {
      view.animate(finalOptions);
    }
  } else {
    if (extent) {
      view.fit(extent);
    } else if (center && zoom) {
      view.setCenter(center);
      view.setZoom(zoom);
    } else {
      view.setZoom(zoom);
    }
  }
};
