import * as core from "@actions/core";
import {createRegistryProviderVersion, uploadSHA256Files} from "./createRegistryProviderVersion";
import {getAssetDownloadUrls, getLatestRelease} from "./assetDownload";
import {downloadAssets} from "./assetDownload";
import {getShasum, uploadBinaryFiles, uploadBinary} from "./uploadBinaryFiles";


async function run() {
  try {
    const githubRepo = core.getInput('github-repo', {required: true})
    const authToken = core.getInput('auth-token', {required: true})
    const outputDir = core.getInput('output-dir', {required: true})
    const tfToken = core.getInput('tf-token', {required: true})
    const gpgKey = core.getInput('gpg-key', {required: true})
    const tfUrl = core.getInput('tf-url', {required: true})
    const provider = core.getInput('provider', {required: true})
    const osArchPairs = core
      .getInput('osArch', {required: true})
      .split(',')
      .map(pair => pair.trim())


    const latestRelease = await getLatestRelease(githubRepo, authToken)
    const tag = latestRelease.tag_name.split('v')[1]

    const {shasumsUpload, shasumsSigUpload} =
      await createRegistryProviderVersion(tfToken, tag, gpgKey, tfUrl, provider)
    console.log('Registry provider created successfully')

    const result = await getAssetDownloadUrls(latestRelease, tag, githubRepo, authToken, osArchPairs)
    const {repoName, assets} = result
    await downloadAssets(githubRepo, assets, outputDir, authToken)
    console.log('Assets downloaded successfully')

    await uploadSHA256Files(shasumsUpload, shasumsSigUpload, outputDir, repoName, tag)
    console.log('Uploaded SHA256Files successfully')

    for (const osArch of osArchPairs) {
      const {shasum, fileName} = await getShasum(
        outputDir,
        repoName,
        tag,
        osArch
      )
      const providerBinaryUploadLink = await uploadBinaryFiles(
        tfToken,
        tfUrl,
        provider,
        tag,
        osArch,
        shasum,
        fileName
      )
      await uploadBinary(outputDir, fileName, providerBinaryUploadLink)
      console.log(`Uploaded ${fileName} successfully`)
    }

  } catch (error: unknown) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred.')
    }
  }
}

run()
