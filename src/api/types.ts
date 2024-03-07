import { DateTime } from 'ts-luxon';

/** @public */
export type RestDeployment = {
  id: number;
  node_id: string;
  status_url: string;
  url: string;
  task: string;
  creator: {
    login: string;
  };
  created_at: DateTime;
  createdHuman: string | null;
  deployed_by: string;
  displayEnvironment: string;
  environment: string;
  ref: string;
  payload: {
    workflow_actor: string | undefined;
    instance: string;
    entity: string;
    workflow_run_url: string | undefined;
  };
};

/** @public */
export type EnvDeployment = RestDeployment & {
  [key: string]: any;
  state: string;
};

/** @public */
export type RestDeploymentStatus = {
  deployment_id: number;
  deployment_node_id: string;
  state: string;
  environment: string;
  instance: string;
  ref: string;
  created_at: DateTime;
  createdHuman: string | null;
};

/** @public */
export type GraphQlDeployment = {
  id: string;
  databaseId: number;
  environment: string;
  ref: {
    name: string;
  };
  statuses: {
    nodes: [
      {
        description: string;
        state: string;
        createdAt: string;
      },
    ];
  };
};
