import React, { useState } from 'react'
import { useEntity } from '@backstage/plugin-catalog-react'
import useAsyncRetry from 'react-use/lib/useAsyncRetry'
import {
  RestDeployment,
  RestDeploymentStatus,
  EnvState,
  EnvDeployment,
  CurrentEnvStates,
} from '../../api/types'
import { githubDeploymentsApiRef } from '../../api'
import { CurrentEnvironmentDeployments } from '../CurrentEnvironmentDeployments/CurrentEnvironmentDeployments'
import { EnvironmentDeployments } from '../EnvironmentDeployments/EnvironmentDeployments'
import { ResponseErrorPanel } from '@backstage/core-components'
import { useApi } from '@backstage/core-plugin-api'
import { Grid } from '@material-ui/core'

export const GitHubDeploymentsComponents = (props: {
  projectSlug: string
  last: number
  host: string | undefined
}) => {
  const { projectSlug, last, host } = props
  const entity = useEntity().entity

  const [displayEnvironment, setDisplayEnvironment] = useState('DEV')
  const [owner, repo] = projectSlug.split('/')
  const api = useApi(githubDeploymentsApiRef)

  let environmentIndexList: { [key: string]: string }
  const getKeyFromList = (value: string, list: string[] | undefined) => {
    if (list != undefined && list.length > 0) {
      if (!environmentIndexList) {
        environmentIndexList = Object.fromEntries(
          list.map((e) => [e.toLowerCase(), e])
        )
      }
      return environmentIndexList[value.toLowerCase()]
    } else {
      return value.toLowerCase()
    }
  }

  const {
    error,
    value,
    loading,
    retry: reload,
  } = useAsyncRetry(async () => {
    const catalogEnvironments = entity.metadata[
      'deployment-environments'
    ] as string[]
    const apiEnvStates: CurrentEnvStates = {}
    const apiEnvironments = [] as string[]
    const apiDeployments: EnvDeployment[] = []
    const ghDeployments: RestDeployment[] = await api.listDeployments({
      host,
      owner,
      repo,
      entity: entity.metadata.name,
      last,
    })

    const apiAllEnvStates: EnvState[] = []
    const apiStatuses: RestDeploymentStatus[] = []
    const apiDeploymentStatuses = await api.listAllDeploymentStatuses({
      deploymentNodeIds: ghDeployments.map((d) => d.node_id),
    })

    for (let i in apiDeploymentStatuses) {
      const status = apiDeploymentStatuses[i]
      const env = getKeyFromList(
        status.environment.replace('*', ''),
        catalogEnvironments
      ) //Need to figure out where *'s are coming from
      const deployment = ghDeployments.filter(
        (d) => d.node_id == status.deployment_node_id
      )[0]

      const statusKey = `${env}-${deployment.payload?.instance}`

      if (apiEnvStates[env] == undefined) {
        apiEnvironments.push(env)
        apiEnvStates[env] = {}
      }
      if (apiEnvStates[env][statusKey] == undefined) {
        const addEnvState = {
          environment: env,
          instance: deployment.payload?.instance,
          ref: status.ref,
          status: status.state,
          created_at: status.created_at,
          createdHuman: status.createdHuman,
        }
        apiEnvStates[env][statusKey] = addEnvState
        apiAllEnvStates.push(addEnvState)
      }

      apiDeployments.push({
        ...deployment,
        state: status.state,
      } as EnvDeployment)
    }
    const results = {
      environments: catalogEnvironments || apiEnvironments,
      deployments: apiDeployments,
      statuses: apiStatuses,
      states: apiEnvStates,
    }

    return results
  })

  if (error) {
    return <ResponseErrorPanel error={error} />
  }

  const noDeployments = value?.deployments.length == 0

  return (
    <Grid container spacing={3} alignItems="stretch">
      <Grid item sm={12} md={12} lg={12}>
        <CurrentEnvironmentDeployments
          loading={loading}
          environments={value?.environments || []}
          currentEnvStates={value?.states || undefined}
          setDisplayEnvironment={setDisplayEnvironment}
          reloadDashboard={reload}
        />
      </Grid>
      <Grid item sm={12} md={12} lg={12}>
        <EnvironmentDeployments
          environment={noDeployments ? 'Any' : displayEnvironment}
          projectSlug={projectSlug}
          loading={loading}
          currentDeployments={
            value?.deployments.filter(
              (d) =>
                d.environment.toLowerCase() == displayEnvironment.toLowerCase()
            ) || []
          }
        />
      </Grid>
    </Grid>
  )
}
