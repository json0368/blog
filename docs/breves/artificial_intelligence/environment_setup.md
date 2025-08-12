---
title: "深度学习环境配置"
tags:
  - 环境配置
  - 人工智能
---

# 深度学习环境配置

最近在服务器上多次配置 conda 环境，但是有些踩过的坑总是忘记，于是想在这里记录一下，方便下次参考

## conda 环境创建

1. 创建 conda 环境，通过以下命令即可创建一个名为 py310 且 python 版本为 3.10 的 conda 环境

```
conda create -n py310 python=3.10
```

2. 输入以下指令即可激活虚拟环境

```
conda activate py310
```

3. 也可以通过克隆已有的 conda 环境来创建新环境

```
conda create -n newpy310 --clone py310
```

4. 通过下面的命令即可卸载多余的 conda 环境

```
conda remove -n newpy310 --all
```

## 镜像源更换

由于国内网络原因，使用默认源下载速度较慢，可以考虑更换为清华源或中科大源等

### conda换源

1. 可以通过以下命令查看当前的 conda 配置

```
conda config --show
```

2. 此处以清华源为例，通过下面几条命令即可永久设置为清华源

```
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/pytorch/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/pytorch/linux-64/
conda config --set show_channel_urls yes
```

### pip换源

1. 可以通过以下命令临时更换 pip 源

```
pip install package_name -i https://pypi.tuna.tsinghua.edu.cn/simple
```

2. 要永久更换 pip 源，可以修改 pip 配置文件

```
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

## 其他下载加速方法

### mamba

mamba 是一个快速的 conda 包管理器，可以显著提高安装速度。

1. 可以通过以下命令安装 mamba

```
conda install mamba -n base -c conda-forge
```

2. 安装完成后，可以使用 mamba 替代 conda 进行包管理，在使用 conda 时，可以将其替换为 mamba

```
mamba install package_name
```

### aria2

aria2 是一个轻量级的下载工具，支持多种协议，可以用来加速下载。

1. 可以通过以下命令安装 aria2

```
conda install aria2 -n base -c conda-forge
```

2. 安装完成后，可以使用 aria2c 命令进行下载

```
aria2c -x 16 -s 16 -k 1M https://example.com/file.zip
// -x 16: 使用 16 个连接下载
// -s 16: 将文件分成 16 个部分下载
// -k 1M: 每个部分的大小为 1M
```

## cuda 版本更换

1. 可以通过以下命令查看当前 conda 环境的 cuda 版本

```
nvcc --V
```

2. 在更换之前，我们要先确定选择一个 cuda 版本安装，不要超过最高支持的 cuda 版本，可以通过以下命令查看

```
nvidia-smi
```

3. 如果需要更换 cuda 版本，可以通过以下命令安装指定版本的 cuda，以 cuda 12.1 为例

```
conda install nvidia/label/cuda-12.1.1::cuda --channel nvidia/label/cuda-12.1.1
```

4. 在安装完成 cuda 之后，根据安装的 cuda 版本，选择合适的 cudnn 安装

- 查找 cudnn：

```
conda search cudnn --info
```

- 此处安装的 cudnn 要与前面装的 cuda 版本匹配，前面安装的是 cuda 12.1这里，找一个支持 12.1 的 cudnn 安装

```
conda install cudnn=8.9.2.26=cuda12_0
```

5. 安装完成后，可以再次运行 `nvcc --V` 命令验证 cuda 和 cudnn 是否安装成功

## pytorch安装

1. pytorch 的安装可以通过以下命令进行，注意根据自己的系统和 cuda 版本选择合适的版本，具体的版本选择可以看[这里](https://pytorch.org/get-started/previous-versions/#linux-and-windows)

```
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

2. 此处也可以更换上交源加速下载

```
pip install pytorch==2.1.0+cu121 torchvision==0.16.0+cu121 torchaudio==2.1.0+cu121 -f https://mirror.sjtu.edu.cn/pytorch-wheels/torch_stable.html
```

3. 注意，有些 torch 即使没有 cu 后缀，也可能是 gpu 版本的，具体能否使用，可以运行以下命令确认。若输出为 True，则表示可以使用 gpu

```
python -c "import torch; print(torch.cuda.is_available())"
```

## 其他包安装

因为有些包装起来特别麻烦，所以在此处记录一下QwQ

### flash-attention

flash-attention 这个包编译起来比较复杂，而且特别慢，所以我们采用预编译的 wheel 包来安装。

1. 预编译的包可以在[这里](https://github.com/Dao-AILab/flash-attention/releases)下载，注意要和自己的 python、cuda、torch 版本匹配。 此外，还要确定 PyTorch 使用的是哪种 C++ ABI，各种查询命令如下

```
// python
python --version

// cuda
nvcc -V

// pytorch
python -c "import torch; print(torch.__version__)"

// abi
python -c "import torch; print(torch._C._GLIBCXX_USE_CXX11_ABI)"
```

2. 选择好相应的包，然后可以用 wget 来下载，或者使用 aria2 加速下载

```
// wget
wget -c https://github.com/Dao-AILab/flash-attention/releases/download/v2.7.3/flash_attn-2.7.3+cu12torch2.1cxx11abiFALSE-cp310-cp310-linux_x86_64.whl

// aria2
aria2c -x 16 -s 16 -k 1M https://github.com/Dao-AILab/flash-attention/releases/download/v2.7.3/flash_attn-2.7.3+cu12torch2.1cxx11abiFALSE-cp310-cp310-linux_x86_64.whl
```

3. 下载完成后，运行以下命令安装

```
pip install flash_attn-2.7.3+cu12torch2.1cxx11abiFALSE-cp310-cp310-linux_x86_64.whl
```

### apex

apex 直接 pip install 安装貌似有点问题，从 github 上 clone 下来编译安装也会报错，根据 [issue](https://github.com/NVIDIA/apex/issues/1594) 运行以下命令来安装

```
wget https://github.com/NVIDIA/apex/archive/refs/tags/23.05.zip
unzip 23.05.zip
cd apex-23.05/
pip install -v --disable-pip-version-check --no-cache-dir --no-build-isolation --config-settings "--build-option=--cpp_ext" --config-settings "--build-option=--cuda_ext" ./
```
