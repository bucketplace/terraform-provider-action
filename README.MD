# Bucketplace/terraform-provider-action 사용 가이드

이 문서는 Bucketplace에서 제공하는 terraform provider를 GitHub Actions에서 사용하기 위한 가이드입니다.

### 사용 예시

다음은 `bucketplace/terraform-provider-action`을 사용하는 GitHub Actions YAML 파일에 대한 예시입니다:

```yaml
jobs:
  build_deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Check out code
      uses: actions/checkout@v2

    - name: Use private provider action
      uses: bucketplace/terraform-provider-action@v1
      with:
        github-repo: ${{ github.repository }}
        osArch: 'darwin_arm64'
        auth-token: ${{ secrets.GITHUB_TOKEN }}
        output-dir: 'download'
        tf-token: ${{ secrets.TF_TOKEN }}
        gpg-key: ${{ secrets.GPG_KEY }}
        tf-url: ${{ secrets.TF_URL }}
        provider: 'bucketplace'
```

### Parameters

- `github-repo`: GitHub 리포지토리 이름을 지정합니다.
- `osArch`: 빌드할 플랫폼 및 아키텍처를 지정합니다(`linux_amd64`, `darwin_arm64`, etc.).
- `auth-token`: GitHub API access token입니다.
- `output-dir`: 빌드된 바이너리를 저장할 디렉토리를 지정합니다.
- `tf-token`: Terraform Cloud API access token입니다.
- `gpg-key`: GPG key입니다.
- `tf-url`: 사용자 테라폼 클라우드 URL을 지정합니다.
- `provider`: 빌드할 테라폼 프로바이더 이름을 지정합니다.
