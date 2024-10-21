import { Timestamp } from "firebase/firestore";

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export const formatDate = (
  timestamp: FirestoreTimestamp | Date | string | number
) => {
  let date: Date;

  if (
    timestamp &&
    typeof (timestamp as FirestoreTimestamp).seconds === "number" &&
    typeof (timestamp as FirestoreTimestamp).nanoseconds === "number"
  ) {
    // Create a new Firebase Timestamp
    const firebaseTimestamp = new Timestamp(
      (timestamp as FirestoreTimestamp).seconds,
      (timestamp as FirestoreTimestamp).nanoseconds
    );
    date = firebaseTimestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "string" || typeof timestamp === "number") {
    date = new Date(timestamp);
  } else {
    return "Invalid Date";
  }

  // Format the date to only show the date part
  return date.toLocaleDateString(); // Change to toLocaleDateString()
};
