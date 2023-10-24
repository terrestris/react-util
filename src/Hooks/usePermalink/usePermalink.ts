import OlInteractionLink from 'ol/interaction/Link';
import OlMap from 'ol/Map';
import {
  useEffect,
  useRef
} from 'react';

export const usePermalink = (map: OlMap|undefined) => {
  const linkInteractionRef = useRef<OlInteractionLink>();

  useEffect(() => {
    if (!map) {
      return undefined;
    }

    if (!linkInteractionRef.current) {
      linkInteractionRef.current = new OlInteractionLink({
        params: ['x', 'y', 'z', 'r']
      });
      map.addInteraction(linkInteractionRef.current);
    }

    return () => {
      if (linkInteractionRef.current) {
        map.removeInteraction(linkInteractionRef.current);
      }
    };
  }, [map]);
};

export default usePermalink;
