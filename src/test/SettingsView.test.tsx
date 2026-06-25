import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsView from '../components/SettingsView';
import { Project } from '../types';

describe('SettingsView', () => {
  const mockOnLogout = vi.fn();
  const mockProject: Project = {
    id: 'proj_123',
    name: 'Quantum Computing Research',
    description: 'Quantum computing paper analysis',
    created_at: '2026-06-24',
    updated_at: '2026-06-24'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correct project name and ID', () => {
    render(
      <SettingsView
        projectId="proj_123"
        project={mockProject}
        token="mock_token"
        onLogout={mockOnLogout}
      />
    );

    expect(screen.getByText('proj_123')).toBeInTheDocument();
    expect(screen.getByText('Quantum Computing Research')).toBeInTheDocument();
    expect(screen.getByText('Cloud SQL (PostgreSQL)')).toBeInTheDocument();
  });

  it('handles logout callback', () => {
    render(
      <SettingsView
        projectId="proj_123"
        project={mockProject}
        token="mock_token"
        onLogout={mockOnLogout}
      />
    );

    const logoutBtn = screen.getByText('Log Out Station');
    fireEvent.click(logoutBtn);
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('clears local cache and reloads', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    render(
      <SettingsView
        projectId="proj_123"
        project={mockProject}
        token="mock_token"
        onLogout={mockOnLogout}
      />
    );

    const clearCacheBtn = screen.getByText('Clear Local Cache');
    
    vi.useFakeTimers();
    fireEvent.click(clearCacheBtn);
    
    expect(removeItemSpy).toHaveBeenCalledWith('research_workspace_token');
    expect(removeItemSpy).toHaveBeenCalledWith('research_project_id');

    act(() => {
      vi.runAllTimers();
    });
    expect(reloadMock).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
