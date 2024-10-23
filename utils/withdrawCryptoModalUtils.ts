import { collection, getDocs } from "firebase/firestore";

export const validateTRC20Address = (address: string) => {
    return /^T[A-Za-z1-9]{33}$/.test(address);
};

export const formatAmount = (value: string, availableBalance: number) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    const floatValue = parseFloat(numericValue);
    if (isNaN(floatValue)) return "0.00";
    if (floatValue > availableBalance) {
        return availableBalance.toFixed(2);
    }
    return floatValue.toFixed(2);
};

export const getWithdrawalCount = async (db: any) => {
    const withdrawalsCollection = collection(db, "withdrawalRequests");
    const snapshot = await getDocs(withdrawalsCollection);
    return snapshot.docs.length;
};
