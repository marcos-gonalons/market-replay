export function prependZero(el: number | string): number | string {
  return el.toString().length === 1 ? `0${el}` : el;
}

export function getDateFormatted(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dic"];

  const [day, month, year, hours, minutes, seconds] = [
    d.getDate(),
    months[d.getMonth()],
    d.getFullYear(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
  ].map(prependZero);

  return `${day} ${month} ${year} - ${hours}:${minutes}:${seconds}`;
}
