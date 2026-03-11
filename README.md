# pkuphysu-website

## requirements

### frontend
- node.js>=22.0.0
- npm>=10.0.0

### backend
- python>=3.12.0
- rust>=1.91.0
- poetry>=2.2.0
- psql>=15.0

### [disk](https://github.com/dfshfghj/OpenList)
- go>=1.25.0
- mingw64-gcc>=14.2.0

## develop

```bash
pnpm install
```
```bash
pnpm run dev
```

## 部署

后端使用release中编译好的 go 二进制文件，
前端使用release中打包的静态文件

nginx配置：使用支持broti的nginx

数据库配置：使用psql

外部存储：使用OpenList链接北大网盘，rclone挂载至data目录