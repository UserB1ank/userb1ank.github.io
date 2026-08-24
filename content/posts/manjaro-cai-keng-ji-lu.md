---
title: "Manjaro踩坑记录"
category: "Linux"
date: 2025-10-17
---

# 由安全启动引起的一系列问题

为了玩战地6，我必须开启Secure Boot,但是Manjaro默认的grub对于安全启动的设置非常非常麻烦，按照网上的建议，最好是用systemd-boot，但是我的linux和windows是装在两个不同的盘上的，由此又引发了许多问题。这里先在Bios将安全启动关掉，开启UEFI模式。

## 切换systemd-boot

这一步之前，首先确保自己的引导没有损坏，输入bootctl命令可以正常输出内容

![image](/assets/images/image-20251017165734-1rsoyst.png)

我一开始的引导损坏了，bootctl提示无法找到EFI分区，这会影响到后面的sbctl的操作。由于当时我系统刚装好，我就直接重新再装了一次，这次在设置efi分区时，勾选了`boot`选项，这一项一定要勾选。

接下来卸载grub

```shell
sudo pacman -Rc grub
```

然后先卸载efi分区，新建一个位置用来安装systemd-boot

```shell
sudo umount /boot/efi
sudo mkdir /efi
```

使用`findmnt`找到自己当前的efi分区的路径，比如`/dev/nvmexxx`

```shell
findmnt /boot/efi -no SOURCE
```

接着将这个分区挂载到`/efi`

```shell
sudo mount /dev/nvmexxxx /efi
```

最后使用`bootctl`安装systemd-boot

```shell
sudo bootctl install
```

安装后可以在ESP目录（当前因为挂载的原因，ESP目录为/efi）中找到配置文件和相关目录

```shell
/efi/loader/loader.conf #配置文件
/efi/loader/entries/*.conf	#引导配置文件
```

每个系统引导对应一个entries下的配置文件，loader.conf用来配置systemd-boot本身的行为。

之后利用kernel-install自动创建linux的entries。

```shell
pamac build kernel-install-mkinitcpio
```

运行脚本，从而建议内核和引导文件

```shell
#!/usr/bin/env bash

# Find the configured esp
esp=$(bootctl -p)

# Prepare the efi partition for kernel-install
machineid=$(cat /etc/machine-id)
if [[ ${machineid} ]]; then
    mkdir ${esp}/${machineid}
else
    echo "Failed to get the machine ID"
fi

# Run kernel install for all the installed kernels
while read -r kernel; do
    kernelversion=$(basename "${kernel%/vmlinuz}")
    echo "Installing kernel ${kernelversion}"
    kernel-install add ${kernelversion} ${kernel}
done < <(find /usr/lib/modules -maxdepth 2 -type f -name vmlinuz)
```

```shell
sudo ./x.sh
```

到这里重启后进入Bios，就会发现多了个启动设备叫作`Linux Boot Manager`，将其设置为第一启动项。

## 添加Windows引导

按照ArchWiki的说法，

![image](/assets/images/image-20251017171211-9u4inga.png)

systemd-boot本身不支持从别的硬盘启动，但是可以通过引导UEFI SHELL去引导其他系统启动。这里我们需要先安装edk2-shell，

```shell
sudo pacman -S edk2-shell
```

然后将`efi`文件复制到ESP目录。注意，这里由于我们重启过了，ESP目录重新挂载到默认的`/boot/efi`，我们需要将文件复制到这个目录中，而非wiki中所讲的`/boot`。

```shell
# cp /usr/share/edk2-shell/x64/Shell.efi /boot/efi/shellx64.efi
```

接着我们记录一下windows引导分区的partuuid号，之后会用到。

```shell
lsblk -f                                                                                                                    ✔ 
NAME        FSTYPE FSVER LABEL   UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
nvme0n1                                                                              
├─nvme0n1p1 vfat   FAT32         E026-xxxx                                           
├─nvme0n1p2                                                                          
├─nvme0n1p3 ntfs                 E62xxx                                  
```

```shell
sudo blkid |grep "E026-xxxx"                                                                                                ✔ 
/dev/nvme0n1p1: UUID="E026-xxxx" BLOCK_SIZE="512" TYPE="vfat" PARTLABEL="Basic data partition" PARTUUID="8b9ef34a-xxxxxx"
```

这时候我们重启机器，进入systemd-boot引导界面后会有一项`UEFI SHELL`，选择后回车，进入UEFI SHELL界面，输入map命令，会看到各个分区的fs别名，我们需要利用fs别名去确定引导文件的位置。这里可以用`page up` `page down`进行翻页，按照`partuuid`找到我们的fs别名，格式类似`hd01f`，`hd01b`这样。接着输入`exit`回到linux中，创建配置文件

```shell
vim /boot/efi/loader/entries/windows.conf
#内容
title   Windows
efi     /shellx64.efi
options -nointerrupt -nomap -noversion HD0b:EFI\Microsoft\Boot\Bootmgfw.efi
```

保存后再次开机，就可以看到windows选项，如果一切配置正常，就可以进入系统了。

## 配置安全启动

> 有些硬件如果把出厂自带的密钥删了，可能会导致无法开机，我这里的主板是 MSI B650M GAMING PLUS WIFI

这里我们配置用到的是`sbctl`，我们首先需要将主板的密钥配置界面，禁用出厂密钥，保存重启一次。然后再进bios,把所有密钥删除后重启进入linux。

此时输入`sbctl status`应当能够看到`setup mode`为enabled状态。

接下来添加密钥

```shell
sbctl create-keys

sbctl enroll-keys --microsoft
```

然后查看未签名的文件，将所有未签名的文件一个个签名

```shell
sbctl verify
sbctl sign -s /xxx/xxx/xxx
```

最后再`sbctl verify`验证一下是否签名了，最后重启进入bios，开启安全启动，就能正常进入系统了。这时候再查看状态

```shell
sbctl status                                                                                                               
Installed:      ✓ sbctl is installed
Owner GUID:     x-x-x-x
Setup Mode:     ✓ Disabled
Secure Boot:    ✓ Enabled
```

可以发现安全启动已经启用了。

# 参考文章

[安全启动archwiki](https://wiki.archlinuxcn.org/wiki/UEFI/%E5%AE%89%E5%85%A8%E5%90%AF%E5%8A%A8)

[manjaro切换systemd](https://forum.manjaro.org/t/how-to-convert-to-systemd-boot/128946)

[systemd-boot官方wiki,含有在另一块硬盘启动系统的教程](https://wiki.archlinuxcn.org/zh-sg/Systemd-boot)

[MSI禁用出厂密钥](https://www.reddit.com/r/MSI_Gaming/comments/1feeep4/how_to_enable_setup_mode_on_b650_motherboard/?rdt=38897)

[grub坑](https://anlor.top/post/secureboot-on-manjarolinux/)

[systemd-boot添加windows引导](https://linxy.dev/posts/systemd-boot-windows/)

[双硬盘双系统](https://forum.archlinuxcn.org/t/topic/13438/3)


