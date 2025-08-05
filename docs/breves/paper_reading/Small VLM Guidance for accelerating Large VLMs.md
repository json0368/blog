---
title: "Small VLM Guidance for accelerating Large VLMs"
tags:
  - 大小模型协同
  - VLM
  - 论文阅读
---

# Small VLM Guidance for accelerating Large VLMs

## 论文与代码

- 论文: [A Stitch in Time Saves Nine: Small VLM is a Precise Guidance for Accelerating Large VLMs](https://arxiv.org/abs/2412.03324)
- 代码: [GitHub - SGL](https://github.com/NUS-HPC-AI-Lab/SGL)

## 核心思想

论文的核心是提出了一种名为 **SGL** **(Small VLM Guidance for accelerating Large VLMs)** 的无训练方法，旨在不牺牲过多性能的前提下，显著提升大型VLM（视觉语言模型）的推理效率。其精髓在于巧妙地利用一个 small VLM 来指导和加速一个 large VLM。
![](https://ucn97u24pg26.feishu.cn/space/api/box/stream/download/asynccode/?code=NWFjYWM1MjE4Nzc5MjJjNWQ3N2M2MWRkZmRkMzBmMjVfZ0VJcFZNN01MTjJBb2F2UHdtaEI4NWZKWW9kc1U1TlNfVG9rZW46V1M2TGJ1NFdtb3RXaXp4cHJOMGNnSEdXbnZlXzE3NTQzNzI1Mzk6MTc1NDM3NjEzOV9WNA)

## 方法建立

SGL方法建立在一个关键的实证发现之上：

1. **全局注意力图的优越性**：仅使用大型VLM中某一个单层注意力图来判断 visual token 的重要性是次优的，尤其在剪枝率很高时性能会急剧下降。而聚合所有层得到的“全局注意力图”（global attention map）能更准确地识别出关键令牌，即便在极高的剪枝率下也能保持良好性能。但获取大型VLM自身的全局注意力图需要一次完整的、高成本的推理，这使其变得不切实际。
2. **大小模型注意力图的相似性**：研究发现，一个 small VLM 聚合全层得到的全局注意力图，与一个 large VLM 的全局注意力图高度相似。这意味着，small VLM 的注意力图可以作为一个高效且精准的“代理”，用于指导 large VLM。

## SGP: Small VLM-Guided visual token Pruning

SGP的目标是利用 small VLM 精准识别并剪除 large VLM 中不重要的 visual token，从而减少计算量。其具体实现步骤如下：

### 第一步：在 small VLM 中生成重要性分数

1. **前置推理**：首先，将输入的图像和文本提示（问题）送入一个 small VLM（例如，InternVL2-2B）进行一次完整的推理，生成答案。
2. **聚合全局注意力图**：在 small VLM 推理的过程中，动态地聚合其语言模型部分（LMS）所有层、所有头的注意力分数，形成一个全局的重要性排名。这个过程分为两个阶段：
   1. **Pre-filling stage**：此阶段处理输入的图像和文本令牌。SGP会关注所有 visual token 从所有 text prompt token 那里获得的注意力分数。将这些分数在所有层和所有注意力头之间累加，得到预填充阶段的总注意力分数 $A^P$。公式为
      $$
      A^{P}=\sum_{j=1}^{L}\sum_{k=1}^{H}\overline{A}_{j,k}^{p}
      $$
   2. **Decoding stage**：此阶段自回归地生成答案。SGP会关注所有 visual token 从每一个新生成的 answer token 那里获得的注意力分数。同样，将这些分数在所有生成步骤、所有层和所有头之间累加，得到解码阶段的总分 $A^D$。公式为
      $$
      A^{D}=\sum_{i=1}^{N_{G}}\sum_{j=1}^{L}\sum_{k=1}^{H}A_{i,j,k}^{D}
      $$
3. **计算最终重要性分数**：将两个阶段的分数相加，得到每个 visual token 最终的、综合的重要性分数 $A=A^P+A^D$。这个分数全面地反映了 visual token 与输入问题及生成答案的关联程度。

### 第二步：在 large VLM 中执行剪枝

1. **分数传递**：上一步得到的重要性分数 A 会被用来为 large VLM（例如，InternVL2-26B）的 visual token 进行排序。
2. **执行剪枝**：当 large VLM 接收到相同的输入时，它并不会处理全部的 visual token。研究者借鉴了 FastV 的思想，在 large VLM 的一个较早的中间层（例如第2层），根据 small VLM 提供的排序，只保留排名最高的 $R%$ 的 visual token，其余的则被丢弃。
3. **加速推理**：由于在早期层就大量减少了 visual token 的数量（例如剪掉91%），后续所有层的计算成本和内存占用都将大幅降低，从而实现了对 large VLM 的显著加速。

## SEE: Small VLM Early Exiting

SGP虽然有效，但引入 small VLM 本身会带来额外的计算开销。为了最大化利用这部分开销，SGL设计了SEE机制。其核心思想是，对于很多“简单”问题，small VLM 的回答已经足够准确，没有必要再启动昂贵的 large VLM。
![](https://ucn97u24pg26.feishu.cn/space/api/box/stream/download/asynccode/?code=ZWVkM2I0ZDBmMDIzMmM1NTMwYjc5ZjdhMjA3YTRmYjJfdEJOZnFTRmcyWjJIdHJRRmE4bUlNeWxJdUlSNFA3bGtfVG9rZW46VHMyc2JRSkphbzc1NEp4SG5yS2N3bHVJbnVmXzE3NTQzNzI1Mzk6MTc1NDM3NjEzOV9WNA)
**决策过程如下：**

1. **计算决策分数**：在 small VLM 完成推理并生成答案后，SEE会计算一个最终的 “early-exiting decision score” $S$，以判断其答案的可靠性。

2. **分数的构成**：这个决策分数由两个子分数平均而来：
   1. Confidence Score ( $S_{confidence}$)：这是一个衡量模型自信程度的直接指标，通过计算生成答案序列的长度归一化概率得到。公式为：

      $$
      \mathcal{S}_{confidence}=\exp\left\{\frac{1}{N_{G}}\log P(x_{G}^{1},...,x_{G}^{N_{G}})\right\}
      $$
      - 其中 $N_{G}$ 是生成令牌的数量，$P(⋅)$ 是生成序列的概率，其定义为
        $$
        P(x_{G}^{1},...,x_{G}^{N_{G}})=\prod_{i=1}^{N_{G}}P(x_{G}^{i}|LM^{S}(x_{I},x_{T},x_{G}^{1:i-1}))
        $$
        概率越高，代表模型对这个答案越“自信”。

   2. Consistency Score ( $S_{consistency}$)：这是论文提出的一个创新指标。其假设是：如果 small VLM 的答案是正确的，那么即便使用SGP剪枝掉一部分 visual token 后，它的预测结果也应该是一致的。因此，该分数通过计算在使用SGP剪枝后的 visual token 下，small VLM 生成相同答案的概率来衡量。其公式为
      $$
      \mathcal{S}_{consistency}=\prod_{i=1}^{N_{G}}P(x_{G}^{i}|LM^{S^{\prime}}(x_{I},x_{T},x_{G}^{1:i-1}))
      $$
      - 其中 $LM^{S^{\prime}}$ 代表使用了剪枝后 visual token 的小型语言模型。这个计算非常高效，因为它是在已知答案的情况下进行并行计算，且剪枝率很高（如95%），耗时不到 small VLM 初始推理时间的10%。

3. **做出决策**：最终决策分数 $\mathcal{S}=\frac{1}{2}(\mathcal{S}_{confidence}+\mathcal{S}_{consistency})$。将该分数与一个预设的阈值进行比较。
   1. 如果分数**高于**阈值，则认为 small VLM 的答案足够可靠，推理流程“提前退出”，直接返回 small VLM 的答案。
   2. 如果分数**低于**阈值，则认为问题对 small VLM 来说太“难”，需要启动 large VLM 以获得更精确的答案。
