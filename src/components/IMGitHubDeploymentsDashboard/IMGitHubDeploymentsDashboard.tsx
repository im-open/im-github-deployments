import React from 'react';
import { useEntity, MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import { Header, ErrorPanel } from '@backstage/core-components';
import { GITHUB_PROJECT_SLUG_ANNOTATION, isGithubDeploymentsAvailable } from '../../Router';
import { ANNOTATION_LOCATION, ANNOTATION_SOURCE_LOCATION } from '@backstage/catalog-model';
import { GitHubDeploymentsComponents } from './GitHubDeploymentsComponents';

export const IMGitHubDeploymentsDashboard = (props: { last?: number }) => {
  try {
    const { last } = props;
    const { entity } = useEntity();
    const [host] = [
      entity?.metadata.annotations?.[ANNOTATION_SOURCE_LOCATION],
      entity?.metadata.annotations?.[ANNOTATION_LOCATION]
    ].filter(Boolean);

    return !isGithubDeploymentsAvailable(entity) ? (
      <MissingAnnotationEmptyState annotation={GITHUB_PROJECT_SLUG_ANNOTATION} />
    ) : (
      <GitHubDeploymentsComponents
        projectSlug={entity?.metadata.annotations?.[GITHUB_PROJECT_SLUG_ANNOTATION] || ''}
        last={last || 100}
        host={host}
      />
    );
  } catch (e) {
    return (
      <div>
        <Header title="Welcome to im-github-deployments!" />
        <ErrorPanel error={e as Error} />
      </div>
    );
  }
};
