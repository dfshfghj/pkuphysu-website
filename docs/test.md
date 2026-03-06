# 2025 秋 统计力学 解答

1.见汪志诚9.16
$$
\frac{\bar{N}}{A} = \frac{p}{kT} \left( \frac{h^2}{2\pi m k T} \right)^{1/2} e^{\frac{\varepsilon_0}{kT}}
$$
2.(1)因为二维的$\int \frac{x dx}{e^x - 1}$不发散而一维的$\int \frac{dx}{e^x - 1}$发散；

(2) 参见 [H. Blas,PhysRevE.60.6164(1999)](https://journals.aps.org/pre/pdf/10.1103/PhysRevE.60.6164)

3.(1)
$$
F = -N k_B T \ln z =-  k N T \ln \left[e^{-\beta (-c x + b x^2)} + 2 e^{-\beta (c x/2 + b x^2)}\right]
$$
(2)
$$
F = -k N T \ln 3 - \frac{1}{4} (-4 b \beta + \beta^2 c^2) k N T x^2 - 
 \frac{1}{24} \beta^3 c^3 k N T x^3 + O(x^4)
$$

$$
\partial_x F = 0 \Longrightarrow x_1 = 0, x_2 = \frac{4(4 b - \beta c^2)}{\beta^2 c^3}
$$

$$
F(x_2) = F(0) \Longrightarrow \beta = \frac{4 b}{c^2}
$$

4.

(1)
$$
P = -\frac{\partial F}{\partial V} = -2 a_0(T)(v-v_0(T))
$$
(2)
$$
\mu = \frac{F+PV}{N} = a_0(T)(v_0^2 - v^2) - f
$$
(3)略

(4)
$$
\begin{cases}
-2a_0(v-v_0) = N k T, \\
a_0(v_0^2 - v^2) - f = kT \ln(\frac{\lambda^3 p}{kT})
\end{cases}
$$
显而易见$v<v_0$，$T \to 0$时，$v \to v_0$;

(5)$a_0(v_0^2 - v^2)$忽略，
$$
p = \frac{kT}{\lambda^3} \exp(-\frac{f}{kT})
$$


5.

(1) 
$$
\Delta F = \sum_{n = 1}^{\infty} \frac{1}{n!}\partial_V^n F (\Delta V)^n\\
= -\sum_{n = 1}^{\infty} \frac{1}{n!}\partial_V^{n-1} P (\Delta V)^n
$$
(2)$(\frac{\partial p}{\partial V})_T, (\frac{\partial^2 p}{\partial V^2})_T = 0$

(3)
$$
\langle (\Delta V)^2 \rangle = \frac{\int e^{- \beta (-\frac{1}{24}\partial_V^3p)\Delta V^4} \Delta V^2 d\Delta V}{\int e^{- \beta (-\frac{1}{24}\partial_V^3p)\Delta V^4}d\Delta V}\\
= \frac{\int e^{-\alpha x^4} x^2 d x}{\int e^{-\alpha x^4} dx}
= \frac{1}{\sqrt{\alpha}} \frac{\Gamma(3/4)}{\Gamma(1/4)}
$$
(4)
$$
p = \frac{k T}{v-b} - \frac{a}{v^2}
$$
$v_c = 3b, p_c = \frac{a}{27 b^2}, k T_c = \frac{8a}{27 b}$,
$$
(\frac{\partial^3 p}{\partial V^3})_T = - \frac{a}{81 N^3 b^5}
$$

$$
\langle (\Delta V)^2 \rangle = 24 N^{3/2} b^2 \frac{\Gamma(3/4)}{\Gamma(1/4)}
$$

(5)$\frac{\langle (\Delta V)^2 \rangle}{V_c^2} \sim \frac{1}{\sqrt{N}}$，远离临界点时$\sim \frac{1}{N}$，即临界点涨落剧烈.

6.

(1) 
$$
Z = \frac{1}{N!}(\frac{2\pi m k T}{h^2})^{3N/2} \int e^{\beta U}d^3 r_1 \cdots d^3r_N
$$

$$
r \to \alpha^{-1/\nu}r, U\to \alpha U, \beta \to \frac{1}{\alpha} \beta
$$

$$
Z\to \alpha^{3N/2 - 3N/\nu}Z
$$

(2)
$$
F(\alpha T, \alpha^{-\frac{3}{\nu}} V, N) = - kT(\ln Z(T, V, N) + 3N(1/2 - 1/\nu) \ln \alpha) \\
= F(T, V, N) - 3NkT(1/2 - 1/\nu) \ln \alpha
$$
$\alpha \to 1$:
$$
T \left(\frac{\partial F}{\partial T}\right)_{V} - \frac{3}{\nu} V \left(\frac{\partial F}{\partial V}\right)_{T} = F - 3N\left(\frac{1}{2} - \frac{1}{\nu}\right)k T
$$
(3)
$$
U = F + TS =  \frac{3}{\nu}P V +3N\left(\frac{1}{2} - \frac{1}{\nu}\right)k T
$$
[$\left(\frac{\partial F}{\partial T}\right)_{V} = - S, \left(\frac{\partial F}{\partial V}\right)_{T} = -p$].

(4)
$$
B_2(T) = -\frac{1}{2}\int \left(e^{-\beta (c/r)^{\nu}}-1\right)4\pi r^2 dr\\
 = -\frac{2\pi c^3}{\nu} \int_0^{\infty}(e^{-\beta x} - 1)x^{-(1+3/\nu)}dx
$$

$$
\partial_\beta I = -\int e^{-\beta x} x^{-3/\nu} dx = -\beta^{3/\nu - 1}\Gamma(-3/\nu + 1),\\
I = -\Gamma (-3/\nu) \beta^{3/\nu},\\
B_2 = \frac{2\pi c^3}{\nu} \Gamma(-3/\nu)\beta^{3/\nu}
$$

(5) 
$$
\ln Z = \ln Z_0 + \frac{1}{2}\frac{N^2}{V}\int (e^{-\beta\phi}-1)d\tau = \ln Z_0 - \frac{N^2}{V}B_2(T)
$$

$$
\frac{p}{kT} = n(1+B_2(T) n ), \delta U = \frac{N^2}{V}\frac{\partial}{\partial\beta}B_2(T), U_{ideal} = \frac{d}{s}NkT
$$

$$
B_2(T) = -\frac{1}{2}\int \left(e^{-\beta (c/r)^{\nu}}-1\right)S_d r^{d-1} dr\\
 = -\frac{S_d c^3}{2\nu} \int_0^{\infty}(e^{-\beta x} - 1)x^{-(1+d/\nu)}dx \sim\beta^{d/\nu}
$$

$$
\gamma = \frac{\delta U/ U}{\delta p/ p} = \frac{d/\nu}{d/s} = \frac{s}{\nu}
$$

7.

(1) $H_{eff} = J\sum S_i^z$, $E = - \sum (H + Heff) S_i^z$，
$$
Z = (1 + 2\cosh\beta (H + H_{eff}))^{N}
$$

$$
\langle E\rangle = -\frac{\partial \ln Z}{\partial \beta} = - N \frac{2(H+H_{eff})\sinh \beta (H + H_{eff})}{1 + 2\cosh\beta (H + H_{eff})}
$$

(2)
$$
F = - NkT\ln (1 + 2\cosh\beta (H + H_{eff}))
$$
(3)自洽方程
$$
m = -\frac{1}{N}\frac{\partial F}{\partial H} = \frac{2\sinh\beta(H + qJ m)}{1+2\cosh\beta (H + qJm)}
$$
代入$H=0$:
$$
\beta_c J = \frac{3}{2 q}
$$
(4) 展不动了