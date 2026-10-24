import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import StudentVerificationPanel from '../src/pages/trust/StudentVerificationPanel.jsx';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const profile = { status: 'confirm_details', last4: '3001', details: { name: 'Student One', institutionPid: '1-7734299133', programme: 'B.Tech', enrolment: 'Active' }, channels: { email: 'st***@example.invalid', sms: 'Phone ending 0001' } };
function stub(failOtp = false) {
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    const action = String(url).split('/').pop();
    let data;
    if (action === 'lookup') data = profile;
    if (action === 'send-otp') data = { status: 'otp_pending', destination: profile.channels[JSON.parse(options.body).channel], channel: JSON.parse(options.body).channel, expiresAt: '2026-10-28T10:00:00Z' };
    if (action === 'local-delivery') data = { status: 'available', code: '271828' };
    if (action === 'confirm-otp') data = failOtp ? { error: 'OTP_INVALID' } : { status: 'verified', selfService: true, channel: 'email' };
    return { ok: !(failOtp && action === 'confirm-otp'), json: async () => data };
  }));
}
async function start(channel = 'email') {
  fireEvent.change(screen.getByLabelText('Student ID number'), { target: { value: '100020003001' } });
  fireEvent.click(screen.getByLabelText(/I consent to checking/));
  fireEvent.click(screen.getByRole('button', { name: 'Fetch linked details' }));
  expect(await screen.findByText('Student One')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('These details belong to me.'));
  if (channel === 'sms') fireEvent.click(screen.getByLabelText(/Linked phone/));
  fireEvent.click(screen.getByRole('button', { name: 'Send verification code' }));
  await screen.findByRole('button', { name: 'Open received code' });
}
it('[A-N99] student confirms linked details and email OTP completes on the same page', async () => {
  stub(); const done = vi.fn(); render(<StudentVerificationPanel onVerified={done} />);
  await start();
  expect(done).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Open received code' }));
  expect(await screen.findByLabelText('Local verification code')).toHaveTextContent('271828');
  fireEvent.change(screen.getByLabelText('One-time code'), { target: { value: '271828' } });
  fireEvent.click(screen.getByRole('button', { name: 'Verify and complete' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Verification completed');
  expect(done).toHaveBeenCalledWith(expect.objectContaining({ status: 'verified' }));
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
it('[A-N99] linked SMS selection is sent without accepting a caller-supplied phone number', async () => {
  stub(); render(<StudentVerificationPanel />); await start('sms');
  const sent = fetch.mock.calls.find(([url]) => String(url).endsWith('send-otp'));
  expect(JSON.parse(sent[1].body)).toEqual({ channel: 'sms', consent: true, detailsAreMine: true });
  expect(screen.getByText(/Code addressed to Phone ending 0001 by SMS/)).toBeInTheDocument();
});
it('[A-N99] incorrect OTP stays on the current page and never reports success or forwards to an officer', async () => {
  stub(true); const done = vi.fn(); render(<StudentVerificationPanel onVerified={done} />); await start();
  fireEvent.change(screen.getByLabelText('One-time code'), { target: { value: '000000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Verify and complete' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('That code is incorrect. Try again.');
  expect(done).not.toHaveBeenCalled();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
