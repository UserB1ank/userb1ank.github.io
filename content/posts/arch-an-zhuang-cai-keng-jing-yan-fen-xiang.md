---
title: "Arch安装踩坑经验分享"
category: "Linux"
date: 2023-07-05
---

## 简介

今天在虚拟机的kali上装工具的时候，被python环境干破防了。有个工具要求的某某库版本比另外一个工具低，两头难啊，而我又没弄conda，死来想去一不做二不休，直接在移动固态上装个arch，从零开始学习linux使用，然后下面是碰到的几个棘手的问题。

## 烧录/非烧录

烧录安装直接用balenaEtcher，非烧录推荐用ventoy。

## 移动固态既用作启动盘，又用作系统安装盘

看网上的文章据说是可行，我反正是没试成功，试过的方法有以下：

1. 利用vmware直接往物理存储器上安装系统

    失败原因：vmware报错，说是cpu被禁用。然后我就按网上的说法开启了vt，以及vmware中的虚拟化选项，结果`虚拟CPU计数器`这个功能无法启用，翻了下我cpu(i7 11800H)的功能表，好像不支持这玩意儿。于是作罢
2. rufus设置持久分区

    失败原因：不知道怎么用，网上的教程也不是特别详细。
3. ventoy直接在当前盘上安装

    失败原因：猜测是分区时破坏了系统文件，导致安装失败。也许可以尝试一下设置部分分区为空闲分区(free space)，然后对空闲分区进行分区，原分区不动。

    但是这时候就有两个EFI分区了，我对EFI等硬盘机制不甚了解，遂作罢。

## 驱动牛皮癣

N卡装错驱动，但是装了新驱动后，内核加载的还是nouveau。

利用lsmod可以看到内核加载的模块是`nvidia`相关的还是`nouveau`，我把`xf86-video-nouveau`卸载了依然还是载入的这个模块。经过网上的一阵搜寻，这个老哥的[论坛提问](https://askubuntu.com/questions/841876/how-to-disable-nouveau-kernel-driver)下发的评论解决了我的问题

![image-20230705224926916](/assets/images/network-asset-image-20230705224926916-20251017165314-d9z2z4p.png)

依照网上的教程，创建文件`/etc/modprobe.d/blacklist-nouveau.conf`，内容如下：

```
blacklist nouveau
options nouveau modeset=0
```

执行如下命令，关于mkinitcpio命令的具体作用看[官方文档](https://wiki.archlinuxcn.org/wiki/Mkinitcpio)

```shell
ls /etc/mkinitcpio.d/
linux.preset
mkinitcpio -p linux
reboot
```

后记：

![image-20230705231226452](/assets/images/network-asset-image-20230705231226452-20251017165314-tvqunr3.png)

官方文档里面也有解决方案。

## chroot前忘记装webtool

可以自行配置`systemd-networkd`的配置文件，看这个[文档](https://wiki.archlinuxcn.org/wiki/Systemd-networkd)

## DNS解析错误

启用`systemd-resolved`服务。如果当前网络为static，要设置DNS服务器，如果为`DHCP`那么直接用就行。

## 表情包(emoji)不显示

安装表情字体文件，并配置

```shell
sudo pacman -S noto-fonts-emoji
```

```shell
cd /etc/fonts
vim local.conf #不要修改font.conf。如果local.conf不存在，则创建
```

输入以下内容

```xml
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
 <alias>
   <family>sans-serif</family>
   <prefer>
     <family>Noto Sans</family>
     <family>Noto Color Emoji</family>
     <family>Noto Emoji</family>
     <family>DejaVu Sans</family>
   </prefer> 
 </alias>
 
 <alias>
   <family>serif</family>
   <prefer>
     <family>Noto Serif</family>
     <family>Noto Color Emoji</family>
     <family>Noto Emoji</family>
     <family>DejaVu Serif</family>
   </prefer>
 </alias>
 
 <alias>
  <family>monospace</family>
  <prefer>
    <family>Noto Mono</family>
    <family>Noto Color Emoji</family>
    <family>Noto Emoji</family>
    <family>DejaVu Sans Mono</family>
   </prefer>
 </alias>
</fontconfig>
```

```shell
fc-cache
```

之后部分软件重启后就会正常读取emoji字体。

## GNOME和xfce4使用下来的体验

GNOME一开始已经配置好了很多基础插件，如网络管理器等，但是桌面布局方面需要我们不断安装插件去调整，有点麻烦，但是由于社区非常庞大，会发现自己出现的问题基本上前人都碰到过了。同时也有很多现成的配置方案。

xfce4虽然一开始桌面布局方面就非常方便使用，但是很多基础组件都没有，需要我们自己去按照，网上的文档以英文居多，不是特别方便学习自定义配置。

## 中文字体不显示或者功能不全

去搞一份**微软雅黑**，包治百病。

去C盘的Windows下的Fonts文件夹中，把`msyh.ttc` `msyhl.ttc` `msyhbd.ttc`全部copy到`/usr/share/fonts`下，然后输入命令`fc-cache -vf`
