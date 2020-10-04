const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dic"];

export function prependZero(el: number | string): number | string {
  return el.toString().length === 1 ? `0${el}` : el;
}

export function getDateFormatted(d: Date): string {
  const [day, month, year, hours, minutes, seconds] = [
    d.getDate(),
    MONTHS[d.getMonth()],
    d.getFullYear(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
  ].map(prependZero);

  return `${day} ${month} ${year} - ${hours}:${minutes}:${seconds}`;
}

export function getDateFormattedShort(d: Date): string {
  const [day, month, year] = [d.getDate(), MONTHS[d.getMonth()], d.getFullYear()];

  return `${day} ${month} ${year}`;
}
