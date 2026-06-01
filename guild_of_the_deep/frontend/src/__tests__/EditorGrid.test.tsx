import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { EditorGrid } from '@/components/editor/EditorGrid';
import { TILE, GRID_SIZE, type Grid } from '@ft/shared';

function makeGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => TILE.EMPTY),
  ) as Grid;
}

describe('EditorGrid', () => {
  it(`renders exactly ${GRID_SIZE * GRID_SIZE} cells`, () => {
    const { container } = render(
      <EditorGrid grid={makeGrid()} selectedTile={TILE.WALL} onTileClick={() => {}} />,
    );
    // The container div + GRID_SIZE*GRID_SIZE cell divs
    const cells = container.querySelectorAll('[style*="background-color"]');
    expect(cells).toHaveLength(GRID_SIZE * GRID_SIZE);
  });

  it('uses fixed 22px columns — not 1fr', () => {
    const { container } = render(
      <EditorGrid grid={makeGrid()} selectedTile={TILE.WALL} onTileClick={() => {}} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.gridTemplateColumns).toBe(`repeat(${GRID_SIZE}, 22px)`);
    expect(wrapper.style.gridTemplateColumns).not.toContain('1fr');
  });

  it('calls onTileClick with (colIdx, rowIdx) on click', async () => {
    const onTileClick = vi.fn();
    const { container } = render(
      <EditorGrid grid={makeGrid()} selectedTile={TILE.WALL} onTileClick={onTileClick} />,
    );
    const cells = container.querySelectorAll('[style*="background-color"]');
    // Cell at index (row=1, col=3) → flat index = 1*25+3 = 28
    await userEvent.click(cells[28] as HTMLElement);
    expect(onTileClick).toHaveBeenCalledWith(3, 1);
  });

  it('calls onTileClick on mouseenter while left button held (drag paint)', () => {
    const onTileClick = vi.fn();
    const { container } = render(
      <EditorGrid grid={makeGrid()} selectedTile={TILE.WALL} onTileClick={onTileClick} />,
    );
    const cells = container.querySelectorAll('[style*="background-color"]');
    // Simulate drag: mouseenter with buttons=1 (left button down)
    fireEvent.mouseEnter(cells[0] as HTMLElement, { buttons: 1 });
    expect(onTileClick).toHaveBeenCalledWith(0, 0);
  });

  it('does NOT call onTileClick on mouseenter without button held', () => {
    const onTileClick = vi.fn();
    const { container } = render(
      <EditorGrid grid={makeGrid()} selectedTile={TILE.WALL} onTileClick={onTileClick} />,
    );
    const cells = container.querySelectorAll('[style*="background-color"]');
    fireEvent.mouseEnter(cells[0] as HTMLElement, { buttons: 0 });
    expect(onTileClick).not.toHaveBeenCalled();
  });

  it('applies WALL color to WALL tiles', () => {
    const grid = makeGrid();
    grid[0][0] = TILE.WALL;
    const { container } = render(
      <EditorGrid grid={grid} selectedTile={TILE.EMPTY} onTileClick={() => {}} />,
    );
    const firstCell = container.querySelector('[style*="background-color"]') as HTMLElement;
    expect(firstCell.style.backgroundColor).toBe('rgb(92, 61, 143)'); // #5c3d8f
  });
});
