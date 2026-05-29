import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { NotificationPreferences } from '../NotificationPreferences';

describe('NotificationPreferences', () => {
  const defaultPreferences = {
    push: true,
    email: true,
    sms: false,
  };

  it('renders all notification options', () => {
    const onChange = vi.fn();
    render(
      <NotificationPreferences
        preferences={defaultPreferences}
        onChange={onChange}
      />
    );

    expect(screen.getByText('Push Notifications')).toBeInTheDocument();
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('SMS Notifications')).toBeInTheDocument();
  });

  it('displays correct initial toggle states', () => {
    const onChange = vi.fn();
    render(
      <NotificationPreferences
        preferences={defaultPreferences}
        onChange={onChange}
      />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toHaveAttribute('aria-checked', 'true'); // push
    expect(switches[1]).toHaveAttribute('aria-checked', 'true'); // email
    expect(switches[2]).toHaveAttribute('aria-checked', 'false'); // sms
  });

  it('calls onChange when push notification toggle is clicked', () => {
    const onChange = vi.fn();
    render(
      <NotificationPreferences
        preferences={defaultPreferences}
        onChange={onChange}
      />
    );

    const pushSwitch = screen.getAllByRole('switch')[0];
    fireEvent.click(pushSwitch);

    expect(onChange).toHaveBeenCalledWith({
      push: false,
      email: true,
      sms: false,
    });
  });

  it('calls onChange when email notification toggle is clicked', () => {
    const onChange = vi.fn();
    render(
      <NotificationPreferences
        preferences={defaultPreferences}
        onChange={onChange}
      />
    );

    const emailSwitch = screen.getAllByRole('switch')[1];
    fireEvent.click(emailSwitch);

    expect(onChange).toHaveBeenCalledWith({
      push: true,
      email: false,
      sms: false,
    });
  });

  it('SMS toggle is disabled', () => {
    const onChange = vi.fn();
    render(
      <NotificationPreferences
        preferences={defaultPreferences}
        onChange={onChange}
      />
    );

    const smsSwitch = screen.getAllByRole('switch')[2];
    expect(smsSwitch).toBeDisabled();
  });
});
