---
title: "huggingface模型下载"
tags:
  - 模型下载
  - 环境配置
  - 人工智能
---

# huggingface模型下载

这两天使用 huggingface-cli 从 huggingface 上下载模型出了点问题，模型权重下载时会卡住。下载时使用的脚本如下：

```
#!/bin/bash

export HF_ENDPOINT="https://hf-mirror.com"

HF_TOKEN="your_huggingface_token"
MODEL_NAME="openai/clip-vit-large-patch14-336"
MODEL_SHORT_NAME="${MODEL_NAME##*/}"

LOCAL_DIR="/home/huggingface/${MODEL_SHORT_NAME}"

LOG_FILE="../log/download_${MODEL_SHORT_NAME}.log"

mkdir -p "$LOCAL_DIR"

nohup huggingface-cli download \
    --resume-download \
    --token "$HF_TOKEN" \
    "$MODEL_NAME" \
    --local-dir "$LOCAL_DIR" \
    --local-dir-use-symlinks False \
    > "$LOG_FILE" 2>&1 &

```

一开始以为是服务器网络的问题，下载速度慢，于是就挂在后台不管它了。就这样挂了一天，但是模型仍未下载完成，且模型所在文件夹大小也没有变化。中断重来后，发现 .incomplete 文件已经下载完整，但是无法从 .incomplete 格式转化为最终的权重文件。

```
Fetching 17 files:   0%|          | 0/17 [00:00<?, ?it/s]
Downloading 'model-00001-of-00002.safetensors' to '/home/huggingface/Llama-2-7b-hf/.cache/huggingface/download/aoe4E07IMh7reFyUkVoVk040mQk=.4ec71fd53e99766de38f24753b30c9e8942630e9e576a1ba27b0ec531e87be41.incomplete' (resume from 9976578928/9976578928)
Downloading 'pytorch_model-00001-of-00002.bin' to '/home/huggingface/Llama-2-7b-hf/.cache/huggingface/download/fPHULxv55kAe7RSfHmmL42LIc1I=.ee62ed2ad7ded505ae47df50bc6c52916860dfb1c009df4715148cc4bfb50d2f.incomplete' (resume from 9976634558/9976634558)
Downloading 'model-00002-of-00002.safetensors' to '/home/huggingface/Llama-2-7b-hf/.cache/huggingface/download/Dr_lZJDwE1cnGAQMwA77jJEQIk8=.41780b5dac322ac35598737e99208d90bdc632a1ba3389ebedbb46a1d8385a7f.incomplete' (resume from 3500297344/3500297344)
Downloading 'pytorch_model-00002-of-00002.bin' to '/home/huggingface/Llama-2-7b-hf/.cache/huggingface/download/HnkwBfZ0kY-ttHuN02vuxl1p6V0=.1fd7762035b3ca4f2d6af6bf10129689a119b7c38058025f9842511532ea02fb.incomplete' (resume from 3500315539/3500315539)
```

在 Google 上搜索无果后，检查了服务器的网络，并没有发现什么问题。又尝试更换 huggingface_hub 的版本，还是会卡住。

最后尝试手动将 .incomplete 文件直接重命名为最终的权重文件名。经过测试，可以成功加载模型。
