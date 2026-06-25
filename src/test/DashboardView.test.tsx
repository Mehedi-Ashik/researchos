import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardView from '../components/DashboardView';
import { Project, Paper } from '../types';

describe('DashboardView', () => {
  const mockOnNavigateToTab = vi.fn();
  const mockProject: Project = {
    id: 'proj_123',
    name: 'LLM Systems Evaluation',
    description: 'Literature analysis of LLM reasoning engines'
  };

  const mockPapers: Paper[] = [
    {
      id: 'paper_1',
      title: 'Attention Is All You Need',
      authors: ['Vaswani', 'Shazeer', 'Parmar'],
      journal: 'NeurIPS',
      publication_date: '2017',
      doi: '10.1111/test',
      url: 'https://test.com',
      abstract: 'The dominant sequence transduction models...'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays stats correctly on mount', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    render(
      <DashboardView
        projectId="proj_123"
        project={mockProject}
        papers={mockPapers}
        token="mock_token"
        onNavigateToTab={mockOnNavigateToTab}
      />
    );

    // Wait for the components to fetch and resolve state using our global mock
    await waitFor(() => {
      // Direct innerHTML check is highly robust against nested JSDOM tag splits
      expect(document.body.innerHTML).toContain("With <strong>1</strong> semantic links");
    }, { timeout: 2000 });

    // Verify static labels are present in the DOM
    expect(screen.getByText('Knowledge Entities')).toBeInTheDocument();
    expect(screen.getByText('Extracted Gaps')).toBeInTheDocument();
    expect(screen.getByText('LangGraph Tasks')).toBeInTheDocument();
    expect(screen.getByText('LLM Systems Evaluation')).toBeInTheDocument();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('triggers onNavigateToTab on navigation card clicks', async () => {
    render(
      <DashboardView
        projectId="proj_123"
        project={mockProject}
        papers={mockPapers}
        token="mock_token"
        onNavigateToTab={mockOnNavigateToTab}
      />
    );

    const workspaceBtn = screen.getByText('1. Ingest PDF Literature').closest('div');
    expect(workspaceBtn).toBeTruthy();
    fireEvent.click(workspaceBtn!);
    expect(mockOnNavigateToTab).toHaveBeenCalledWith('workspace');

    const chatBtn = screen.getByText('2. Q&A Synthesis Chat').closest('div');
    expect(chatBtn).toBeTruthy();
    fireEvent.click(chatBtn!);
    expect(mockOnNavigateToTab).toHaveBeenCalledWith('chat');
  });
});
