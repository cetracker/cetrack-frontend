import dayjs from "dayjs";

export const compareDates = (dayA, dayB) => {

  if (dayA === '') return 1
  if (dayB === '') return -1

  return dayjs(dayB).isBefore(dayjs(dayA)) ? 1 : -1
}
