import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import {
  deployableStatusPlugin,
  IMGitHubDeploymentsDashboard,
} from '../src/plugin';

createDevApp()
  .registerPlugin(deployableStatusPlugin)
  .addPage({
    element: <IMGitHubDeploymentsDashboard />,
    title: 'Root Card',
    path: '/im-github-deployments',
  })
  .render();
