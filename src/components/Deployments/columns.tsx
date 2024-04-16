import React from 'react';
import { TableColumn } from '@backstage/core-components';
import { Link, Tooltip, Typography } from '@material-ui/core';
import { EnvDeployment } from '../../api/types';
import { DateTime } from 'ts-luxon';
import CustomDatePicker from './customDatePicker';
import CheckIcon from '@material-ui/icons/Check';
import semver from 'semver';

type gitHubContext = {
  server: string;
  owner: string;
  repo: string;
};

class columnFactory {
  catalogEnvironments: string[];
  catalogEnvironmentsLower: string[];

  constructor(props: { catalogEnvironments: string[] }) {
    this.catalogEnvironments = props.catalogEnvironments;
    this.catalogEnvironmentsLower = this.catalogEnvironments.map(env =>
      env.toLowerCase(),
    );
  }

  getContext(workflow_run_url: string): gitHubContext {
    const parts = workflow_run_url.split('/');
    return {
      server: parts[2],
      owner: parts[3],
      repo: parts[4],
    } as gitHubContext;
  }

  buildLink(url: string, text: string): JSX.Element {
    return (
      <Link href={url} color="primary" target="_blank">
        {text}
      </Link>
    );
  }

  catalogEnvironment(env: string): string {
    const index = this.catalogEnvironmentsLower.indexOf(env.toLowerCase());
    if (index >= 0) {
      return this.catalogEnvironments[index];
    }
    return env;
  }

  catalogEnvironmentSort(envA: string, envB: string): number {
    let sortVal = 0;
    const aLower = this.catalogEnvironment(envA).toLowerCase();
    const bLower = this.catalogEnvironment(envB).toLowerCase();

    if (this.catalogEnvironments.length == 0) {
      sortVal = aLower < bLower ? -1 : 1;
    } else {
      if (aLower !== bLower) {
        for (let i in this.catalogEnvironments) {
          const envLower = this.catalogEnvironments[i].toLowerCase();
          if (aLower == envLower) {
            sortVal = 1;
            break;
          }
          if (bLower == envLower) {
            sortVal = -1;
            break;
          }
        }
      }
    }
    return sortVal;
  }

  createIdColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'ID',
      field: 'id',
      highlight: false,
      hidden: true,
    };
  }

  createLatestColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Latest',
      field: 'latest',
      highlight: false,
      width: '100px',
      render: (row: EnvDeployment) => (row.latest ? <CheckIcon /> : undefined),
      lookup: {
        true: '✔',
        false: undefined,
      },
    };
  }

  createEnvironmentColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Environment',
      field: 'environment',
      highlight: false,
      width: '100px',
      customSort: (a: EnvDeployment, b: EnvDeployment) =>
        this.catalogEnvironmentSort(a.environment, b.environment),
      render: (row: EnvDeployment) => {
        const env = this.catalogEnvironment(row.environment);
        const context = this.getContext(row.payload.workflow_run_url as string);
        const url = `https://${context.server}/${context.owner}/${context.repo}/deployments/${env}`;
        return this.buildLink(url, env);
      },
    };
  }

  shaRegExp: RegExp = /^[0-9a-f]{40}$/g;

  createTagRefColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Branch/Tag/SHA',
      field: 'ref',
      highlight: false,
      customSort: (a: EnvDeployment, b: EnvDeployment) => {
        const aTag = semver.parse(a.ref);
        const bTag = semver.parse(b.ref);
        let diffValue = 0;

        if (aTag && bTag) {
          diffValue = semver.eq(aTag, bTag)
            ? 0
            : semver.gt(aTag, bTag)
            ? -1
            : 1;
        } else {
          if (a.ref !== b.ref) {
            diffValue = a.ref < b.ref ? -1 : 1;
          }
        }
        return diffValue;
      },
      render: (row: EnvDeployment) => {
        const context = this.getContext(row.payload.workflow_run_url as string);
        const tagTest = semver.parse(row.ref);
        const shaTest = this.shaRegExp.exec(row.ref);

        //default to branch
        let url: string = `https://${context.server}/${context.owner}/${context.repo}/tree/${row.ref}`;
        if (tagTest) {
          url = `https://${context.server}/${context.owner}/${context.repo}/releases/tag/${tagTest.raw}`;
        } else if (shaTest) {
          url = `https://${context.server}/${context.owner}/${context.repo}/commit/${row.ref}`;
        }

        return this.buildLink(url, row.ref);
      },
    };
  }

  createInstanceColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Instance',
      field: 'payload.instance',
      highlight: false,
    };
  }

  createStatusColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Status',
      field: 'state',
      highlight: false,
      width: '300px',
      // These are fixed values that GitHub allows
      // https://docs.github.com/en/rest/deployments/statuses?apiVersion=2022-11-28#create-a-deployment-status
      lookup: {
        SUCCESS: 'SUCCESS',
        INACTIVE: 'INACTIVE',
        IN_PROGRESS: 'IN PROGRESS',
        FAILURE: 'FAILURE',
        ERROR: 'ERROR',
        QUEUED: 'QUEUED',
        PENDING: 'PENDING',
      },
      render: (row: EnvDeployment) =>
        this.buildLink(
          row.payload.workflow_run_url as string,
          row.state.toUpperCase(),
        ),
    };
  }

  createDeployedColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Deployed',
      field: 'created_at',
      highlight: false,
      type: 'date',
      dateSetting: { locale: 'en-US' },
      customSort: (a: EnvDeployment, b: EnvDeployment) =>
        a.created_at === b.created_at
          ? 0
          : a.created_at < b.created_at
          ? 1
          : -1,
      render: (row: EnvDeployment) => (
        <Tooltip
          title={<h2>{row.createdHuman}</h2>}
          style={{ cursor: 'pointer' }}
        >
          <Typography variant="body1">
            {DateTime.fromISO(row.created_at.toString()).toFormat(
              'MM/dd/yy hh:mm a (ZZZZ)',
            )}
          </Typography>
        </Tooltip>
      ),
      filterComponent: props => <CustomDatePicker {...props} />,
    };
  }

  creataUserColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'User',
      field: 'payload.workflow_actor',
      render: (row: EnvDeployment) => {
        const user = row.payload.workflow_actor ?? row.deployed_by;
        const context = this.getContext(row.payload.workflow_run_url as string);
        const url = `https://${context.server}/${user}`;
        return this.buildLink(url, user);
      },
    };
  }
}

export const deploymentsColumns = (catalogEnvironments: string[]) => {
  const factory = Object.freeze(
    new columnFactory({ catalogEnvironments: catalogEnvironments }),
  );

  return [
    factory.createLatestColumn(),
    factory.createEnvironmentColumn(),
    factory.createTagRefColumn(),
    factory.createInstanceColumn(),
    factory.createStatusColumn(),
    factory.createDeployedColumn(),
    factory.creataUserColumn(),
  ];
};
