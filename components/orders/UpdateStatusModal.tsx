"use client";
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { updateOrderStatus, type OrderListRow, type OrderStatus } from '../../lib/orders';
import { cn } from '../../lib/utils';

type UpdateStatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: OrderListRow | null;
  initialStatus?: OrderStatus | null;
};

const statusOptions: { id: OrderStatus; label: string; description: string }[] = [
  { id: 'pending', label: 'Pending', description: 'Waiting for processing.' },
  { id: 'in_delivery', label: 'In Delivery', description: 'Order is currently on the way.' },
  { id: 'completed', label: 'Completed', description: 'Order has been delivered successfully.' },
  { id: 'canceled', label: 'Canceled', description: 'Order will not be fulfilled.' },
];

export function UpdateStatusModal({
  isOpen,
  onClose,
  order,
  initialStatus = null,
}: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
  const [internalNote, setInternalNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (order) {
      setSelectedStatus(initialStatus ?? order.status);
      setInternalNote('');
      setErrorMessage('');
    }
  }, [order, isOpen, initialStatus]);

  const mutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['order-details', order?.id] }),
      ]);
      onClose();
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update order status.');
    },
  });

  if (!order) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Order Status"
      maxWidthClass="max-w-md"
      headerContent={<p className="mt-1 text-sm text-slate-500">Change the status for {order.shortId}.</p>}
    >
      <div className="space-y-5 p-6">
        <div className="space-y-3">
          {statusOptions.map((option) => {
            const isSelected = selectedStatus === option.id;

            return (
              <button
                key={option.id}
                onClick={() => setSelectedStatus(option.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition',
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span
                  className={cn(
                    'mt-1 h-4 w-4 rounded-full border-2',
                    isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                  )}
                >
                  <span className="block h-full w-full rounded-full border-2 border-white" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-slate-900">{option.label}</span>
                  <span className="mt-1 block text-sm text-slate-500">{option.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Internal Note</label>
          <textarea
            value={internalNote}
            onChange={(event) => setInternalNote(event.target.value)}
            placeholder="Add an optional note for your team..."
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        {errorMessage && <p className="text-sm text-rose-500">{errorMessage}</p>}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            setErrorMessage('');
            mutation.mutate({ orderId: order.id, status: selectedStatus });
          }}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <ArrowRightLeft className="h-4 w-4" />
          {mutation.isPending ? 'Saving...' : 'Save Status'}
        </button>
      </div>
    </Modal>
  );
}
