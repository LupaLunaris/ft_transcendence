import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { Joystick } from '@/components/ui/Joystick';

// jsdom implements neither pointer capture nor layout: the capture calls become
// no-ops and getBoundingClientRect() returns zeros, so the ring's center is
// (0, 0) and clientX/clientY below double as the offset from it.
beforeAll(() => {
	Element.prototype.setPointerCapture = vi.fn();
	Element.prototype.releasePointerCapture = vi.fn();
	Element.prototype.hasPointerCapture = vi.fn(() => false);
});

const onDirection = vi.fn();

function ring() {
	// The only element with a pointer handler; the thumb is pointer-events-none.
	return screen.getByTestId('joystick-ring');
}

function renderJoystick() {
	return render(
		<div data-testid="joystick-ring">
			<Joystick onDirection={onDirection} />
		</div>,
	);
}

/** Calls in order, as [direction, pressed] pairs. */
function calls() {
	return onDirection.mock.calls.map(([dir, pressed]) => [dir, pressed]);
}

beforeEach(() => {
	onDirection.mockClear();
});

describe('Joystick', () => {
	it('presses the dominant axis direction on pointer down', () => {
		renderJoystick();
		fireEvent.pointerDown(ring().firstChild!, { pointerId: 1, clientX: 40, clientY: 5 });

		expect(calls()).toEqual([['right', true]]);
	});

	it('ignores a press inside the dead zone', () => {
		renderJoystick();
		fireEvent.pointerDown(ring().firstChild!, { pointerId: 1, clientX: 3, clientY: 2 });

		expect(onDirection).not.toHaveBeenCalled();
	});

	// The scenes OR the touch state with the keyboard and resolve conflicts with a
	// fixed left>right>up>down priority, so two directions held at once would
	// silently override the player's gesture.
	it('never holds two directions at once when sliding across axes', () => {
		renderJoystick();
		const base = ring().firstChild!;

		fireEvent.pointerDown(base, { pointerId: 1, clientX: 40, clientY: 0 });
		fireEvent.pointerMove(base, { pointerId: 1, clientX: 0, clientY: -40 });

		expect(calls()).toEqual([
			['right', true],
			['right', false],   // released BEFORE the new direction is pressed
			['up', true],
		]);
	});

	it('keeps the axis until the other one clearly leads (no flapping at 45°)', () => {
		renderJoystick();
		const base = ring().firstChild!;

		fireEvent.pointerDown(base, { pointerId: 1, clientX: 30, clientY: 0 });
		fireEvent.pointerMove(base, { pointerId: 1, clientX: 30, clientY: 31 });   // barely leading
		fireEvent.pointerMove(base, { pointerId: 1, clientX: 30, clientY: 45 });   // clearly leading

		expect(calls()).toEqual([
			['right', true],
			['right', false],
			['down', true],
		]);
	});

	it('releases on pointer up, and again on the lost-capture that follows', () => {
		renderJoystick();
		const base = ring().firstChild!;

		fireEvent.pointerDown(base, { pointerId: 1, clientX: -40, clientY: 0 });
		fireEvent.pointerUp(base, { pointerId: 1, clientX: -40, clientY: 0 });
		fireEvent.lostPointerCapture(base, { pointerId: 1 });

		expect(calls()).toEqual([['left', true], ['left', false]]);
	});

	it('releases a held direction when unmounted mid-hold', () => {
		const { unmount } = renderJoystick();
		fireEvent.pointerDown(ring().firstChild!, { pointerId: 1, clientX: 0, clientY: 40 });
		unmount();

		expect(calls()).toEqual([['down', true], ['down', false]]);
	});

	// Regression: the callers pass an inline onDirection, so it changes identity
	// on every parent render. A cleanup keyed on it would release the direction
	// the player is still holding.
	it('keeps the direction pressed across a parent re-render', () => {
		function Parent() {
			const [, setTick] = useState(0);
			return (
				<div data-testid="joystick-ring">
					<button type="button" onClick={() => setTick(t => t + 1)}>rerender</button>
					<Joystick onDirection={(d, p) => onDirection(d, p)} />
				</div>
			);
		}
		render(<Parent />);
		const base = screen.getByTestId('joystick-ring').lastChild!;

		fireEvent.pointerDown(base, { pointerId: 1, clientX: 40, clientY: 0 });
		fireEvent.click(screen.getByText('rerender'));

		expect(calls()).toEqual([['right', true]]);
	});
});
