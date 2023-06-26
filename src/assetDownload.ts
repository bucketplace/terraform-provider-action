import fs from "fs";
import fetch from "node-fetch";

interface RespData {
  tag_name: string
  assets: Asset[]
}
interface Asset {
  id: number
  name: string
  browser_download_url: string
}

interface GetAssetDownloadUrlsResponse {
  repoName: string
  assets: Asset[]
}

export async function getLatestRelease(
  githubRepo: string,
  authToken: string
): Promise<RespData> {
  const url = `https://api.github.com/repos/${githubRepo}/releases/latest`
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${authToken}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch latest release for ${githubRepo}`)
  }

  const resp = (await response.json()) as RespData

  return resp
}

export async function getAssetDownloadUrls(
    latestRelease: RespData,
    tag: string,
    githubRepo: string,
    authToken: string,
    osArchPairs: string[]
): Promise<GetAssetDownloadUrlsResponse> {
  const repoName = githubRepo.split('/')[1]
  const desiredFileNames = osArchPairs.flatMap(osArch => [
    `${repoName}_${tag}_${osArch}.zip`,
    `${repoName}_${tag}_SHA256SUMS`,
    `${repoName}_${tag}_SHA256SUMS.sig`
  ])

  const assets = latestRelease.assets
    .filter(asset => desiredFileNames.includes(asset.name))
    .map(asset => ({
      id: asset.id,
      name: asset.name,
      browser_download_url: asset.browser_download_url
    }))

  console.log(
      'Asset IDs:',
      assets.map(asset => asset.name)
    )

  return {repoName, assets}
}

export async function downloadAssets(
  githubRepo: string,
  assets: Asset[],
  outputDir: string,
  authToken: string
) {
  for (const asset of assets) {
    console.log(`Downloading asset: ${asset.browser_download_url}`)
    await downloadAsset(githubRepo, asset, outputDir, authToken)
  }
}

async function downloadAsset(
  githubRepo: string,
  asset: Asset,
  outputDir: string,
  authToken: string
) {
  const url = `https://api.github.com/repos/${githubRepo}/releases/assets/${asset.id}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/octet-stream',
      Authorization: `token ${authToken}`
    }
  })

  if (!response.body) {
    throw new Error('Error: The response body is null.')
  }

  const file = fs.createWriteStream(`${outputDir}/${asset.name}`)
  if (response.status === 200) {
    response.body.pipe(file)

    file.on('finish', () => {
      file.close()
    })

    file.on('error', (err: Error) => {
      fs.unlinkSync(`${outputDir}/${asset.name}`)
      throw err.message
    })
  } else if (response.status === 404) {
    throw new Error(`File not found: asset ${asset.id}`)
  } else {
    throw new Error(
      `Unexpected response for downloading file: ${response.status}`
    )
  }
}