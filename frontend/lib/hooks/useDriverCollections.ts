import { useMemo } from "react";
import { useCashierPaymentsSample } from "@/lib/hooks/useCashierCollections";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
import { isSameDate } from "@/lib/utils/format";

export interface DriverCollectionRow {
  driverId: string;
  driverName: string;
  driverMobile: string;
  cash: number;
  upi: number;
  cheque: number;
  total: number;
  pending: number;
  orders: number;
}

// Shared by the Driver Collections list and the Alerts screen - both need
// a given day's payments grouped by driver. `date` is a "YYYY-MM-DD" string
// (see CashierDatePicker) - defaults to today when omitted.
export function useDriverCollections(date?: string) {
  const payments = useCashierPaymentsSample();
  const users = useStaffDirectory();

  const rows = useMemo<DriverCollectionRow[]>(() => {
    const drivers = (users.data ?? []).filter((u) => u.role === "driver");
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const dayPayments = (payments.data?.items ?? []).filter(
      (p) => isSameDate(p.payment_date, targetDate) && p.driver_id
    );

    return drivers
      .map((driver) => {
        const driverPayments = dayPayments.filter((p) => p.driver_id === driver.id);
        return {
          driverId: driver.id,
          driverName: driver.full_name,
          driverMobile: driver.mobile,
          cash: driverPayments.reduce((sum, p) => sum + p.cash_amount, 0),
          upi: driverPayments.reduce((sum, p) => sum + p.upi_amount, 0),
          cheque: driverPayments.reduce((sum, p) => sum + p.cheque_amount, 0),
          total: driverPayments.reduce((sum, p) => sum + p.total_amount, 0),
          pending: driverPayments
            .filter((p) => p.status === "pending")
            .reduce((sum, p) => sum + p.total_amount, 0),
          orders: driverPayments.length,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [payments.data, users.data, date]);

  return { rows, isLoading: payments.isLoading || users.isLoading };
}
