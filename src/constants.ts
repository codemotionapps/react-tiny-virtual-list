export type DIRECTION = 'horizontal' | 'vertical';
export const DIRECTION_VERTICAL: DIRECTION = 'vertical';
export const DIRECTION_HORIZONTAL: DIRECTION = 'horizontal';

export const scrollProp = {
  [DIRECTION_VERTICAL]: 'scrollTop',
  [DIRECTION_HORIZONTAL]: 'scrollLeft'
};

export const sizeProp = {
  [DIRECTION_VERTICAL]: 'height',
  [DIRECTION_HORIZONTAL]: 'width'
};

export const positionProp = {
  [DIRECTION_VERTICAL]: 'top',
  [DIRECTION_HORIZONTAL]: 'left'
};

export function noop(){} // tslint:disable-line no-empty
