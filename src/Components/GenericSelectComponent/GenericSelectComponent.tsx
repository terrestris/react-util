import _isNil from 'lodash/isNil';
import React, { ChangeEvent, FC, PropsWithChildren } from 'react';

export type CommonSelectProps<T> = {
  onChange?: (event: ChangeEvent<HTMLSelectElement>, selectedValue: T) => void;
  onSelect?: (event: ChangeEvent<HTMLSelectElement>, selectedValue: T) => void;
  value?: T;
};

export type GenericSelectProps<T, ComponentSelectProps> = CommonSelectProps<T> &
  Omit<ComponentSelectProps, 'onSelect' | 'onChange' | 'value'>;

export type OwnProps<T, ComponentSelectProps> = {
  As: FC<any>;
  selectProps?: GenericSelectProps<T, ComponentSelectProps>;
  value?: T;
};

export type GenericSelectComponentProps<T, ComponentSelectProps> = OwnProps<T, ComponentSelectProps>;

export function GenericSelectComponent<T, ComponentSelectProps>({
  As,
  children,
  selectProps,
  value,
  ...passThroughProps
}: PropsWithChildren<GenericSelectComponentProps<T, ComponentSelectProps>>) {

  if (_isNil(As)) {
    return null;
  }

  return (
    <As
      {...passThroughProps}
      {...selectProps}
      value={value}
    >
      {children}
    </As>
  );
}

export default GenericSelectComponent;

