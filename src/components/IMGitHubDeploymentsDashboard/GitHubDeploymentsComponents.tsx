import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import { RestDeployment, EnvDeployment } from '../../api/types';
import { githubDeploymentsApiRef } from '../../api';
import { Deployments } from '../Deployments/Deployments';
import { ResponseErrorPanel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Grid } from '@material-ui/core';

export const GitHubDeploymentsComponents = (props: {
  projectSlug: string;
  last: number;
  host: string | undefined;
}) => {
  const { projectSlug, last, host } = props;
  const entity = useEntity().entity;
  const [owner, repo] = projectSlug.split('/');
  const api = useApi(githubDeploymentsApiRef);

  let environmentIndexList: { [key: string]: string };
  const getKeyFromList = (value: string, list: string[] | undefined) => {
    if (list != undefined && list.length > 0) {
      if (!environmentIndexList) {
        environmentIndexList = Object.fromEntries(
          list.map(e => [e.toLowerCase(), e]),
        );
      }
      return environmentIndexList[value.toLowerCase()];
    } else {
      return value;
    }
  };

  const {
    error,
    value,
    loading,
    retry: reload,
  } = useAsyncRetry(async () => {
    const catalogEnvironments = entity.metadata[
      'deployment-environments'
    ] as string[];
    const apiDeployments: EnvDeployment[] = [];
    const ghDeployments: RestDeployment[] = await api.listDeployments({
      host,
      owner,
      repo,
      entity: entity.metadata.name,
      last,
    });

    const apiDeploymentStatuses = await api.listAllDeploymentStatuses({
      deploymentNodeIds: ghDeployments.map(d => d.node_id),
    });

    for (var status of apiDeploymentStatuses) {
      const statusEnvionment = status.environment.replace('*', ''); // TODO: Need to figure out where *'s are coming from
      const env = getKeyFromList(statusEnvionment, catalogEnvironments);
      const deployment = ghDeployments.filter(
        d => d.node_id == status.deployment_node_id,
      )[0];

      apiDeployments.push({
        ...deployment,
        displayEnvironment: env,
        state: status.state,
        proprojectSlug: projectSlug,
      } as EnvDeployment);
    }

    apiDeployments.sort((a, b) => (a.id < b.id ? 1 : -1));

    return apiDeployments;
  });

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <Grid container spacing={3} alignItems="stretch">
      <Grid item sm={12} md={12} lg={12}>
        <Deployments
          projectSlug={projectSlug}
          loading={loading}
          deployments={value || []}
          reloadDashboard={reload}
        />
      </Grid>
    </Grid>
  );
};
