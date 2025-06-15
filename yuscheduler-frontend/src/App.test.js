import { render, screen } from '@testing-library/react';
import App from './App';

test('renders YU Scheduler title', () => {
  render(<App />);
  const titleElement = screen.getByText(/YU Scheduler/i);
  expect(titleElement).toBeInTheDocument();
});
