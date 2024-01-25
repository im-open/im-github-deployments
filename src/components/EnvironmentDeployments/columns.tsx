import React, { CSSProperties } from 'react';
import { Button, Link, Typography } from '@material-ui/core';
import { TableColumn } from '@backstage/core-components';
import { EnvDeployment } from '../../api/types';
import { DateTime } from 'ts-luxon';

const buttonStyle = { height: '15ox', textTransform: 'none' } as CSSProperties;

export const columnFactories = Object.freeze({
  createRefColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Tag/Ref',
      render: (row: EnvDeployment) =>
        row.ref && (
          <Typography variant="body1">
            <Button
              component={Link}
              style={buttonStyle}
              href={`https://github.com/${(row as any).projectSlug}/releases/tag/${row.ref}`}
              color="primary"
              target="_blank"
            >
              {row.ref}
            </Button>
          </Typography>
        )
    };
  },
  createInstanceColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Instance',
      render: (row: EnvDeployment) => {
        let instance = <Typography variant="body1">No instance specified.</Typography>;

        if (row.payload?.instance) {
          if (row.payload?.workflow_run_url) {
            instance = (
              <Typography variant="body1">
                <Button
                  component={Link}
                  style={buttonStyle}
                  href={row.payload?.workflow_run_url}
                  color="primary"
                  target="_blank"
                >
                  {row.payload?.instance}
                </Button>
              </Typography>
            );
          } else {
            instance = <Typography variant="body1">{row.payload?.instance}</Typography>;
          }
        }

        return instance;
      }
    };
  },
  createStateColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'State',
      render: (row: EnvDeployment) =>
        row.state && <Typography variant="body1">{row.state.toUpperCase()}</Typography>
    };
  },
  createDeployedAtColumn(): TableColumn<EnvDeployment> {
    return {
      title: 'Deployed',
      render: (row: EnvDeployment) =>
        row.created_at && (
          <Typography variant="body1">
            {(row.created_at as DateTime).toLocaleString({
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}{' '}
            - {row.createdHuman}
          </Typography>
        )
    };
  },
  createUserColumn(): TableColumn<EnvDeployment> {
    {
      return {
        title: 'User',
        render: (row: EnvDeployment) =>
          (row.payload.workflow_actor || row.deployed_by) && (
            <Typography variant="body1">
              <Button
                component={Link}
                style={buttonStyle}
                href={`https://github.com/${row.payload.workflow_actor ?? row.deployed_by}`}
                color="primary"
                target="_blank"
              >
                {row.payload.workflow_actor ?? row.deployed_by}
              </Button>
            </Typography>
          )
      };
    }
  }
});

export const defaultDeploymentColumns: TableColumn<EnvDeployment>[] = [
  columnFactories.createInstanceColumn(),
  columnFactories.createRefColumn(),
  columnFactories.createStateColumn(),
  columnFactories.createDeployedAtColumn(),
  columnFactories.createUserColumn()
];
