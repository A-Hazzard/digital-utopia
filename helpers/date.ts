import { Timestamp } from "firebase/firestore";

export const formatDate = (
  date: Date | Timestamp | string | number
) => {
  if (date instanceof Timestamp) {
    date = date.toDate();
  }

  let formattedDate: string;

  if (date instanceof Date) {
    formattedDate = date.toLocaleDateString();
  } else if (typeof date === "string" || typeof date === "number") {
    formattedDate = new Date(date).toLocaleDateString();
  } else {
    return "Invalid Date";
  }

  return formattedDate;
};
