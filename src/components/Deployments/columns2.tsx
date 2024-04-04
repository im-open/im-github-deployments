import React from 'react';
import { TableColumn } from '@backstage/core-components';
import { Link, Tooltip, Typography } from '@material-ui/core';
import { EnvDeployment } from '../../api/types';
import { DateTime } from 'ts-luxon';
import CustomDatePicker from './customDatePicker';
import CheckIcon from '@material-ui/icons/Check';

type version = {
  version: string;
  major: number;
  minor: number;
  build: number;
};

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

  vRegEx: RegExp = new RegExp(
    '(?<major>[0-9]+).(?<minor>[0-9]+).(?<build>[0-9]+)',
  ); //'^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,3}');

  parseVersionString = (versionString: string): version => {
    const result = this.vRegEx.exec(versionString);
    if (result) {
      const [_, major, minor, build] = result;
      return {
        version: versionString.toLowerCase().trim(),
        major: Number.parseInt(major),
        minor: Number.parseInt(minor),
        build: Number.parseInt(build),
      };
    }
    return { version: '', major: 0, minor: 0, build: 0 };
  };

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

  createCurrentColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Current',
      field: 'current',
      highlight: false,
      width: '100px',
      render: (row: EnvDeployment) => (row.current ? <CheckIcon /> : undefined),
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

  tagRegExp: RegExp = /^(v?\d+(?:\.\d+)*.*)$/g;
  shaRegExp: RegExp = /\b([0-9a-f]{40})\b/g;

  createTagRefColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Branch/Tag/SHA',
      field: 'ref',
      highlight: false,
      customSort: (a: EnvDeployment, b: EnvDeployment) => {
        const aVersion = this.parseVersionString(a.ref);
        const bVersion = this.parseVersionString(b.ref);
        const versionDiff =
          aVersion.major - bVersion.major ||
          aVersion.minor - bVersion.minor ||
          aVersion.build - bVersion.build;

        if (versionDiff == 0) {
          if (aVersion.version == bVersion.version) {
            return 0;
          } else {
            return aVersion.version < bVersion.version ? -1 : 1;
          }
        } else {
          return versionDiff;
        }
      },
      render: (row: EnvDeployment) => {
        const context = this.getContext(row.payload.workflow_run_url as string);
        const tagTest = this.tagRegExp.exec(row.ref);
        const shaTest = this.shaRegExp.exec(row.ref);

        //default to branch
        let url: string = `https://${context.server}/${context.owner}/${context.repo}/tree/${row.ref}`;
        if (tagTest) {
          url = `https://${context.server}/${context.owner}/${context.repo}/releases/tag/${row.ref}`;
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
    factory.createCurrentColumn(),
    factory.createEnvironmentColumn(),
    factory.createTagRefColumn(),
    factory.createInstanceColumn(),
    factory.createStatusColumn(),
    factory.createDeployedColumn(),
    factory.creataUserColumn(),
  ];
};
