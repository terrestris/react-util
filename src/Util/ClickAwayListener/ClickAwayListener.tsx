import React, { useCallback, useEffect, useRef } from 'react';

interface ClickAwayProps {
  onClickAway: VoidFunction;
  children: React.ReactNode[] | React.ReactNode;
}

const ClickAwayListener = (props: ClickAwayProps) => {
  const ref = useRef(null);

  const handleClickAway = useCallback((e: Event) => {
    if (ref.current && (ref.current as Element).contains(e.target as Node)) {
      return;
    }

    props.onClickAway();
  }, [props]);

  useEffect(() => {
    window.addEventListener('click', handleClickAway);
  }, [handleClickAway]);

  useEffect(() => {
    return () => {
      window.removeEventListener('click', handleClickAway);
    };
  }, [handleClickAway]);

  return (
    <div ref={ref}>
      {props.children}
    </div>
  );

};

export default ClickAwayListener;
