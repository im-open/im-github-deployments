import { Octokit as OctokitRest } from '@octokit/rest';
import { graphql as OctokitGraphQl } from '@octokit/graphql';
import { createApiRef, OAuthApi } from '@backstage/core-plugin-api';
import {
  RestDeployment,
  RestDeploymentStatus,
  GraphQlDeployment,
} from './types';
import { DateTime } from 'ts-luxon';

type DeploymentsQueryParams = {
  host: string | undefined;
  owner: string;
  repo: string;
  entity: string;
  last: number;
};

type AllDeploymentStatusQueryParams = {
  deploymentNodeIds: string[];
};

export interface GithubDeploymentsApi {
  listDeployments(params: DeploymentsQueryParams): Promise<RestDeployment[]>;

  listAllDeploymentStatuses(
    params: AllDeploymentStatusQueryParams,
  ): Promise<RestDeploymentStatus[]>;
}

export const githubDeploymentsApiRef = createApiRef<GithubDeploymentsApi>({
  id: 'plugin.im-github-deplyments.service',
});

export type Options = {
  githubAuthApi: OAuthApi;
};

export class GithubDeploymentsApiClient implements GithubDeploymentsApi {
  private readonly githubAuthApi: OAuthApi;
  private token: string | undefined;

  constructor(options: Options) {
    this.githubAuthApi = options.githubAuthApi;
  }

  fetchToken = async () =>
    (this.token = await this.githubAuthApi.getAccessToken(['repo']));

  async listDeployments(
    params: DeploymentsQueryParams,
  ): Promise<RestDeployment[]> {
    await this.fetchToken();
    const octokit = new OctokitRest({ auth: this.token });

    const restParams = {
      owner: params.owner,
      repo: params.repo,
      task: 'workflowdeploy',
      per_page: params.last,
    };

    const formatDeployments = (d: any) => {
      return {
        id: d.id,
        node_id: d.node_id,
        status_url: d.statuses_url,
        url: d.url,
        task: d.task,
        created_at: d.created_at,
        createdHuman: DateTime.fromISO(d.created_at).toRelative({
          locale: 'en',
        }),
        deployed_by: d.creator?.login,
        environment: d.environment,
        ref: d.ref,
        payload: {
          workflow_actor: d.payload?.workflow_actor,
          instance: d.payload?.instance,
          entity: d.payload?.entity,
          workflow_run_url: d.payload?.workflow_run_url,
        },
      } as RestDeployment;
    };

    const restDeployments = (
      await octokit.paginate(octokit.rest.repos.listDeployments, restParams)
    )
      .filter(d => d.task === 'workflowdeploy')
      .map(d => formatDeployments(d))
      .sort((a, b) => (a.id > b.id ? 1 : -1));

    return restDeployments;
  }

  async listAllDeploymentStatuses(
    params: AllDeploymentStatusQueryParams,
  ): Promise<RestDeploymentStatus[]> {
    await this.fetchToken();
    const octokit = OctokitGraphQl.defaults({
      headers: {
        authorization: `token ${this.token}`,
      },
    });

    const statusesQuery = `
      query($deploymentNodeIds: [ID!]!) {
        deployments: nodes(ids: $deploymentNodeIds) {
          ... on Deployment {
            id
            databaseId
            environment
            ref {
              name
            }
            # This assumes we'll never have more than 100 statuses
            # per deployment.... which seems pretty safe
            statuses(first:2) {
              nodes {
                description
                state
                createdAt
              }
            }
          }
        }
      }`;

    type statusesResponse = {
      id: string;
      deployments: GraphQlDeployment[];
    };

    const formatStatuses = (d: statusesResponse) => {
      const formatted: RestDeploymentStatus[] = [];
      for (let i = 0; i < d.deployments.length; i++) {
        let deployment = d.deployments[i];

        if (deployment.statuses.nodes.length > 0) {
          let noInactiveStatuses = deployment.statuses.nodes.filter(
            s => s.state.toUpperCase() != 'INACTIVE',
          );
          let status =
            noInactiveStatuses.length > 0
              ? noInactiveStatuses[0]
              : deployment.statuses.nodes[0];

          formatted.push({
            deployment_id: deployment.databaseId,
            deployment_node_id: deployment.id,
            state: status.state,
            environment: deployment.environment,
            ref: deployment.ref?.name,
            created_at: DateTime.fromISO(status.createdAt),
            createdHuman: DateTime.fromISO(status.createdAt).toRelative({
              locale: 'en',
            }),
          } as RestDeploymentStatus);
        }
      }

      return formatted.sort((a, b) =>
        a.deployment_id < b.deployment_id ? 1 : -1,
      );
    };

    const page = 100;
    const pages = Math.ceil(params.deploymentNodeIds.length / page);
    const statusRequests = [];
    const formattedStatuses: RestDeploymentStatus[] = [];

    for (var i = 0; i < pages; i++) {
      const sliced = params.deploymentNodeIds.slice(i * page, (i + 1) * page);
      statusRequests.push(
        await octokit<statusesResponse>(statusesQuery, {
          deploymentNodeIds: sliced,
        }),
      );
    }

    await Promise.all(statusRequests).then(response => {
      for (var i = 0; i < response.length; i++) {
        formattedStatuses.push(...formatStatuses(response[i]));
      }
    });

    return formattedStatuses;
  }
}
