import React, { useState } from 'react';
import { useOrderStore } from '../store/orderStore';

export function CreateOrder() {
  const [total, setTotal] = useState('');
  const [status, setStatus] = useState('pending');
  const { addOrder, isLoading, error } = useOrderStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addOrder({ total: parseInt(total, 10), status });
    setTotal('');
    setStatus('pending');
  };

  return (
    <div className="create-order">
      <h2>Create Order</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Total (cents)
          <input
            type="number"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="e.g. 1500"
            required
            min="1"
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating…' : 'Create Order'}
        </button>
      </form>
    </div>
  );
}
