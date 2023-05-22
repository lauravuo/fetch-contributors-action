import * as core from '@actions/core'
import { getOctokit } from '@actions/github'
import fs from 'fs'
import { exec } from 'child_process'

import fetcher from './fetch'

async function run(): Promise<void> {
  try {
    const authToken = core.getInput('token')
    if (!authToken) {
      throw new Error('Token is required')
    }

    if (!process.env.GITHUB_REPOSITORY) {
      throw new Error('Repository is required')
    }

    const [repoOwner] = process.env.GITHUB_REPOSITORY.split('/')
    core.debug(`Fetch contributors for organisation ${repoOwner}`)

    const octokit = getOctokit(authToken)
    const dataFetcher = fetcher(octokit)
    const data = await dataFetcher.fetchOrgContributors(repoOwner)

    const markdown = `

# ${repoOwner}
  
## All contributors

| avatar | username | name | count | % of all commits |
|--------|----------|------|---------|---|
${data.contributors
        .map(
          item =>
            `| ![](https://avatars.githubusercontent.com/u/${item.id}?s=35&v=4) | [${item.login
            }](https://github.com/${item.login}) | ${item.name} | ${item.commitsCount
            } | ${Math.round((item.commitsCount / data.commitsCount) * 100)}`
        )
        .join('\n')}

## Repositories

${data.repos
        .map(
          item =>
            `### [${item.name}](https://github.com/${repoOwner}/${item.name}) ([${item.commitsCount
            } commits](https://github.com/${repoOwner}/${item.name
            }/graphs/contributors))\n
${item.contributors
              .slice(0, 15)
              .map(
                user =>
                  `* [${user.author.login}](https://github.com/${user.author.login
                  }) (${Math.round((user.total / item.commitsCount) * 100)} %)`
              )
              .join('\n')}
`
        )
        .join('\n')}
`

    const targetPath: string = core.getInput('targetPath')
    fs.writeFileSync(targetPath, markdown)

    const commitFiles: boolean = core.getInput('commitTargetFiles') === 'true'
    if (commitFiles) {
      core.info('git commit')
      exec('git config --global user.email "contributor-bot"')
      exec('git config --global user.name "contributor-bot"')
      exec('git add .')
      exec('git commit -m "Update contributors"')
      exec('git push')
    }

    core.setOutput('output', targetPath)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
