import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { SearchRadiusSlider } from '../SearchRadiusSlider';

describe('SearchRadiusSlider', () => {
  it('renders with initial value', () => {
    const onChange = vi.fn();
    render(<SearchRadiusSlider value={10} onChange={onChange} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('10');
    expect(screen.getByText('10 miles')).toBeInTheDocument();
  });

  it('calls onChange when slider value changes', () => {
    const onChange = vi.fn();
    render(<SearchRadiusSlider value={5} onChange={onChange} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '25' } });

    expect(onChange).toHaveBeenCalledWith(25);
  });

  it('displays singular "mile" for value of 1', () => {
    const onChange = vi.fn();
    render(<SearchRadiusSlider value={1} onChange={onChange} />);

    // Check the main display (not the reference labels)
    const mileDisplay = screen.getAllByText('1 mile')[0];
    expect(mileDisplay).toBeInTheDocument();
  });

  it('displays plural "miles" for values greater than 1', () => {
    const onChange = vi.fn();
    render(<SearchRadiusSlider value={15} onChange={onChange} />);

    expect(screen.getByText('15 miles')).toBeInTheDocument();
  });

  it('respects min and max values (1-50)', () => {
    const onChange = vi.fn();
    render(<SearchRadiusSlider value={25} onChange={onChange} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '50');
  });
});
