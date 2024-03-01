import React, { useState, useEffect } from 'react';
import { EnvDeployment } from '../../api/types';
// import { InfoCard } from '@backstage/core-components';
import { /*Button,*/ Grid, Typography } from '@material-ui/core';
import { Table } from '@backstage/core-components';
// import { DataGrid, gridClasses } from '@mui/x-data-grid';
// import { alpha, styled } from '@mui/material/styles';
import { defaultDeploymentColumns } from './columns2';
import SyncIcon from '@material-ui/icons/Sync';

/** @public */
export const TableDeployments = (props: {
  loading: boolean;
  deployments: EnvDeployment[];
  projectSlug: string;
  reloadDashboard: () => void;
}) => {
  const { reloadDashboard } = props;
  const [deployments, setDeployments] = useState<EnvDeployment[]>([]);

  useEffect(() => {
    if (!props.loading) {
      setDeployments(props.deployments);
    }
  }, [props.loading, props.deployments]);

  // const StyledGrid = styled(DataGrid)(({ theme }) => ({
  //   [`& .${gridClasses.row}.current`]: {
  //     backgroundColor: alpha(theme.palette.primary.light, 0.4),
  //   },
  // })) as typeof DataGrid;

  const DeploymentsTable = () {

    return (<Table
      columns={defaultDeploymentColumns}
      options={{
        padding: 'dense',
        paging: deployments.length > 20,
        search: false,
        pageSize: 10,
        pageSizeOptions: [20, 50, 100],
        filtering: true,
        searchText: '',
      }}
      title="GitHub Deployments"
      data={deployments || []}
      isLoading={props.loading}
      actions={[
        {
          icon: () => <SyncIcon />,
          tooltip: 'Reload',
          isFreeAction: true,
          onClick: () => reloadDashboard(),
        },
      ]}
      emptyContent={
        <div>
          <Typography variant="body1">
            No deployments found for this entity.
          </Typography>
        </div>
      }
    />);
  }

  return (
    // <InfoCard
    //   title="Deployments"
    //   action={
    //     <Button
    //       onClick={() => reloadDashboard()}
    //       variant="outlined"
    //       size="small"
    //     >
    //       <SyncIcon />
    //     </Button>
    //   }
    // >
    //   <Grid item sm={12} md={12} lg={12}>
    <Grid container spacing={3} alignItems="stretch">
      <Grid item sm={12} md={12} lg={12}>
        {/* <Grid container spacing={3} alignItems="stretch"> */}
        {/* <StyledGrid
                loading={props.loading}
                rows={deployments}
                columns={columns}
                disableRowSelectionOnClick={true}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 100]}
              /> */}
              <DeploymentsTable />
        {/* </Grid> */}
      </Grid>
    </Grid>
    //   </Grid>
    // </InfoCard>
  );
};
