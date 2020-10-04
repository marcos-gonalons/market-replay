export function prependZero(el: number | string): number | string {
  return el.toString().length === 1 ? `0${el}` : el;
}
