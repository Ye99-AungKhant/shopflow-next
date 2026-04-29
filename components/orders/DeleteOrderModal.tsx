"use client";
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { deleteOrder, type OrderListRow } from '../../lib/orders';

type DeleteOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: OrderListRow | null;
};

export function DeleteOrderModal({ isOpen, onClose, order }: DeleteOrderModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setErrorMessage('');
    }
  }, [isOpen, order]);

  const mutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      onClose();
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete order.');
    },
  });

  if (!order) {
    return null;
  }

  const isConfirmed = confirmationText === 'DELETE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span>Delete Order</span>
        </span>
      }
      maxWidthClass="max-w-md"
      headerContent={<p className="mt-1 text-sm text-slate-500">You are deleting {order.shortId}.</p>}
    >
      <div className="space-y-5 p-6">
        <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">
          Warning: This action cannot be undone. This will permanently remove the order from the
          database.
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Type DELETE to confirm</label>
          <input
            type="text"
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder="DELETE"
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-2 focus:ring-red-500/20"
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
            mutation.mutate(order.id);
          }}
          disabled={!isConfirmed || mutation.isPending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {mutation.isPending ? 'Deleting...' : 'Permanently Delete'}
        </button>
      </div>
    </Modal>
  );
}
