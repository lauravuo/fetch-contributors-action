<p align="center">
  <a href="https://github.com/lauravuo/fetch-contributors-action/actions"><img alt="typescript-action status" src="https://github.com/lauravuo/fetch-contributors-action/workflows/build-test/badge.svg"></a>
</p>

# Fetch Organisation Contributors action

This action fetches the contributors for each repository of the GitHub organisation.
It creates a markdown file and stores it to the repository.

See [example](https://github.com/kaupunginnaiset/.github/blob/main/contributors.md) of the result file.

## Inputs

### `token`

**Required** GitHub API token

### `organisation`

The GitHub organisation name. Default is the repository owner.

### `commitTarget`

Whether to commit the result file to the repository. Default is `true`.

### `targetPath`

Result markdown file path. Default is `./contributors.md`.

## Example usage

```yaml
uses: lauravuo/fetch-contributors-action@v0.2
with:
  token: ${{ secrets.GITHUB_TOKEN }}
```

## Scheduling

You can schedule the action for example to run every night:

```yaml
name: 'update'
on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * *" # Runs at 00:00
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: lauravuo/fetch-contributors-action@v0.2
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Development

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
