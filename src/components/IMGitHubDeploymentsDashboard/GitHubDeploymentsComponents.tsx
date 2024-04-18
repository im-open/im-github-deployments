import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import { RestDeployment, EnvDeployment } from '../../api/types';
import { githubDeploymentsApiRef } from '../../api';
import { Deployments } from '../Deployments';
import { ResponseErrorPanel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Grid } from '@material-ui/core';
import { DateTime } from 'ts-luxon';

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

    //get max deployment dates
    // TODO: Need to figure out where *'s are coming from
    const cleanEnv = (env: string) => env.toLowerCase().replace('*', '');

    for (var status of apiDeploymentStatuses) {
      const env = getKeyFromList(
        cleanEnv(status.environment),
        catalogEnvironments,
      );
      const deployment = ghDeployments.filter(
        d => d.node_id == status.deployment_node_id,
      )[0];

      apiDeployments.push({
        ...deployment,
        displayEnvironment: env,
        state: status.state,
        proprojectSlug: projectSlug,
        latest: undefined,
      } as EnvDeployment);
    }

    const mapped = apiDeployments.reduce((acc: any, d: EnvDeployment) => {
      const env = cleanEnv(d.environment);
      const key = `${env}::${d.payload.instance}`;
      acc[key] = acc[key] || [];
      acc[key].push({
        ...d,
        environment: env,
        instance: d.payload.instance,
        created_at: d.created_at,
      });
      return acc;
    }, {});

    const toSeconds = (d: DateTime) =>
      parseInt(DateTime.fromISO(d.toString()).toFormat('X'));

    const maxDeployments = Object.entries(mapped).map(([_, value]) => {
      const max = (value as any[]).reduce((prev, curr) =>
        toSeconds(prev.created_at) >= toSeconds(curr.created_at) ? prev : curr,
      );
      return {
        environment: max.environment,
        instance: max.instance,
        lastCreatedAt: max.created_at,
      };
    });

    apiDeployments.sort((a, b) => (a.id < b.id ? 1 : -1));
    return {
      apiDeployments: apiDeployments.map(d => {
        return {
          ...d,
          latest:
            maxDeployments.filter(
              f =>
                f.environment == cleanEnv(d.environment) &&
                f.instance == d.payload.instance &&
                f.lastCreatedAt == d.created_at,
            ).length > 0,
        } as EnvDeployment;
      }),
      catalogEnvironments: catalogEnvironments,
    };
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
          deployments={value?.apiDeployments || []}
          catalogEnvironments={value?.catalogEnvironments || []}
          reloadDashboard={reload}
        />
      </Grid>
    </Grid>
  );
};
