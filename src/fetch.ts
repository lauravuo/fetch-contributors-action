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

  const fillUserData = async (
    input: Contributor[],
    allUsers: {[key: string]: OrganisationUser}
  ): Promise<{
    repoContributors: Contributor[]
    repoTotal: number
    allUsers: {[key: string]: OrganisationUser}
  }> => {
    let contributorsTotal = 0
    const output: Contributor[] = []
    for (const contributor of input) {
      core.debug(`Filling contributor ${contributor.author.login} data`)
      contributorsTotal += contributor.total
      if (allUsers[contributor.author.login]) {
        core.debug(`Contributor ${contributor.author.login} already added`)
        allUsers[contributor.author.login].commitsCount += contributor.total
        output.push({
          ...contributor,
          author: allUsers[contributor.author.login]
        })
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
      allUsers[contributor.author.login] = {
        ...updatedContributor.author,
        commitsCount: contributor.total
      }
      output.push(updatedContributor)
    }
    return {
      repoContributors: output.sort((a, b) => (a.total > b.total ? -1 : 1)),
      repoTotal: contributorsTotal,
      allUsers
    }
  }

  const fetchOrgContributors = async (
    org: string
  ): Promise<ReposWithContributors> => {
    core.debug(`Fetch contributors for organisation ${org}`)

    const contributors: {[key: string]: OrganisationUser} = {}

    const repos = await fetchOrgRepos(org)

    let commitsCount = 0

    const reposWithContributors: RepoWithContributors[] = []
    for (const item of repos) {
      try {
        core.debug(`Fetch contributors for repository ${item.name}`)

        // Get repository stats
        const contributorsResponse =
          await octokit.rest.repos.getContributorsStats({
            owner: item.owner.login,
            repo: item.name
          })

        // For each contributor, fetch name
        const repoContributors =
          contributorsResponse.data.length > 0
            ? (contributorsResponse.data as Contributor[])
            : []
        core.debug(
          `Found ${repoContributors.length} contributors for repository ${item.name}`
        )

        const repoData = await fillUserData(repoContributors, contributors)
        commitsCount += repoData.repoTotal
        reposWithContributors.push({
          ...item,
          // Sort repository contributors by commit count
          contributors: repoData.repoContributors,
          commitsCount: repoData.repoTotal
        })
      } catch (err) {
        errorHandler(err as Error)
      }
    }

    return {
      // Sort organisation contributors by commit count
      contributors: Object.keys(contributors)
        .map(key => contributors[key])
        .sort((a, b) => (a.commitsCount > b.commitsCount ? -1 : 1)),
      repos: reposWithContributors.sort((a, b) =>
        a.commitsCount > b.commitsCount ? -1 : 1
      ),
      commitsCount
    }
  }

  return {
    fetchOrgContributors
  }
}

export default fetcher
