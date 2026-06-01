export type Section = {
  id: string;
  title: string;
  content: string;
};

export const sections: Section[] = [
  {
    id: "radar-principle",
    title: "雷达是怎么「看到」东西的？",
    content: String.raw`
<p>在讲任何公式之前，我们先建立一个最基础的直觉：<strong>雷达本质上就是一个「回声定位」系统</strong>。</p>

<div class="highlight-box">
<p><strong>一句话总结</strong>：雷达发出电磁波 → 波碰到目标弹回来 → 雷达听回声 → 从回声里提取信息。</p>
</div>

<h3>从回波里能知道什么？</h3>
<p>想象你在一个空旷的山谷里大喊一声。你会听到回声。从这个回声里，你能知道三样东西：</p>

<ul>
<li><strong>距离</strong>：回声回来的越晚，山崖越远。雷达里也是一样的——电磁波往返的时间 × 光速 ÷ 2 = 目标距离。</li>
<li><strong>速度</strong>：如果山崖在移动（比如是一辆车），回声的音调会变。这就是<strong>多普勒效应</strong>：救护车朝你开过来时声音变尖，远离时变沉。雷达通过测量回波的频率变化，算出目标速度。</li>
<li><strong>方向</strong>：这是最难的。如果你只有一只耳朵，你能知道山崖有多远、移动有多快，但<strong>你根本无从判断它在哪个方向</strong>。</li>
</ul>

<h3>为什么单天线测不了角度？</h3>
<p>单根天线接收信号时，它只知道「有信号来了，强度是多少」，但它对信号从哪个方向来完全无感。就像一个聋了左耳的人，很难判断声音从左边还是右边来。</p>

<p>要测方向，你需要<strong>至少两根天线</strong>。这就是为什么雷达要从「单天线」进化到「阵列天线」。</p>
    `,
  },
  {
    id: "array-intuition",
    title: "用「一排耳朵」听方向——阵列天线",
    content: String.raw`
<p>人有两只耳朵，能判断声音的方向。雷达也一样：<strong>天线越多，对方向的感知越精确</strong>。</p>

<h3>两个天线就能定方向</h3>
<p>想象两个天线排成一排，间距为 $d$。一个信号从角度 $\theta$ 传来：</p>

<ul>
<li>信号到达左边天线时，走了一段路。</li>
<li>信号到达右边天线时，多走了一小段路——这段额外的路叫做<strong>波程差</strong>。</li>
<li>波程差 = $d \sin \theta$。</li>
</ul>

<p>因为多走了一段路，右边天线接收到的信号会有一个相位差。如果我们测量这个相位差，就能反推出 $\theta$。</p>

<div class="highlight-box">
<p><strong>一句话总结</strong>：两个天线收到同一个信号，但因为位置不同，信号到达有时间差/相位差。比较这个差异，就能算出方向。</p>
</div>

<h3>从一维到二维：均匀线阵（ULA）</h3>
<p>两个天线只能粗略判断方向。如果像下面这样，把 $N$ 个天线等间距排成一条直线，就形成了一个<strong>均匀线阵（Uniform Linear Array, ULA）</strong>：</p>

<p class="mono-block">
[ 天线1 ] ——$d$—— [ 天线2 ] ——$d$—— [ 天线3 ] ——$d$—— ... ——$d$—— [ 天线N ]
</p>

<p>通常取 $d = \lambda / 2$（半波长），这是为了避免<strong>角度模糊</strong>（也就是分不清正前方和侧后方）。</p>

<h3>导向矢量：阵列的「指纹」</h3>
<p>对于来自方向 $\theta$ 的信号，整个阵列的响应可以写成一个向量：</p>

<p class="math">
\boldsymbol{\beta}(\theta) = \begin{bmatrix} 1 \\ e^{-j\pi\sin\theta} \\ e^{-j2\pi\sin\theta} \\ \vdots \\ e^{-j(N-1)\pi\sin\theta} \end{bmatrix}
</p>

<p>这个向量叫做<strong>导向矢量（Steering Vector）</strong>。它描述了「当信号从 $\theta$ 方向来时，阵列上每个天线分别收到什么」。</p>

<p>你可以把它理解为阵列对不同方向的<strong>指纹</strong>：每个方向都有一个独特的导向矢量。如果我们能从接收信号中「匹配」出这个指纹，就知道信号从哪来了。</p>

<div class="highlight-box">
<p><strong>关键直觉</strong>：导向矢量的每一元素都是复数，相邻元素之间有一个固定的相位旋转 $e^{-j\pi\sin\theta}$。方向 $\theta$ 不同，旋转的速度就不同。</p>
</div>
    `,
  },
  {
    id: "doa-definition",
    title: "DOA 估计——目标到底从哪来？",
    content: String.raw`
<h3>DOA 是什么？</h3>
<p>DOA 是 <strong>Direction of Arrival</strong> 的缩写，中文叫<strong>来波方向</strong>。</p>

<p>注意是「来波方向」，不是「目标方向」。为什么？因为雷达接收的是反射波，波是从目标那边<strong>过来</strong>的，所以叫「来波」。在双基地雷达里，发射和接收分开，还会有一个 <strong>DOD（Direction of Departure，离射角）</strong>，描述波从发射端<strong>离开</strong>的方向。</p>

<div class="highlight-box">
<p><strong>一句话总结</strong>：DOA = 波从哪来；DOD = 波往哪去。</p>
</div>

<h3>问题定义</h3>
<p>假设空间中有 $K$ 个目标，它们相对于接收阵列的角度分别是 $\theta_1, \theta_2, \ldots, \theta_K$。阵列接收到的信号是所有目标信号叠加，再加上噪声。</p>

<p>用矩阵形式写就是：</p>

<p class="math">
\mathbf{y}(t) = \sum_{k=1}^{K} s_k(t) \boldsymbol{\beta}(\theta_k) + \mathbf{n}(t)
</p>

<p>其中 $s_k(t)$ 是第 $k$ 个目标的信号，$\boldsymbol{\beta}(\theta_k)$ 是它的导向矢量，$\mathbf{n}(t)$ 是噪声。</p>

<p>DOA 估计的任务就是：<strong>已知接收信号 $\mathbf{y}(t)$，估计出 $K$ 个角度 $\theta_1, \ldots, \theta_K$</strong>。</p>

<h3>最直觉的方法：波束扫描</h3>
<p>最简单粗暴的方法是什么？<strong>逐个方向「看」过去</strong>。</p>

<p>想象你手里有一个可调方向的探照灯。你把灯从左扫到右，哪里最亮，哪里就有目标。雷达也可以这样做：把阵列的加权向量 $\mathbf{w}$ 对准不同方向，计算输出功率：</p>

<p class="math">
P(\theta) = |\mathbf{w}^H(\theta) \mathbf{y}|^2
</p>

<p>当 $\mathbf{w}$ 恰好对准某个目标方向时，所有天线的信号同相叠加，功率最大。画出 $P(\theta)$ 随 $\theta$ 变化的曲线，峰值位置就是目标方向。</p>

<p>但这种方法有个致命的局限——<strong>瑞利限（Rayleigh Limit）</strong>：如果两个目标靠得太近（角度差小于阵列孔径的倒数），波束扫描就分不开了。就像用粗毛笔写字，笔画一粗，细小的结构就糊在一起。</p>

<div class="highlight-box">
<p><strong>波束扫描的问题</strong>：分辨率受限于阵列物理孔径，而且只能「看到」比波束宽度粗的目标。</p>
</div>
    `,
  },
  {
    id: "subspace-methods",
    title: "突破物理极限——子空间方法",
    content: String.raw`
<p>波束扫描的分辨率受限于物理孔径，就像一个近视的人看不清远处的小字。但数学家发现：<strong>如果我们不只看「功率」，而是看信号的「结构」，就能突破物理限制</strong>。</p>

<h3>协方差矩阵：信号的结构密码</h3>
<p>阵列接收到的信号是一个向量 $\mathbf{y}(t)$。如果我们在多个时刻采样，可以计算<strong>协方差矩阵</strong>：</p>

<p class="math">
\mathbf{R} = \mathbb{E}[\mathbf{y}(t) \mathbf{y}^H(t)]
</p>

<p>直观理解：$\mathbf{R}$ 描述了阵列上各天线之间的<strong>相关性</strong>。如果两个天线总是收到很相似的信号，说明它们的相关性高。协方差矩阵把这些相关性都记录了下来。</p>

<p>对 $\mathbf{R}$ 做特征分解，会得到 $N$ 个特征值和对应的特征向量：</p>

<p class="math">
\mathbf{R} = \sum_{i=1}^{N} \lambda_i \mathbf{e}_i \mathbf{e}_i^H
</p>

<p>神奇的是，这些特征值可以分成两组：</p>

<ul>
<li><strong>大特征值</strong>（共 $K$ 个，$K$ 是目标数）：它们对应的方向张成了<strong>信号子空间</strong>。</li>
<li><strong>小特征值</strong>（共 $N-K$ 个）：它们对应的方向张成了<strong>噪声子空间</strong>。</li>
</ul>

<div class="highlight-box">
<p><strong>核心洞察</strong>：信号子空间是由 $K$ 个目标的导向矢量张成的；噪声子空间与所有导向矢量都正交。</p>
</div>

<h3>MUSIC：在噪声里找信号</h3>
<p>1986年，Schmidt 提出了 MUSIC 算法。它的核心思想极其优雅：</p>

<p><strong>如果某个方向 $\theta$ 真的有目标，那么它的导向矢量 $\boldsymbol{\beta}(\theta)$ 应该落在信号子空间里，因此与噪声子空间正交。</strong></p>

<p>所以，我们只需要遍历所有方向，计算导向矢量与噪声子空间的「垂直程度」：</p>

<p class="math">
P_{\text{MUSIC}}(\theta) = \frac{1}{\boldsymbol{\beta}^H(\theta) \mathbf{E}_n \mathbf{E}_n^H \boldsymbol{\beta}(\theta)}
</p>

<p>其中 $\mathbf{E}_n$ 是噪声子空间的基矩阵。当 $\boldsymbol{\beta}(\theta)$ 与噪声子空间正交时，分母趋近于 0，$P_{\text{MUSIC}}$ 出现一个尖峰。尖峰的位置就是目标方向！</p>

<p>MUSIC 的神奇之处在于它可以<strong>超分辨</strong>——分辨两个靠得极近的目标，突破了波束扫描的瑞利限。代价是需要在整个角度范围内做<strong>谱搜索</strong>，计算量大。</p>

<h3>ESPRIT：不需要搜索的聪明办法</h3>
<p>MUSIC 需要像探照灯一样一格一格地扫描。ESPRIT（Estimation of Signal Parameters via Rotational Invariance Techniques）则发现了一个更巧妙的性质：</p>

<p><strong>如果把阵列分成两个完全相同的子阵（一个去掉第一个天线，一个去掉最后一个天线），两个子阵接收到的信号只差一个旋转矩阵。</strong></p>

<p>具体来说，设 $\mathbf{B}_1$ 是前 $N-1$ 个天线组成的子阵的导向矩阵，$\mathbf{B}_2$ 是后 $N-1$ 个天线组成的子阵的导向矩阵。它们满足：</p>

<p class="math">
\mathbf{B}_2 = \mathbf{B}_1 \boldsymbol{\Phi}
</p>

<p class="math">
\boldsymbol{\Phi} = \text{diag}\left( e^{-j\pi\sin\theta_1}, e^{-j\pi\sin\theta_2}, \ldots, e^{-j\pi\sin\theta_K} \right)
</p>

<p>这个旋转矩阵 $\boldsymbol{\Phi}$ 的对角线元素直接编码了目标角度！所以问题的关键变成了：如何从接收数据中估计出 $\boldsymbol{\Phi}$？</p>

<p>步骤如下：</p>

<ol>
<li>从协方差矩阵得到信号子空间 $\mathbf{U}_s$。</li>
<li>把 $\mathbf{U}_s$ 分成上下两半，分别对应两个子阵。</li>
<li>利用最小二乘求出旋转矩阵的估计 $\widehat{\boldsymbol{\Phi}}$。</li>
<li>对 $\widehat{\boldsymbol{\Phi}}$ 做特征值分解，特征值就是 $e^{-j\pi\sin\theta_k}$。</li>
<li>从特征值中提取角度：$\hat{\theta}_k = -\frac{1}{\pi} \arg(\lambda_k)$。</li>
</ol>

<div class="highlight-box">
<p><strong>ESPRIT 的优点</strong>：不需要谱搜索，计算复杂度低，适合实时处理。<br/><strong>ESPRIT 的缺点</strong>：需要阵列具有平移不变结构（如 ULA），且特征分解对低信噪比敏感。</p>
</div>

<h3>Propagator Method：更省事的近似</h3>
<p>如果目标数 $K$ 远小于天线数 $N$，协方差矩阵的很大一块都是噪声。PM（Propagator Method）提出：不需要对整个矩阵做特征分解（SVD），只需要解一个线性方程组就能近似得到信号子空间。</p>

<p>具体来说，把接收矩阵分成信号部分和噪声部分，通过一个<strong>传播算子（Propagator）</strong>建立它们之间的线性关系。PM 的计算复杂度只有 $O(MNK)$，远低于 ESPRIT 的 $O(N^3)$，但估计精度稍差。</p>

<h3>三种方法的对比</h3>

<table>
<tr><th>方法</th><th>核心思想</th><th>需要搜索？</th><th>计算复杂度</th><th>低 SNR 表现</th></tr>
<tr><td>MUSIC</td><td>噪声子空间正交</td><td>是（一维/二维）</td><td>高</td><td>中等</td></tr>
<tr><td>ESPRIT</td><td>子阵旋转不变</td><td>否</td><td>中（SVD）</td><td>较差</td></tr>
<tr><td>PM</td><td>传播算子线性近似</td><td>否</td><td>低</td><td>差</td></tr>
</table>

<div class="highlight-box">
<p><strong>共同的软肋</strong>：这三种方法都是<strong>矩阵方法</strong>——它们把多维数据压成矩阵来处理。如果数据天然是高维的（比如 MIMO 雷达有「发射 × 接收 × 时间」三个维度），压成矩阵会损失结构信息，导致性能下降。</p>
</div>
    `,
  },
  {
    id: "mimo-intro",
    title: "MIMO 雷达——从「一只眼」到「很多只眼」",
    content: String.raw`
<p>传统雷达是「一个发射天线 + 一个接收天线」。MIMO 雷达说：<strong>为什么不多用几个？</strong></p>

<h3>MIMO 从哪来？</h3>
<p>MIMO 这个词来自无线通信。在 Wi-Fi 和 5G 里，基站和手机都有多根天线，同时收发多个数据流，速率成倍提升。雷达借用了这个概念，但目的不是传数据，而是<strong>获得更多的目标信息</strong>。</p>

<h3>共址 MIMO vs 分布式 MIMO</h3>

<ul>
<li><strong>共址 MIMO</strong>：所有收发天线挤在一起（间距半波长），像一排紧紧挨着的眼睛。不同天线发射<strong>正交波形</strong>，接收端可以分离出每一路发射信号。这提供了<strong>波形分集</strong>，等效于虚拟出一个更大的阵列。</li>
<li><strong>分布式 MIMO</strong>：收发天线分散在很广的区域，像很多人在不同的山头同时观察。这提供了<strong>空间分集</strong>，可以对抗目标在某些角度上雷达反射很弱的问题（RCS 闪烁）。</li>
</ul>

<p>本模块主要关注<strong>共址双基地 MIMO 雷达</strong>：发射阵列和接收阵列各自共址，但两者之间有一定距离。</p>

<h3>双基地 MIMO 的信号模型</h3>
<p>假设发射阵列有 $M$ 个天线，接收阵列有 $N$ 个天线，空间中有 $K$ 个目标。第 $k$ 个目标的<strong>离射角</strong>（从发射端看）为 $\varphi_k$，<strong>来波角</strong>（从接收端看）为 $\theta_k$。</p>

<p>发射导向矩阵和接收导向矩阵分别为：</p>

<p class="math">
\mathbf{A} = [\boldsymbol{\alpha}(\varphi_1), \ldots, \boldsymbol{\alpha}(\varphi_K)] \in \mathbb{C}^{M \times K}
</p>

<p class="math">
\mathbf{B} = [\boldsymbol{\beta}(\theta_1), \ldots, \boldsymbol{\beta}(\theta_K)] \in \mathbb{C}^{N \times K}
</p>

<p>在单脉冲内（暂时忽略多普勒），接收信号矩阵可以写成：</p>

<p class="math">
\mathbf{Y} = \mathbf{B} \boldsymbol{\Sigma} \mathbf{A}^T + \mathbf{Z}
</p>

<p>其中 $\boldsymbol{\Sigma} = \text{diag}(\sigma_1^2, \ldots, \sigma_K^2)$ 包含各目标的反射强度（RCS），$\mathbf{Z}$ 是噪声。</p>

<div class="highlight-box">
<p><strong>直观理解</strong>：接收信号 = 接收阵列对目标的响应 × 目标反射强度 × 发射阵列对目标的响应 + 噪声。<br/>我们需要同时估计 $\{\varphi_k\}$（DOD）和 $\{\theta_k\}$（DOA）。</p>
</div>

<h3>配对问题</h3>
<p>如果分别对发射端和接收端做 ESPRIT，我们会得到两组角度：一组 DOD，一组 DOA。但<strong>不知道哪个 DOD 对应哪个 DOA</strong>。比如有目标 A 和目标 B，我们算出 DOD 是 $20°$ 和 $30°$，DOA 是 $15°$ 和 $25°$，但不知道 $20°$ 是和 $15°$ 配对还是和 $25°$ 配对。</p>

<p>这需要额外的配对算法，增加了复杂度和出错概率。而张量分解天然就能解决这个问题——因为同一个秩-1 成分对应的是同一个目标。</p>
    `,
  },
  {
    id: "tensor-intro",
    title: "从矩阵到张量——为什么需要更高维的工具？",
    content: String.raw`
<p>前面的算法都是<strong>矩阵算法</strong>——把数据压成一个二维表格来处理。但 MIMO 雷达的数据天然是三维的：<strong>发射天线 × 接收天线 × 脉冲/时间</strong>。强行压成矩阵，就像把立体照片压成平面图，很多空间信息就丢了。</p>

<h3>张量是什么？</h3>
<p>用最通俗的话说：</p>

<ul>
<li><strong>标量</strong>：一个数（0 维）</li>
<li><strong>向量</strong>：一排数（1 维）</li>
<li><strong>矩阵</strong>：一个表格（2 维）</li>
<li><strong>张量</strong>：一个「数据方块」（3 维或更高维）</li>
</ul>

<p>MIMO 雷达的接收数据就是一个三阶张量 $\mathcal{Y} \in \mathbb{C}^{M \times N \times Q}$：第一个维度是发射通道，第二个是接收通道，第三个是脉冲数。</p>

<h3>Mode-n 展开：把方块摊平</h3>
<p>虽然张量是高维的，但有时候我们需要把它变回矩阵来做运算。<strong>Mode-n 展开</strong>就是把张量沿第 $n$ 个维度「切开、摊平」：</p>

<ul>
<li>沿发射维（Mode-1）展开：$M \times NQ$ 的矩阵</li>
<li>沿接收维（Mode-2）展开：$N \times MQ$ 的矩阵</li>
<li>沿脉冲维（Mode-3）展开：$Q \times MN$ 的矩阵</li>
</ul>

<p>这就像把一个魔方拆开，按不同方向重新排成一列。</p>

<h3>PARAFAC 分解：把复杂拆成简单</h3>
<p>三阶张量最重要的分解方式是 <strong>PARAFAC（Parallel Factor Analysis）</strong>。它把一个张量拆成 $R$ 个「最简单的积木」之和：</p>

<p class="math">
\mathcal{Y} = \sum_{r=1}^{R} \mathbf{a}_r \circ \mathbf{b}_r \circ \mathbf{c}_r + \mathcal{Z}
</p>

<p>符号 $\circ$ 表示<strong>外积</strong>，意思是：$(\mathbf{a} \circ \mathbf{b} \circ \mathbf{c})_{ijk} = a_i \cdot b_j \cdot c_k$。也就是说，这个「积木」在三个维度上分别是向量 $\mathbf{a}, \mathbf{b}, \mathbf{c}$，整体是一个三维的 rank-1 结构。</p>

<p>向量 $\mathbf{a}_r, \mathbf{b}_r, \mathbf{c}_r$ 分别来自三个<strong>因子矩阵</strong> $\mathbf{A}, \mathbf{B}, \mathbf{C}$。如果能从观测数据 $\mathcal{Y}$ 中恢复出这三个因子矩阵，就能读出目标参数。</p>

<div class="highlight-box">
<p><strong>PARAFAC 最关键的性质——唯一性</strong>：在适当条件下，因子矩阵 $\mathbf{A}, \mathbf{B}, \mathbf{C}$ 可以被唯一确定。这意味着不需要像矩阵 SVD 那样引入人为的正交约束，就能恢复出物理上有意义的解。</p>
</div>

<h3>ALS 算法：交替求解</h3>
<p>PARAFAC 没有闭式解，最常用的是 <strong>ALS（Alternating Least Squares）</strong>：</p>

<ol>
<li>固定 $\mathbf{B}$ 和 $\mathbf{C}$，通过最小二乘更新 $\mathbf{A}$。</li>
<li>固定 $\mathbf{A}$ 和 $\mathbf{C}$，更新 $\mathbf{B}$。</li>
<li>固定 $\mathbf{A}$ 和 $\mathbf{B}$，更新 $\mathbf{C}$。</li>
<li>循环直到收敛。</li>
</ol>

<p>每一步都是凸优化问题，有解析解。虽然可能收敛到局部最优，但在大多数信号处理场景中表现很好。</p>
    `,
  },
  {
    id: "slow-time",
    title: "Slow-Time MIMO：用时间换硬件",
    content: String.raw`
<p>传统共址 MIMO 要求每个发射通道有独立的射频链和波形发生器。8 个发射通道就需要 8 套发射硬件，成本高、体积大。Slow-Time MIMO 提出了一种更聪明的方案：<strong>让所有通道共享同一套硬件，在时间上轮流使用</strong>。</p>

<h3>DDMA：给每个通道分配不同的「音调」</h3>
<p>想象一下合唱团：所有人唱同一首歌，但每个人的音调（频率）略有不同。虽然声音混在一起，但你可以凭音调区分出每个人。</p>

<p>DDMA（Doppler Division Multiple Access）就是这个原理。所有发射天线发射同一个波形包络（比如线性调频信号 LFM），但第 $m$ 个通道在每个脉冲上附加一个特定的相位：</p>

<p class="math">
w_{mq} = \exp(j 2\pi f_m q T)
</p>

<p class="math">
f_m = \frac{f_a}{2}\left(-1 + \frac{2m - 1}{M}\right)
</p>

<p>其中 $f_a$ 是脉冲重复频率，$q$ 是脉冲序号，$T = 1/f_a$。这相当于给每个发射通道分配了一个独特的「多普勒频移标签」。接收端通过滤波，就能把不同通道的信号分离开。</p>

<div class="highlight-box">
<p><strong>一句话总结</strong>：DDMA 通过在慢时间（脉冲间）施加不同的相位调制，让 $M$ 个虚拟发射通道共享 $1$ 套硬件。</p>
</div>

<h3>传统张量模型的困境</h3>
<p>在常规 MIMO 雷达中，接收数据是 $M \times N \times Q$ 的张量（$Q$ 个脉冲）。当 $Q \geq MN$ 时，PARAFAC 分解稳定且精确。</p>

<p>但在 Slow-Time MIMO 中，DDMA 把每个发射通道可用的脉冲数从 $Q$ 减少到了 $Q/M$。张量的 Mode-3 维度骤减，就像把一个立体照片压扁了。这导致：</p>

<ul>
<li>ALS 收敛困难（样本不够多）</li>
<li>分解精度严重下降</li>
</ul>

<h3>改进的 Hadamard 张量模型</h3>
<p>核心 insight：<strong>不要把 DDMA 的相位调制当成「采样损失」，而是把它显式地编码进信号模型</strong>。</p>

<p>接收信号可以看作是两个张量的 Hadamard（逐元素）积：</p>

<p class="math">
\mathcal{Y} = \mathcal{Y}_s \ast \mathcal{D} + \mathcal{Z}
</p>

<p>其中 $\mathcal{Y}_s$ 是常规 MIMO 雷达的完整张量模型（保留了全部 $Q$ 个脉冲），$\mathcal{D}$ 编码了 DDMA 的相位调制矩阵。这个模型的精妙之处在于：<strong>它没有牺牲多普勒域的采样数，只是把调制因子剥离了出来</strong>。这样既保留了张量分解的优势，又克服了 Slow-Time MIMO 的采样瓶颈。</p>

<p class="math">
\mathcal{Y}_s = \mathcal{I}_K \times_1 \mathbf{A} \times_2 \mathbf{B} \times_3 \mathbf{C}
</p>

<p class="math">
\mathcal{D} = \mathcal{I}_M \times_1 \mathbf{I}_M \times_2 \mathbf{I}_N \times_3 \mathbf{W}^T
</p>

<p>$\times_n$ 表示张量与矩阵的 mode-$n$ 乘积，$\mathbf{W}$ 是 $M \times Q$ 的 DDMA 相位调制矩阵。</p>
    `,
  },
  {
    id: "parafac-esprit",
    title: "PARAFAC + ESPRIT：张量与子空间的完美结合",
    content: String.raw`
<p>现在我们有了改进的张量模型，接下来的问题是怎么从中提取角度。答案是：<strong>先用 PARAFAC 分解恢复出因子矩阵，再用 ESPRIT 从因子矩阵中提取角度</strong>。</p>

<h3>Modified ALS</h3>
<p>由于模型中多了一个固定的 Hadamard 因子 $\mathcal{D}$，标准 ALS 需要修改。核心是在每一步最小二乘中，把 $\mathcal{D}$ 作为已知常数保留下来。</p>

<p>以更新发射导向矩阵为例，目标函数变为：</p>

<p class="math">
\min_{\mathbf{A}_0} \left\| \mathbf{Y}_{A(1)} - \left[ (\mathbf{B} \odot \mathbf{C}) \mathbf{A}_0^T \right] \ast \mathbf{D}_{A(1)} \right\|_F^2
</p>

<p>其中 $\mathbf{A}_0 = [\mathbf{A}_1^T, \mathbf{A}_2^T]^T$ 是通过将发射阵列分成两个重叠子阵构造的增广矩阵。这种「子阵拼接」近似翻倍了有效样本数。</p>

<h3>利用 Vandermonde 结构提取角度</h3>
<p>ULA 的导向矩阵具有 <strong>Vandermonde 结构</strong>：每一行是前一行的常数倍。这意味着两个子阵之间只相差一个对角旋转矩阵：</p>

<p class="math">
\mathbf{A}_2 = \mathbf{A}_1 \boldsymbol{\Gamma}_A
</p>

<p class="math">
\boldsymbol{\Gamma}_A = \text{diag}\left( e^{-j\pi\sin\varphi_1}, \ldots, e^{-j\pi\sin\varphi_K} \right)
</p>

<p>通过 PARAFAC 分解得到 $\widehat{\mathbf{A}}_1$ 和 $\widehat{\mathbf{A}}_2$ 后，用最小二乘估计旋转矩阵：</p>

<p class="math">
\widehat{\boldsymbol{\Gamma}}_A = \widehat{\mathbf{A}}_1^\dagger \widehat{\mathbf{A}}_2
</p>

<p>对 $\widehat{\boldsymbol{\Gamma}}_A$ 做特征值分解，特征值就是 $e^{-j\pi\sin\varphi_k}$ 的估计，从而读出 DOD：</p>

<p class="math">
\hat{\varphi}_k = -\frac{1}{\pi} \arg\left( \widehat{\boldsymbol{\Gamma}}_A(k,k) \right)
</p>

<p>DOA 的估计完全对称：对接收阵列做同样的子阵划分即可。<strong>而且 PARAFAC 分解天然完成了 DOD 和 DOA 的自动配对</strong>——因为同一个秩-1 成分对应同一个目标。</p>

<h3>迭代解耦：DOD 与多普勒的联合估计</h3>
<p>在 PARAFAC-Direct 等方法中，DOD 和多普勒频率存在耦合，需要迭代解耦：</p>

<ol>
<li><strong>初始化</strong>：从因子矩阵 $\mathbf{C}$ 提取精细多普勒 $f_{\text{fine}}$；对 $\mathbf{A}$ 做 FFT，从峰值确定粗略多普勒 $f_{\text{amb}}$。两者结合解模糊，得到初始 $f_k^{(0)}$。</li>
<li><strong>步骤 A（固定多普勒，更新 DOD）</strong>：用当前 $f_k$ 补偿多普勒相位，去除 DDMA 调制，用 ESPRIT 估计 $\theta_k$。</li>
<li><strong>步骤 B（固定 DOD，更新多普勒）</strong>：用当前 $\theta_k$ 重构导向矢量，重新估计多普勒并解模糊。</li>
<li>交替执行 A、B 直至收敛。</li>
</ol>
    `,
  },
  {
    id: "experiments",
    title: "实验验证——看图说话",
    content: String.raw`
<h3>实验设置</h3>
<p>在论文仿真中，常用以下参数：</p>
<ul>
<li>发射阵元数 $M = 8$，接收阵元数 $N = 10$</li>
<li>脉冲数 $Q = 80$，脉冲重复频率 $f_a = 50$ kHz</li>
<li>目标数 $K = 2$，分别位于不同角度</li>
<li>蒙特卡洛仿真次数 $P = 200$</li>
</ul>

<h3>角度估计精度（RMSE）</h3>
<p>下图对比了不同 SNR（信噪比）下各算法的均方根误差：</p>

<div class="img-wrapper">
<img src="/study/mimo-radar/rmse_vs_snr_YA_combined.png" alt="RMSE vs SNR combined" />
<p class="img-caption">图 1：多种算法的 RMSE 随 SNR 变化（Combined DOD+DOA）</p>
</div>

<p><strong>看图说话</strong>：曲线越低越好。PARAFAC-based 方法（红色/绿色）在低 SNR 下明显低于传统方法（PM、ESPRIT、U-ESPRIT）。原因有三：</p>
<ol>
<li>张量分解利用了数据的多线性结构，信息利用更充分。</li>
<li>子阵拼接让有效样本数近似翻倍。</li>
<li>Hadamard 模型恢复了 Doppler 域的完整采样数。</li>
</ol>

<div class="img-wrapper">
<img src="/study/mimo-radar/rmse_vs_snr_YA_doa.png" alt="RMSE vs SNR DOA" />
<p class="img-caption">图 2：DOA 估计的 RMSE 随 SNR 变化</p>
</div>

<h3>分辨率分析</h3>
<p>两个目标靠得很近时（比如角度只差 $1°$），算法还能不能把它们分开？下图展示了分辨率概率：</p>

<div class="img-wrapper">
<img src="/study/mimo-radar/angle_estimation_performance.png" alt="Angle estimation performance" />
<p class="img-caption">图 3：邻近目标分辨率概率曲线</p>
</div>

<p>PARAFAC-based 方法具有最低的分辨门限，能在更低的 SNR 下分辨出靠得极近的目标。</p>

<h3>L-Shaped Array 增强自由度</h3>
<p>传统方法的可分辨目标数受限于 $\min(M, N)$。通过 L 型阵列结合张量方法，可以突破这一限制：</p>

<div class="img-wrapper">
<img src="/study/mimo-radar/rmse_vs_snr_whitened.png" alt="RMSE whitened" />
<p class="img-caption">图 4：L-Shaped Array 白化处理后的 RMSE 对比</p>
</div>

<div class="img-wrapper">
<img src="/study/mimo-radar/fig2_reproduction.png" alt="Multi-target detection" />
<p class="img-caption">图 5：多目标检测实验复现</p>
</div>
    `,
  },
  {
    id: "advanced",
    title: "前沿方向——从张量到深度学习",
    content: String.raw`
<h3>Sub-Nyquist + Decomposed CNN</h3>
<p>传统方法要求采样率满足奈奎斯特准则。论文 <em>Decomposed CNN for Sub-Nyquist Tensor-Based 2-D DOA Estimation</em> 提出：先用 PARAFAC 把高维张量投影到低维因子空间，再用轻量级 CNN 学习噪声因子到真实角度的非线性映射。这样即使在欠采样条件下，也能保持高精度。</p>

<h3>Tensorized Neural Layer</h3>
<p>论文 <em>Tensorized Neural Layer Decomposition for 2-D DOA Estimation</em> 将神经网络的全连接层进行张量化分解，把庞大的权重矩阵压缩为多个低秩因子矩阵。这不仅减少了参数量，还隐式编码了阵列流形的 Vandermonde 结构，让神经网络具备物理可解释性。</p>

<h3>知识脉络回顾</h3>

<p class="mono-block">
雷达基础 → 阵列天线 → DOA 估计（波束扫描）→ 子空间方法（MUSIC/ESPRIT/PM）
      ↓
MIMO 雷达 → 张量代数 → PARAFAC 分解 → Slow-Time MIMO 张量模型
      ↓
PARAFAC + ESPRIT 联合估计 → 深度学习融合
</p>

<p>从线性代数到张量分析，再到数据驱动方法，MIMO 雷达信号处理的发展脉络清晰可循。</p>
    `,
  },
];
