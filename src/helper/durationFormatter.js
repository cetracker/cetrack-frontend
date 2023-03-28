export const formatDuration = (duration) => {
  let remainder = duration;
  const hours = Math.floor(remainder / 3600);
  remainder -= hours * 3600;

  const minutes = Math.floor(remainder / 60) % 60;
  remainder -= minutes * 60;

  const seconds = remainder % 60;


  let formatString = `${(hours > 0) ? `${hours}h`:''} ${(minutes < 10  && hours > 0)? '0' + minutes: minutes}:${seconds < 10? '0' + seconds : seconds}`;
  return formatString;
}
