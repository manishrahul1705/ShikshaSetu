import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CaseStepper from '../src/components/CaseStepper.jsx';

describe('[A-N93] event-grounded status display', () => {
  it('does not mark acknowledgement or investigation done without their recorded events', () => {
    render(<CaseStepper caseData={{
      status: 'ACTION_RECORDED',
      accountableOwner: { office: 'Regulation Bureau', role: 'bureau officer' },
      statusHistory: [
        { status: 'SUBMITTED', at: '2026-10-24T10:00:00Z', office: 'Intake Portal' },
        { status: 'ROUTED', at: '2026-10-24T10:05:00Z', office: 'Regulation Bureau' },
        { status: 'ACTION_RECORDED', at: '2026-10-24T11:00:00Z', office: 'Regulation Bureau' },
      ],
    }} />);
    expect(screen.getByText('Intake & Registration').closest('li')).toHaveTextContent('Done');
    expect(screen.getByText('Jurisdiction Routing').closest('li')).toHaveTextContent('Done');
    expect(screen.getByText('Bureau Acknowledgement').closest('li')).not.toHaveTextContent('Done');
    expect(screen.getByText('Investigation & Actions').closest('li')).toHaveTextContent('In Progress');
    expect(screen.getByText('Hearing & Explanation').closest('li')).toHaveTextContent('Awaiting recorded event');
  });
});
