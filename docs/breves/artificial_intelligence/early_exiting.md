---
title: "模型早退（early exiting）"
tags:
  - 模型早退
  - 人工智能
---

# 模型早退（early exiting）

## 简单介绍

模型早退机制依赖于 **多退(Multi-exit)** 网络架构。Multi-exit 网络在中间层上添加预测层，每个预测层与最后一层接收相同的监督信号，并且通过一定的方式来联合训练这些预测层。
![Multi-exit](https://cdn.jsdelivr.net/gh/json0368/blog@main/docs/data/breves/artificial_intelligence/early_exiting/multi_exit.png)

## 实现方式

我们先假设网络和多个置于不同中间层的预测模块都训练好了，那么我们有两种模式实现 Early exiting：

### budgeted early exiting mode

第一种是 **预算早退模式(budgeted early exiting mode)** 。这个模式下，模型使用一个固定的中间层(比如，12层的BERT，我们统一使用第三层)来预测所有的测试样本。此模式通过指定较浅的exit来加速模型推理速度，应对较大的query流入量。

### dynamic early exiting mode

另一种是 **动态退出模式(dynamic early exiting mode)** 。在这个模式下，我们首先要指定一个早退的策略或者标准，即给定当前获得的预测结果(来自前面的层和当前层)，需要决定模型是否在这一层早退，也就是用这一层的 exit 的预测结果来作为模型的最终预测结果。如果不早退，那么这一层的向量表征继续输入下一层网络，继续前向传播。在这种模式下，不同样本可能在不同深度退出。我们希望模型浅层就可以处理很多简单样本，而较难的样本我们使用更深层的网络输出来进行更好的预测。

## 不同的早退机制

### Entropy-based早退

**熵(entropy)** 是信息论中的一个重要概念，最初由香农提出，用于量化信息的不确定性。其计算公式为：

$$
H(X) = - \sum_{x \in X} p(x) \log p(x)
$$

其中，$H(X)$表示随机变量$X$的熵，$p(x)$是$x$的概率分布。
![Entropy-based](https://cdn.jsdelivr.net/gh/json0368/blog@main/docs/data/breves/artificial_intelligence/early_exiting/entropy_based.png)
在模型早退中，熵可以用来衡量模型对当前预测的不确定性。具体来说，每个 exit 得到预测结果后计算 entropy，而每个 exit 我们也会设置相应的 entropy 阈值。如果预测结果的 entropy 小于阈值，则在这一层早退。

### Confidence-based早退

![Confidence-based](https://cdn.jsdelivr.net/gh/json0368/blog@main/docs/data/breves/artificial_intelligence/early_exiting/confidence_based.png)
Shallow-Deep Net 论文在2019年提出 confidence-based 早退机制。如下图所示，假设任务是判断一个句子的情感标签是正向(Pos)，中立(Neu)或者负面(Neg)。中间分类层(intermediate classifier，也就是 exit)的 logits 在经过 softmax 后得到一个概率分布 $P = (p_{Pos}, p_{Neu}, p_{Neg})$。Shallow-Deep提出采用预测概率分布中的最大概率值 $p_{max} = max(p_{Pos}, p_{Neu}, p_{Neg})$ 作为置信度。模型会根据这个概率分布计算置信度，并与设定的阈值进行比较，从而决定是否在当前层进行早退。

从本质上讲，Confidence-based 早退和 Entropy-based 早退是很相似的。它们都采用某种信心指标来衡量某个中间分类层是否对预测结果有足够的自信。但是，两者的数学本质是不同的，Confidence-based 早退侧重于最大概率值，而 Entropy-based 早退则关注概率分布的整体形状。

### Patience-based早退

PABEE6 提出了一种类似于 **模型训练早停(early stopping)** 的早退策略，该策略在每个 exit 上设置一个 patience 参数，表示在连续多少次预测中，模型的性能没有显著提升时，就可以选择在当前 exit 进行早退。该参数初始化为 0。我们现在从模型最底层往高层进行推理，我们会根据每层的预测结果来进行最终的模型早退决策。在 Layer 1，patience counter 是不会变的。如果 Layer i (i >= 2) 预测的表现和 Layer i-1 一致，patience counter 就增加1，否则 patience counter 就会归 0。如果 patience counter 大于等于patience阈值 $p_{max}$ ，模型就要在这一层早退。

根据 PABEE 论文的实验结果，只有 Patience-based 早退能够规避 overthinking 问题，用一部分模型参数来取得比完整 BERT 更好的表现。

### 相关论文

- [1] Bolukbasi, Tolga, Joseph Wang, Ofer Dekel and Venkatesh Saligrama. “Adaptive Neural Networks for Efficient Inference.” ICML (2017).
- [2] Teerapittayanon, Surat, Bradley McDanel and H. T. Kung. “BranchyNet: Fast inference via early exiting from deep neural networks.” 2016 23rd International Conference on Pattern Recognition (ICPR) (2016): 2464-2469.
- [3] Xin, Ji, Raphael Tang, Jaejun Lee, Yaoliang Yu and Jimmy J. Lin. “DeeBERT: Dynamic Early Exiting for Accelerating BERT Inference.” ACL (2020).
- [4] Liu, Weijie, Peng Zhou, Zhe Zhao, Zhiruo Wang, Haotang Deng and Qi Ju. “FastBERT: a Self-distilling BERT with Adaptive Inference Time.” ACL (2020).
- [5] Kaya, Yigitcan, Sanghyun Hong and Tudor Dumitras. “Shallow-Deep Networks: Understanding and Mitigating Network Overthinking.” ICML (2019).
- [6] Zhou, Wangchunshu, Canwen Xu, Tao Ge, Julian McAuley, Ke Xu and Furu Wei. “BERT Loses Patience: Fast and Robust Inference with Early Exit.” ArXiv abs/2006.04152 (2020): n. pag.
