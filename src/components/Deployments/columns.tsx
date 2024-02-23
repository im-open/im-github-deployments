import React, { CSSProperties } from 'react';
import {
  GridColDef,
  GridValueGetterParams,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Button, Link, Tooltip, Typography } from '@material-ui/core';
import { DateTime } from 'ts-luxon';

const buttonStyle = { height: '15ox', textTransform: 'none' } as CSSProperties;

type gitHubContext = {
  server: string;
  owner: string;
  repo: string;
};

const renderLink = (
  workflow_run_url: string,
  buildLink: (context: gitHubContext) => string,
  linkText: string,
) => {
  const parts = workflow_run_url.split('/');
  const context = {
    server: parts[2],
    owner: parts[3],
    repo: parts[4],
  } as gitHubContext;

  return (
    <Typography variant="body1">
      <Button
        component={Link}
        style={buttonStyle}
        href={buildLink(context)}
        color="primary"
        target="_blank"
      >
        {linkText}
      </Button>
    </Typography>
  );
};

const columnDef = (
  field: string,
  header: string,
  type: string,
  width: number,
  flex: boolean,
) =>
  ({
    field: field,
    headerName: header,
    headerAlign: 'center',
    type: type,
    sortable: true,
    filterable: true,
    width: width,
    flex: flex ? 1 : 0,
  } as GridColDef);

const valueComparator = (a: string, b: string) => {
  if (a == b) return 0;
  else return a < b ? -1 : 1;
};

const columnWithValueAndLinkDef = (
  field: string,
  header: string,
  type: string,
  width: number,
  flex: boolean,
  githubLink: (
    context: gitHubContext,
    params: GridRenderCellParams<any, string>,
  ) => string,
) =>
  ({
    ...columnDef(field, header, type, width, flex),
    sortComparator: valueComparator,
    renderCell: (params: GridRenderCellParams<any, string>) =>
      params.value &&
      renderLink(
        params.row.payload.workflow_run_url,
        context => {
          const link = githubLink(context, params);
          return link.toLowerCase().startsWith('http')
            ? link
            : `https://${context.server}/${context.owner}/${context.repo}/${link}`;
        },
        params.value,
      ),
  } as GridColDef);

export const columns: GridColDef[] = [
  {
    ...columnDef('current', 'Current', 'boolean', 120, false),
    valueGetter: (params: GridValueGetterParams) =>
      params.row.state.toLowerCase() == 'success',
  },
  {
    ...columnWithValueAndLinkDef(
      'environment',
      'Environment',
      'string',
      150,
      false,
      (_, params) => `deployments/${params.row.displayEnvironment}`,
    ),
  },
  {
    ...columnWithValueAndLinkDef(
      'ref',
      'Tag/Ref',
      'string',
      250,
      true,
      (_, params) => `releases/tag/${params.row.ref}`,
    ),
  },
  {
    ...columnDef('instance', 'Instance', 'string', 250, true),
    valueGetter: (params: GridValueGetterParams) => params.row.payload.instance,
  },
  {
    ...columnWithValueAndLinkDef(
      'state',
      'Status',
      'string',
      150,
      false,
      (_, params) => params.row.payload.workflow_run_url,
    ),
  },
  {
    ...columnDef('created_at', 'Deployed', 'string', 200, false),
    renderCell: (params: GridRenderCellParams) =>
      params.row.created_at && (
        <Tooltip title={params.row.createdHuman}>
          <Typography variant="body1">
            {DateTime.fromISO(params.row.created_at).toFormat(
              'MM/dd/yyyy hh:mm a',
            )}
          </Typography>
        </Tooltip>
      ),
  },
  {
    ...columnWithValueAndLinkDef(
      'user',
      'User',
      'string',
      150,
      false,
      (context, params) =>
        `https://${context.server}/${
          params.row.payload.workflow_actor ?? params.row.deployed_by
        }`,
    ),
    valueGetter: (params: GridValueGetterParams) =>
      params.row.payload.workflow_actor ?? params.row.deployed_by,
  },
];
