import React /*, { CSSProperties }*/ from 'react';
import {
  GridColDef,
  GridValueGetterParams,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Link, Tooltip, Typography } from '@material-ui/core';
import { DateTime } from 'ts-luxon';
import { compareVersions } from 'compare-versions';
import CheckIcon from '@material-ui/icons/Check';

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
    <Link href={buildLink(context)} color="primary" target="_blank">
      {linkText}
    </Link>
  );
};

export const columnHeaderClass = 'deployments-header';

const columnDef = (
  field: string,
  header: string,
  type: string,
  width: number,
  flex: boolean,
) =>
  ({
    headerClassName: columnHeaderClass,
    field: field,
    headerName: header,
    type: type,
    sortable: true,
    filterable: false,
    width: width,
    flex: flex ? 1 : 0,
    headerAlign: 'left',
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

export function columns(catalogEnvironments?: string[]): GridColDef[] {
  return [
    {
      ...columnDef('current', 'Current', 'boolean', 100, false),
      renderCell: (params: GridRenderCellParams) =>
        params.row.state.toLowerCase() == 'success' ? <CheckIcon /> : '',
      valueGetter: (params: GridValueGetterParams) =>
        params.row.state.toLowerCase() == 'success',
      sortComparator: (a: boolean, b: boolean) => (a == b ? 0 : a ? -1 : 1),
      filterable: true,
    },
    {
      ...columnWithValueAndLinkDef(
        'displayEnvironment',
        'Environment',
        'string',
        200,
        false,
        (_, params) => `deployments/${params.row.displayEnvironment}`,
      ),
      filterable: true,
      sortComparator:
        catalogEnvironments && catalogEnvironments.length > 0
          ? (a: string, b: string) => {
              if (a !== b) {
                for (let i in catalogEnvironments) {
                  let env = catalogEnvironments[i];
                  if (a == env) return -1;
                  if (b == env) return 1;
                }
              }
              return 0;
            }
          : valueComparator,
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
      sortComparator: compareVersions,
      filterable: true,
    },
    {
      ...columnDef('instance', 'Instance', 'string', 250, true),
      valueGetter: (params: GridValueGetterParams) =>
        params.row.payload.instance,
      filterable: true,
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
      filterable: true,
    },
    {
      ...columnDef('created_at', 'Deployed', 'string', 200, false),
      renderCell: (params: GridRenderCellParams) =>
        params.row.created_at && (
          <Tooltip title={params.row.createdHuman}>
            <Typography variant="body1">
              {DateTime.fromISO(params.row.created_at).toFormat(
                'MM/dd/yy HH:mm a',
              )}
            </Typography>
          </Tooltip>
        ),
      sortComparator: (a: string, b: string) => {
        const aDate = DateTime.fromISO(a);
        const bDate = DateTime.fromISO(b);
        return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
      },
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
      filterable: true,
    },
  ];
}
