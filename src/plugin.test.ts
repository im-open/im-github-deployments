import { deployableStatusPlugin } from './plugin';

describe('im-github-deployments', () => {
  it('should export plugin', () => {
    expect(deployableStatusPlugin).toBeDefined();
  });
});
