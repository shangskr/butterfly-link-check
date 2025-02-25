# Butterfly Link Checker

该项目用于自动检测 **Butterfly 主题** 友链的可访问性，并将检测结果生成 JSON 文件供 Vercel 部署。通过将生成的 JSON 链接放入 Butterfly 友链设置页面，可以实时拉取检测结果。

## 功能

- 自动检测友链的访问状态，无法访问的链接将被标记为不可用。
- 使用 **Python** 库和 **奶思猫 API** 进行检测，误差较小，但可以通过修改 `manual_check.json` 来手动调整检测结果。
- 新增Cloudflare Worker API 的 URL，用于检测链接的可用性。
- 支持通过网页界面修改配置，避免手动编辑 GitHub 文件。
- 检测结果生成的 JSON 文件可以通过 Vercel 部署，提供给 Butterfly 友链设置页面。
- 适配夜间模式，文本框支持拖拽放大缩小（双端都可）。
- 新加入搜索功能，便于在需要修改的文件中快速跳转到文字附近。

## 安装与部署

### 1. Fork 项目并设置 GitHub Actions Secrets

首先，Fork 该项目，并在 GitHub 中设置以下 Actions secrets 和 variables：

- **PAT_TOKEN**：GitHub 自建一个 Personal Access Token，授予相关权限，保存好该 token，稍后在 Vercel 中使用。
- **API_KEY**：在奶思猫站点获取的 API Key。

然后，check.py中的第17行的cf_worker_url可以换成自己的url(复制根目录cf-workers文件中的内容部署到cf-worker就可以)，不需要绑定域名，因为action是国外环境~也可以不用修改直接用我的！

### 2. 配置 Vercel 环境变量

将项目部署到 Vercel 后，设置以下环境变量：

- **NEXT_PUBLIC_COMMIT_PASSWORD**：前端访问密码（用于避免暴露项目链接）。
- **GITHUB_TOKEN**：等同于 `PAT_TOKEN`，权限相同即可。
- **GITHUB_REPO**：GitHub 仓库名称（例如 `shangskr/butterfly-link-check`）。
- **FILE_1_PATH**：`link.yml` 文件的路径（例如 `link.yml`）。
- **FILE_2_PATH**：`manual_check.json` 文件的路径（例如 `manual_check.json`）。

### 3. 部署完成

完成上述配置后，绑定你的域名，你就可以通过你的域名访问项目。生成的 JSON 文件可以通过 `https://yourdomain/check_links.json` 访问。

### 4. 配置 Butterfly 友链

将生成的 JSON 文件 URL 填入 **Butterfly 主题** 友链设置页面，并确保该页面支持 JSON 格式加载友链。这样你就可以在 Butterfly 上查看和管理友链的访问状态。

## 注意事项

- 由于检测是通过自动化脚本完成的，可能会存在误差。如果某个链接被误判为不可用，可以通过修改 `manual_check.json` 文件将其标记为正常。
- 每次修改 `link.yml` 或 `manual_check.json` 文件都需要 GitHub 登录操作，因此我们实现了网页操作，方便管理。
- 该action没有定时运行，而是设置了手动运行+文件变动时自动运行，您只要在前端提交或者修改就会自动运行action。
- 搜索功能不可以精准的跳转到文字上，但是可以跳转到需要搜索的文字附近位置。

## 尚未补充完整！

这只是简单的项目介绍和使用方法，等我有空的时候会补全更多细节。感谢使用，祝您顺利部署哦！

