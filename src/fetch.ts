import * as core from '@actions/core'
import type {Repository, User} from '@octokit/webhooks-types'

export interface Contributor {
  author: User
  total: number
  weeks: {w: number; a: number; d: number; c: number}[]
}

export interface RepoWithContributors extends Repository {
  contributors: Contributor[]
  commitsCount: number
}

export interface OrganisationUser extends User {
  commitsCount: number
}

export interface ReposWithContributors {
  contributors: OrganisationUser[]
  repos: RepoWithContributors[]
  commitsCount: number
}

const fetcher = (
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  octokit: any
): {
  fetchOrgContributors: (org: string) => Promise<ReposWithContributors>
} => {
  const errorHandler = (err: Error): void => {
    core.error(err)
    core.setFailed(err.message)
    process.exit(1)
  }

  const fetchOrgRepos = async (org: string): Promise<Repository[]> => {
    core.debug(`Fetch repositories for organisation ${org}`)

    // Fetch organisation repositories
    let page = 1
    const repos: Repository[] = []
    while (page > 0) {
      try {
        const reposResponse = await octokit.rest.repos.listForOrg({
          org,
          page
        })
        if (!reposResponse.data.length) {
          page = 0
        } else {
          repos.push(...(reposResponse.data as Repository[]))
          page++
        }
      } catch (err) {
        errorHandler(err as Error)
      }
    }
    return repos
  }

  const fetchOrgContributors = async (
    org: string
  ): Promise<ReposWithContributors> => {
    core.debug(`Fetch contributors for organisation ${org}`)

    const contributors: {[key: string]: OrganisationUser} = {}

    const repos = await fetchOrgRepos(org)

    let commitsCount = 0

    const reposWithContributors = await Promise.all(
      repos.map(async item => {
        try {
          core.debug(`Fetch contributors for repository ${item.name}`)

          // Get repository stats
          const contributorsResponse =
            await octokit.rest.repos.getContributorsStats({
              owner: item.owner.login,
              repo: item.name
            })

          let repoCommitsCount = 0
          // For each contributor, fetch name
          const repoContributors =
            contributorsResponse.data.length > 0
              ? (contributorsResponse.data as Contributor[])
              : []
          core.debug(
            `Found ${repoContributors.length} contributors for repository ${item.name}`
          )

          for (let i = 0; i < repoContributors.length; i++) {
            const contributor = repoContributors[i]
            core.debug(
              `Handling contributor ${contributor.author.login} for repository ${item.name}`
            )

            commitsCount += contributor.total
            repoCommitsCount += contributor.total
            if (contributors[contributor.author.login]) {
              contributors[contributor.author.login].commitsCount +=
                contributor.total
              continue
            }

            core.debug(`Fetch user ${contributor.author.login}`)

            const usersResponse = await octokit.rest.users.getByUsername({
              username: contributor.author.login
            })
            const updatedContributor = {
              ...contributor,
              author: {
                ...contributor.author,
                ...usersResponse.data
              }
            } as Contributor
            contributors[contributor.author.login] = {
              ...updatedContributor.author,
              commitsCount: contributor.total
            }
            repoContributors[i] = updatedContributor
            return {
              ...item,
              contributors: contributorsResponse.data,
              commitsCount: repoCommitsCount
            }
          }
          return {
            ...item,
            // Sort repository contributors by commit count
            contributors: repoContributors.sort((a, b) =>
              a.total > b.total ? -1 : 1
            )
          }
        } catch (err) {
          errorHandler(err as Error)
        }
      })
    )
    return {
      // Sort organisation contributors by commit count
      contributors: Object.keys(contributors)
        .map(key => contributors[key])
        .sort((a, b) => (a.commitsCount > b.commitsCount ? -1 : 1)),
      repos: reposWithContributors as RepoWithContributors[],
      commitsCount
    }
  }

  return {
    fetchOrgContributors
  }
}

export default fetcher
