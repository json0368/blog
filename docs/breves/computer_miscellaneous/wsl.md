---
title: "WSL 迁移方法"
tags:
  - 计算机杂项
  - wsl
---

# WSL 迁移方法

最近 C 盘爆了QwQ，于是决定把 wsl 迁移到 E 盘，记录一下过程。

1.准备工作
打开 CMD ，输入 `wsl -l -v` 查看 wsl 虚拟机的名称与状态。
我的是 Ubuntu-22.04，状态是 running 。
输入 `wsl --shutdown` 使其停止运行，再次使用 `wsl -l -v` 确保其处于 stopped 状态。

2.导出/恢复备份
在 D 盘创建一个目录用来存放新的 wsl，比如我创建了一个 E:\WSL\Ubuntu22.04。

①导出它的备份（比如命名为 Ubuntu.tar）

```
wsl --export Ubuntu-22.04 E:\WSL\Ubuntu22.04\Ubuntu.tar
```

②确定在此目录下可以看见备份 Ubuntu.tar 文件之后，注销原有的 wsl

```
wsl --unregister Ubuntu-22.04
```

③将备份文件恢复到E:\WSL\Ubuntu22.04中去

```
wsl --import Ubuntu-22.04 E:\WSL\Ubuntu22.04 E:\WSL\Ubuntu22.04\Ubuntu.tar
```

这时候启动 wsl，发现好像已经恢复正常了，但是用户变成了 root ，之前使用过的文件也看不见了。

3.恢复默认用户
在 CMD 中，输入一下命令

```
C:\Users\asus\AppData\Local\Microsoft\WindowsApps\ubuntu.exe config --default-user obsidian
```

这时候再次打开 wsl，就会发现 c 盘已经猛烈释放了。
