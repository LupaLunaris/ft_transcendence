import "@testing-library/jest-dom";
import { beforeAll, vi } from 'vitest';
import i18n from '../i18n';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

vi.mock('@/game/scenes/BaseScene', () => ({
  TILE_SIZE: 32,
}));

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});
