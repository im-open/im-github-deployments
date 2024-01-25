import { githubDeploymentsApiRef, GithubDeploymentsApiClient } from './api';
import {
  createApiFactory,
  createComponentExtension,
  createPlugin,
  githubAuthApiRef,
} from '@backstage/core-plugin-api';

/** @public */
export const deployableStatusPlugin = createPlugin({
  id: 'im-github-deployments',
  apis: [
    createApiFactory({
      api: githubDeploymentsApiRef,
      deps: { githubAuthApi: githubAuthApiRef },
      factory: ({ githubAuthApi }) =>
        new GithubDeploymentsApiClient({ githubAuthApi }),
    }),
  ],
});

/** @public */
export const IMGitHubDeploymentsDashboard = deployableStatusPlugin.provide(
  createComponentExtension({
    name: 'IMGitHubDeploymentsDashboard',
    component: {
      lazy: () =>
        import('./components/IMGitHubDeploymentsDashboard').then(
          m => m.IMGitHubDeploymentsDashboard,
        ),
    },
  }),
);
