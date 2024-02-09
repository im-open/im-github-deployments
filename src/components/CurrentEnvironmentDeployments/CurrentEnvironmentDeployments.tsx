import React, { useState, useEffect } from 'react'
import { CurrentEnvStates } from '../../api/types'
import { Button, Grid, GridSize } from '@material-ui/core'
import { InfoCard } from '@backstage/core-components'
import SyncIcon from '@material-ui/icons/Sync'

/** @public */
export const CurrentEnvironmentDeployments = (props: {
  loading: boolean
  environments: string[] | []
  currentEnvStates: CurrentEnvStates | undefined
  setDisplayEnvironment: (env: string) => void
  reloadDashboard: () => void
}) => {
  const { setDisplayEnvironment, reloadDashboard } = props
  const [environments, setEnvironments] = useState<string[]>([])
  const [environment, setEnvironment] = useState('DEV')
  const [envStates, setEnvStates] = useState<CurrentEnvStates | undefined>(
    undefined
  )

  useEffect(() => {
    if (!props.loading) {
      setEnvironments(props.environments)
      setEnvStates(props.currentEnvStates)
    }
  }, [props.loading, props.currentEnvStates])

  const setDisplay = (e: any) => {
    const env = e.target.innerText
    e.style = { height: '100px' }
    setDisplayEnvironment(env)
    setEnvironment(env)
  }

  const envInfo = (env: string) => {
    const envStatesKeys = Object.keys(envStates || {})
    const envStatesKeysContainsEnv = envStatesKeys.indexOf(env) !== -1

    const display =
      props.loading || envStates == undefined ? (
        <>Loading...</>
      ) : envStatesKeys.length == 0 || !envStatesKeysContainsEnv ? (
        <>No Current Deployments</>
      ) : (
        <>
          {Object.keys(envStates[env])
            .map(
              (key) =>
                `${envStates[env][key].instance}: ${envStates[env][key].ref} - ${envStates[env][key].status} (${envStates[env][key].createdHuman})`
            )
            .sort((a, b) => (a < b ? -1 : 1))
            .map((deployment) => (
              <>
                {deployment}
                <br />
              </>
            ))}
        </>
      )

    return display
  }

  const { envColWidth, envLastColWidth, lastEnv } = (() => {
    let bootstrapCols = 12
    let colWidth = Math.floor(bootstrapCols / environments.length)
    let lastColWidth = bootstrapCols - colWidth * (environments.length - 1)
    if (lastColWidth == 0) {
      lastColWidth = colWidth
    }

    return {
      envColWidth: colWidth as GridSize,
      envLastColWidth: lastColWidth as GridSize,
      lastEnv: environments[environments.length - 1],
    }
  })()

  const envDisplay = (env: string) => {
    const displayColWidth: GridSize =
      env === lastEnv ? envLastColWidth : envColWidth
    return (
      <Grid item xs={12} sm={12} md={displayColWidth} lg={displayColWidth}>
        <Button
          onClick={setDisplay}
          variant={environment == env ? 'contained' : 'outlined'}
          size="medium"
          disabled={environments.indexOf(env) === -1}
        >
          {env}
        </Button>
        <br />
        <br />
        <div>{envInfo(env)}</div>
      </Grid>
    )
  }

  const buildEnvDisplays = () => {
    if (props.loading) {
      return (
        <Grid item sm={12} md={12} lg={12}>
          <h1>Loading Deployment Data...</h1>
        </Grid>
      )
    } else {
      if (environments.length === 0) {
        return (
          <Grid item sm={12} md={12} lg={12}>
            <h1>No Deployments Found</h1>
          </Grid>
        )
      } else {
        return environments.map((env) => envDisplay(env))
      }
    }
  }

  const deploymentDisplay = (
    <InfoCard
      title="Current Environments"
      action={
        <Button
          onClick={() => reloadDashboard()}
          variant="outlined"
          size="small"
        >
          <SyncIcon />
        </Button>
      }
    >
      <Grid item sm={12} md={12} lg={12}>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item sm={12} md={12} lg={12}>
            <Grid container spacing={3} alignItems="stretch">
              {buildEnvDisplays()}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </InfoCard>
  )

  return deploymentDisplay
}
