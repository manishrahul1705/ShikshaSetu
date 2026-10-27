import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EmptyState, SortableTable, SyntheticDataBadge } from '../src/components/ui/PageKit.jsx';

afterEach(cleanup);

it('[A-N101] designed empty state and synthetic showcase disclosure prevent blank page surfaces', () => {
  render(<><EmptyState title="No cases yet" text="New cases will appear here with their routing status." /><SyntheticDataBadge /></>);
  expect(screen.getByRole('heading', { name: 'No cases yet' })).toBeInTheDocument();
  expect(screen.getByText('Synthetic showcase data')).toBeInTheDocument();
});

it('[A-N102] tables filter records and sort ascending then descending', () => {
  render(<SortableTable rows={[{ id: 'b', name: 'Beta', count: 2 }, { id: 'a', name: 'Alpha', count: 10 }]} columns={[{ key: 'name', label: 'Name' }, { key: 'count', label: 'Count' }]} />);
  const rows = () => screen.getAllByRole('row').slice(1);
  expect(rows()[0]).toHaveTextContent('Alpha');
  fireEvent.click(screen.getByRole('button', { name: /Name/ }));
  expect(rows()[0]).toHaveTextContent('Beta');
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter table' }), { target: { value: 'Alpha' } });
  expect(rows()).toHaveLength(1);
  expect(rows()[0]).toHaveTextContent('Alpha');
});
