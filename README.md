<p align="center">
  <a href="https://github.com/lauravuo/fetch-contributors-action/actions"><img alt="typescript-action status" src="https://github.com/lauravuo/fetch-contributors-action/workflows/build-test/badge.svg"></a>
</p>

## Code in Main

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Install the dependencies  

```bash
npm install
```

Build the typescript and package it for distribution

```bash
npm run build && npm run package
```

Run the tests :heavy_check_mark:  

```bash
npm test
```

## Change action.yml

The action.yml defines the inputs and output for your action.

Update the action.yml with your name, description, inputs and outputs for your action.

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)

## Change the Code

Most toolkit and CI/CD operations involve async operations so the action is run in an async function.

```javascript
import * as core from '@actions/core';
...

async function run() {
  try { 
      ...
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
```

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

## Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder.

Then run [ncc](https://github.com/zeit/ncc) and push the results:

```bash
npm run package
git add dist
git commit -a -m "prod dependencies"
git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validate

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/test.yml))

```yaml
uses: ./
with:
  milliseconds: 1000
```

See the [actions tab](https://github.com/lauravuo/fetch-contributors-action/actions) for runs of this action! :rocket:

## Usage

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action

# kaupunginnaiset

## All contributors

| avatar | username | name | count | % of all commits |
|--------|----------|------|---------|---|
| ![](https://avatars.githubusercontent.com/u/29113682?s=35&v=4) | [lauravuo](https://github.com/lauravuo) | Laura Vuorenoja | 83 | 74
| ![](https://avatars.githubusercontent.com/u/28345294?s=35&v=4) | [eevajonnapanula](https://github.com/eevajonnapanula) | Eevis Panula | 23 | 21
| ![](https://avatars.githubusercontent.com/u/26743924?s=35&v=4) | [magdapoppins](https://github.com/magdapoppins) | Magdalena Stenius | 6 | 5

## Repositories

### [kaupunginnaiset.github.io](https://github.com/kaupunginnaiset/kaupunginnaiset.github.io) ([39 commits](https://github.com/kaupunginnaiset/kaupunginnaiset.github.io/graphs/contributors))

    * [lauravuo](https://github.com/lauravuo) (100 %)

### [alman-akka](https://github.com/kaupunginnaiset/alman-akka) ([73 commits](https://github.com/kaupunginnaiset/alman-akka/graphs/contributors))

    * [eevajonnapanula](https://github.com/eevajonnapanula) (32 %)
    * [magdapoppins](https://github.com/magdapoppins) (8 %)

### [.github](https://github.com/kaupunginnaiset/.github) ([0 commits](https://github.com/kaupunginnaiset/.github/graphs/contributors))
