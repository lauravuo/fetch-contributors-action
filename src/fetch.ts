import core from '@actions/core'
import github from '@actions/github'
import { Repository, User } from '@octokit/webhooks-types'

export interface Contributor {
  author: User,
  total: number,
  weeks: { w: number, a: number, d: number, c: number }[]
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
  repos: RepoWithContributors[],
  commitsCount: number
}

export default (octokit: any) => {
  //const octokit = github.getOctokit(authToken);
  const errorHandler = (err: Error) => {
    core.error(err);
    process.exit(1);
  }

  const fetchOrgRepos = async (org: string): Promise<Repository[]> => {
    // Fetch organisation repositories
    let page = 1
    const repos: Repository[] = []
    while (page > 0) {
      const reposResponse = await octokit.rest.repos.listForOrg({
        org,
        page
      }).catch(errorHandler);
      if (!reposResponse.data.length) {
        page = 0
      } else {
        repos.push(...reposResponse.data as Repository[])
        page++
      }
    }
    return repos
  }

  const fetchOrgContributors = async (org: string): Promise<ReposWithContributors> => {
    const contributors: { [key: string]: OrganisationUser } = {};

    const repos = await fetchOrgRepos(org)

    let commitsCount = 0

    const reposWithContributors = await Promise.all(repos.map(async (item) => {
      // Get repository stats
      const contributorsResponse = await octokit.rest.repos.getContributorsStats({
        owner: item.owner.login,
        repo: item.name,
      }).catch(errorHandler);

      let repoCommitsCount = 0
      // For each contributor, fetch name 
      const repoContributors = contributorsResponse.data as Contributor[]
      for (let i = 0; i < repoContributors.length; i++) {
        const contributor = repoContributors[i];
        commitsCount += contributor.total
        repoCommitsCount += contributor.total
        if (contributors[contributor.author.login]) {
          contributors[contributor.author.login].commitsCount += contributor.total
          continue
        }
        const usersResponse = await octokit.rest.users.getByUsername({
          username: contributor.author.login
        }).catch(errorHandler);
        const updatedContributor = {
          ...contributor, author: {
            ...contributor.author,
            ...usersResponse.data
          }
        } as Contributor
        contributors[contributor.author.login] = { ...updatedContributor.author, commitsCount: contributor.total }
        repoContributors[i] = updatedContributor
        return { ...item, contributors: contributorsResponse.data, commitsCount: repoCommitsCount }
      }
      return {
        ...item,
        // Sort repository contributors by commit count
        contributors: repoContributors.sort((a, b) => a.total > b.total ? -1 : 1),
      }
    }))
    return {
      // Sort organisation contributors by commit count
      contributors: Object.keys(contributors)
        .map(key => contributors[key])
        .sort((a, b) => a.commitsCount > b.commitsCount ? -1 : 1),
      repos: reposWithContributors as RepoWithContributors[],
      commitsCount
    }
  }

  return {
    fetchOrgContributors,
  }
} 