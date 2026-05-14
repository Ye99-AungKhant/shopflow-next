import { Payment } from "@/lib/supabase";
import { ColumnDef } from "../ui/DataTable";
import { Edit } from "lucide-react"; // Adjust based on your icon library

export const paymentMethodColumns = (
  handleToggle: (payment: Payment) => void,
  openModal: (action: string, payment: Payment) => void,
): ColumnDef<Payment>[] => [
  {
    header: "Name",
    cell: (payment) => (
      <button className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700">
        {payment.name}
      </button>
    ),
  },
  {
    header: "Name",
    cell: (payment) => (
      <span className="text-sm text-slate-600">{payment.name ?? "-"}</span>
    ),
  },
  {
    header: "Account No.",
    cell: (payment) => (
      <span className="text-sm text-slate-600">
        {payment.account_number ?? "-"}
      </span>
    ),
  },
  {
    header: "Status",
    cell: (payment) => {
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleToggle(payment)}
            className={`
              relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full 
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
              ${payment.enabled ? "bg-indigo-600" : "bg-slate-200"}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
                transition duration-200 ease-in-out
                ${payment.enabled ? "translate-x-6" : "translate-x-1"}
              `}
            />
          </button>
          <span className="text-sm font-medium text-slate-700">
            {payment.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      );
    },
  },
  {
    header: "Actions",
    headerClassName: "text-right",
    cellClassName: "text-right",
    cell: (payment) => (
      <button
        // Assuming you have a payment modal rather than delivery here
        onClick={() => openModal("edit-payment", payment)}
        className="text-sm text-slate-700 hover:bg-slate-50 p-1 rounded"
      >
        <Edit className="h-4 w-4" />
      </button>
    ),
  },
];
