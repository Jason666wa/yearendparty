# Docker 部署指南

## 网络问题解决方案

如果遇到无法从 Docker Hub 拉取镜像的问题，需要配置 Docker 镜像加速器。

### Windows Docker Desktop 配置清华大学镜像加速器

1. 打开 Docker Desktop
2. 点击右上角设置图标（齿轮）
3. 进入 **Docker Engine** 设置
4. 在 JSON 配置中添加以下内容（使用清华大学镜像源）：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.tuna.tsinghua.edu.cn"
  ]
}
```

5. 点击 **Apply & Restart** 重启 Docker

**注意**：配置镜像加速器后，所有 Docker 镜像拉取都会通过清华镜像源，包括 `node:20-alpine` 和 `mysql:8.0`。

### 验证镜像加速器配置

配置完成后，可以通过以下命令验证：

```powershell
docker info
```

在输出中查找 `Registry Mirrors`，应该能看到 `https://docker.mirrors.tuna.tsinghua.edu.cn`。

### 运行应用

配置完成后，运行：

```powershell
docker compose up -d --build
```

### 环境变量配置（可选）

创建 `.env` 文件：

```env
API_KEY=your_gemini_api_key_here
DB_PASSWORD=your_secure_password
DB_USER=appuser
```

如果不创建 `.env` 文件，将使用默认值（API_KEY 为空，Gemini 功能不可用）。
