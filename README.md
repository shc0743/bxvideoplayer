# bxvideoplayer

简易bilibili(哔哩哔哩)视频播放器

**注意**: 本程序功能均使用公开API实现，不涉及破解版权内容等功能，用户播放、下载任何内容与本项目无关，请注意资源的版权。

## 特色
- 没有烦人的登录弹框
- 不加载乱七八糟的跟踪脚本
- 支持直接跳到主站 (electron特色（

## TODO

[x] 播放bilibil视频

[x] 登录功能

[x] 查看视频简介

[x] 自动连播

[x] 键盘访问 (大部分功能)

[ ] 命令行自动播放 (目前只能自动解析，TODO是指定分P即可自动播放，例如：bxvideoplayer av833240056 -p1 )

[ ] 切换清晰度 (因为未知原因，目前只能拿到360P视频(无语...在浏览器里面可以拿到720P，换成electron就只能360P))

[ ] 下载功能

[ ] 弹幕功能 (近期不准备实现)

## Framework
Electron + Node.js

## 命令行调用
基本用法：bxvideoplayer.exe av或bv号

示例：
```
bxvideoplayer.exe av833240056        # 解析av号
bxvideoplayer.exe BV1bW411n7fY       # 解析bv号
```

## License
GPL-3.0.
 



