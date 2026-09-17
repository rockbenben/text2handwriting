import type { PaperConfig, HandwritingConfig } from './types';

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  paper: PaperConfig;
  handwriting: HandwritingConfig;
  sampleText: string;
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'notes',
    name: '经典课堂笔记',
    description: '横线纸张，中性笔黑墨，自然端正的日常笔记排版',
    badge: '最常用',
    paper: {
      type: 'ruled',
      size: 'a4',
      width: 1200,
      height: 1697,
      marginTop: 140,
      marginBottom: 130,
      marginLeft: 110,
      marginRight: 90,
      lineSpacing: 56,
      showLineGuide: true,
      lineColor: 'rgba(176, 196, 222, 0.6)',
      showMarginLine: true,
      marginLineColor: 'rgba(248, 113, 113, 0.55)',
      paperTexture: 'clean',
      shadowIntensity: 0.15,
      vignette: false,
    },
    handwriting: {
      fontFamily: 'Ma Shan Zheng',
      fontSize: 38,
      fontSizeVariance: 1.0,
      lineHeight: 56,
      lineHeightVariance: 0.3,
      letterSpacing: 3,
      letterSpacingVariance: 0.5,
      rotationVariance: 1.2,
      xVariance: 0.8,
      yVariance: 0.5,
      strokeWidthVariance: 0.15,
      opacityVariance: 0.04,
      lineTiltVariance: 0.1,
      inkColor: '#1e293b',
      paragraphIndent: 2,
      alignToLines: true,
      seed: 1001,
      scratchOutProbability: 0.008,
      scratchOutStyle: 'all',
      scratchOutShowCorrection: true,
      scratchOutUseCaret: true,
      scratchOutCorrectionPosition: 'top_right',
      scratchOutSmartAvoidance: true,
      smartSignatureAlign: true,
      glyphVariance: 0.35,
      inkBleed: 0.4,
      wristArc: 0.15,
    },
    sampleText: `大学物理实验报告：光电效应与普朗克常数测定

一、实验目的
1. 观察光电效应的基本规律，验证爱因斯坦光电效应方程。
2. 测量不同频率光照射下的截止电压，计算普朗克常数 h。

二、实验原理
光电效应是指光线照射在金属表面时，金属内部电子吸收光子能量逸出金属表面的物理现象。爱因斯坦提出光量子假说，光子的能量为 E = hν。当入射光照射在光电管阴极时，逸出功为 W0，光电子的最大初动能遵循方程：
Ek = hν - W0 = eUc

三、数据记录与分析
实验测量了五种不同单色光波长（365nm、405nm、436nm、546nm、577nm）下的截止电压。通过线性拟合得到斜率 k = h/e，测得普朗克常数为 6.58 × 10^-34 J·s，相对误差约为 0.75%。实验数据良好，符合理论预期。

实验报告提交人：李华
2026年9月11日`,
  },
  {
    id: 'reflection',
    name: '检讨书 / 心得体会',
    description: '横线纸，稍显匆忙与自然的笔迹，模拟真实赶写手稿',
    badge: '学生神器',
    paper: {
      type: 'ruled',
      size: 'a4',
      width: 1200,
      height: 1697,
      marginTop: 130,
      marginBottom: 120,
      marginLeft: 100,
      marginRight: 90,
      lineSpacing: 52,
      showLineGuide: true,
      lineColor: 'rgba(165, 180, 252, 0.5)',
      showMarginLine: true,
      marginLineColor: 'rgba(239, 68, 68, 0.45)',
      paperTexture: 'clean',
      shadowIntensity: 0.2,
      vignette: false,
    },
    handwriting: {
      fontFamily: 'Zhi Mang Xing',
      fontSize: 36,
      fontSizeVariance: 1.0,
      lineHeight: 52,
      lineHeightVariance: 0.4,
      letterSpacing: 2,
      letterSpacingVariance: 0.7,
      rotationVariance: 1.6,
      xVariance: 1.0,
      yVariance: 0.6,
      strokeWidthVariance: 0.2,
      opacityVariance: 0.05,
      lineTiltVariance: 0.12,
      inkColor: '#0f172a',
      paragraphIndent: 2,
      alignToLines: true,
      seed: 2024,
      scratchOutProbability: 0.012,
      scratchOutStyle: 'double_line',
      scratchOutShowCorrection: true,
      scratchOutUseCaret: true,
      scratchOutCorrectionPosition: 'top_right',
      scratchOutSmartAvoidance: true,
      smartSignatureAlign: true,
      glyphVariance: 0.4,
      inkBleed: 0.45,
      wristArc: 0.2,
    },
    sampleText: `尊敬的老师：

您好！今天我怀着无比愧疚与懊悔的心情，写下这份深刻的检讨书。
关于近期我在课堂纪律与作业完成情况上的松懈，我进行了深刻的自我反省。作为一名学生，按时上课、专心听讲、独立思考并认真完成各项作业是基本的本分。然而由于近期自控力不足、作息不规律，导致学习状态出现滑坡，甚至影响了班级学习氛围。

在此，我向您以及全体同学做出诚恳的道歉。我已经深刻认识到了自己的错误。今后我将端正学习态度，严格遵守纪律，制定合理的学习计划，保证以最饱满的精神状态投入到每一节课中。

请老师和同学们监督我接下来的表现！

检讨人：张宇
2026年9月11日`,
  },
  {
    id: 'composition',
    name: '作文稿纸 (方格纸)',
    description: '标准作文格纸，红框格子，一格一字，规范工整',
    badge: '语文作文',
    paper: {
      type: 'grid',
      size: 'a4',
      width: 1200,
      height: 1697,
      marginTop: 150,
      marginBottom: 140,
      marginLeft: 100,
      marginRight: 100,
      lineSpacing: 50,
      gridCols: 20,
      gridRows: 26,
      showLineGuide: true,
      lineColor: 'rgba(239, 68, 68, 0.45)',
      paperTexture: 'clean',
      shadowIntensity: 0.1,
      vignette: false,
    },
    handwriting: {
      fontFamily: 'Ma Shan Zheng',
      fontSize: 36,
      fontSizeVariance: 0.5,
      lineHeight: 50,
      lineHeightVariance: 0.2,
      letterSpacing: 0,
      letterSpacingVariance: 0.3,
      rotationVariance: 0.8,
      xVariance: 0.5,
      yVariance: 0.4,
      strokeWidthVariance: 0.1,
      opacityVariance: 0.03,
      lineTiltVariance: 0.05,
      inkColor: '#1e293b',
      paragraphIndent: 2,
      alignToLines: true,
      seed: 3003,
    },
    sampleText: `那年盛夏的微风

夏日的午后，阳光透过斑驳的梧桐树叶，在青石板路上洒下碎金般的碎影。蝉鸣在枝头不知疲倦地喧嚣着，空气中弥漫着青草与栀子花的清香。

记忆里的那个夏天总是漫长而宁静。外婆摇着蒲扇，坐在院子里的竹椅上，轻声讲述着过去的传说。风铃在屋檐下叮咚作响，每一声都像是敲在时光深处的回音。时光如白驹过隙，如今漫步在喧闹的都市街头，偶尔吹过一阵温热的风，总会不由自主地想起那片宁静的院落与那一抹温柔的夕阳。`,
  },
  {
    id: 'english_notebook',
    name: '英语四线三格本',
    description: '标准英语书写练习本，四线三格红蓝线，圆珠笔蓝墨水',
    badge: '外语练习',
    paper: {
      type: 'english',
      size: 'a4',
      width: 1200,
      height: 1697,
      marginTop: 140,
      marginBottom: 130,
      marginLeft: 100,
      marginRight: 100,
      lineSpacing: 66,
      showLineGuide: true,
      paperTexture: 'clean',
      shadowIntensity: 0.15,
      vignette: false,
    },
    handwriting: {
      fontFamily: 'Zhi Mang Xing',
      fontSize: 38,
      fontSizeVariance: 0.8,
      lineHeight: 66,
      lineHeightVariance: 0.3,
      letterSpacing: 2,
      letterSpacingVariance: 0.5,
      rotationVariance: 1.2,
      xVariance: 0.8,
      yVariance: 0.5,
      strokeWidthVariance: 0.15,
      opacityVariance: 0.04,
      lineTiltVariance: 0.08,
      inkColor: '#1d4ed8', // classic pen blue
      paragraphIndent: 2,
      alignToLines: true,
      seed: 4004,
    },
    sampleText: `The Old Man and the Sea

He was an old man who fished alone in a skiff in the Gulf Stream and he had gone eighty-four days now without taking a fish. In the first forty days a boy had been with him. But after forty days without a fish the boy's parents had told him that the old man was now definitely and finally salao, which is the worst form of unlucky.

Everything about him was old except his eyes and they were the same color as the sea and were cheerful and undefeated. "Santiago," the boy said to him as they climbed the bank from where the skiff was hauled up. "I could go with you again. We've made some money."`,
  },
  {
    id: 'photo_realism',
    name: '实拍试卷 / 桌面实拍',
    description: '带柔和光影暗角与真实拍摄质感，仿若手机镜头随手实拍',
    badge: '逼真实拍',
    paper: {
      type: 'ruled',
      size: 'a4',
      width: 1200,
      height: 1697,
      marginTop: 140,
      marginBottom: 130,
      marginLeft: 110,
      marginRight: 90,
      lineSpacing: 56,
      showLineGuide: true,
      lineColor: 'rgba(160, 185, 220, 0.55)',
      showMarginLine: true,
      marginLineColor: 'rgba(248, 113, 113, 0.5)',
      paperTexture: 'photo',
      shadowIntensity: 0.28,
      vignette: true,
    },
    handwriting: {
      fontFamily: 'Long Cang',
      fontSize: 38,
      fontSizeVariance: 0.9,
      lineHeight: 56,
      lineHeightVariance: 0.3,
      letterSpacing: 2,
      letterSpacingVariance: 0.6,
      rotationVariance: 1.4,
      xVariance: 0.9,
      yVariance: 0.6,
      strokeWidthVariance: 0.2,
      opacityVariance: 0.05,
      lineTiltVariance: 0.1,
      inkColor: '#1e293b',
      paragraphIndent: 2,
      alignToLines: true,
      seed: 5005,
      scratchOutProbability: 0.01,
      scratchOutStyle: 'all',
      scratchOutShowCorrection: true,
      scratchOutUseCaret: true,
      scratchOutCorrectionPosition: 'top_right',
      scratchOutSmartAvoidance: true,
      smartSignatureAlign: true,
      glyphVariance: 0.4,
      inkBleed: 0.45,
      wristArc: 0.18,
    },
    sampleText: `读书心得与反思

生活在信息爆炸的快节奏时代，我们每天都被碎片化的碎片信息所包围。重读经典，让人能够在浮躁的世界中重新寻回内心的平静。

正如罗曼·罗兰所说：“世界上只有一种真正的英雄主义，那就是认清生活的真相后依然热爱它。”阅读不是为了逃避现实，而是为了更深刻、更丰盈地理解生活。在文字的字里行间，我们不仅能与先贤对话，更能照见真实的自我。

读书笔记摘抄者：李明
2026年9月11日`,
  },
  {
    id: 'vintage_letter',
    name: '复古信笺 / 泛黄手札',
    description: '温暖复古牛皮纸，深褐或钢笔蓝字迹，充满岁月情调',
    badge: '情怀信笺',
    paper: {
      type: 'kraft',
      size: 'a4',
      width: 1200,
      height: 1697,
      marginTop: 150,
      marginBottom: 140,
      marginLeft: 120,
      marginRight: 100,
      lineSpacing: 60,
      showLineGuide: true,
      lineColor: 'rgba(139, 94, 60, 0.35)',
      paperTexture: 'vintage',
      shadowIntensity: 0.2,
      vignette: true,
    },
    handwriting: {
      fontFamily: 'Liu Jian Mao Cao',
      fontSize: 38,
      fontSizeVariance: 1.0,
      lineHeight: 60,
      lineHeightVariance: 0.4,
      letterSpacing: 3,
      letterSpacingVariance: 0.7,
      rotationVariance: 1.5,
      xVariance: 1.0,
      yVariance: 0.6,
      strokeWidthVariance: 0.2,
      opacityVariance: 0.05,
      lineTiltVariance: 0.12,
      inkColor: '#2b231d',
      paragraphIndent: 2,
      alignToLines: true,
      seed: 6006,
      scratchOutProbability: 0.008,
      scratchOutStyle: 'all',
      scratchOutShowCorrection: true,
      scratchOutUseCaret: true,
      scratchOutCorrectionPosition: 'top_right',
      scratchOutSmartAvoidance: true,
      smartSignatureAlign: true,
      glyphVariance: 0.35,
      inkBleed: 0.4,
      wristArc: 0.2,
    },
    sampleText: `见字如面：

展信佳。
不知窗外的风，是否也吹拂过你所在的城市。近来一切安好，只是偶尔在落日熔金的傍晚，会想起从前同游林间小道的光景。

时光荏苒，许多故事已随风散去，但那份珍重的情谊始终温润如初。愿你万事顺遂，平淡日子里常有欢喜。期盼来日相聚，把酒言欢。

念你的 远方挚友
2026年9月11日`,
  },
];

export interface HandwritingPersona {
  id: string;
  name: string;
  badge: string;
  description: string;
  config: Partial<HandwritingConfig>;
}

export const HANDWRITING_PERSONAS: HandwritingPersona[] = [
  {
    id: 'disciplined',
    name: '工整学霸风',
    badge: '清秀工整',
    description: '字迹清秀端正，一笔一划抖动微小，行正格匀，极具纪律感',
    config: {
      xVariance: 0.4,
      yVariance: 0.3,
      rotationVariance: 0.6,
      fontSizeVariance: 0.4,
      letterSpacingVariance: 0.2,
      lineTiltVariance: 0.04,
      strokeWidthVariance: 0.1,
      opacityVariance: 0.02,
      glyphVariance: 0.2,
      inkBleed: 0.25,
      wristArc: 0.05,
      fatigueEffect: false,
      positionDisarray: 0,
      strokeRoughness: 0,
      edgeCrowding: false,
      scratchOutProbability: 0,
    },
  },
  {
    id: 'casual_notes',
    name: '随性笔记风',
    badge: '日常随笔',
    description: '自然连贯舒展，下笔轻重起伏，适度洇墨与连笔动态',
    config: {
      xVariance: 0.8,
      yVariance: 0.5,
      rotationVariance: 1.2,
      fontSizeVariance: 0.8,
      letterSpacingVariance: 0.5,
      lineTiltVariance: 0.1,
      strokeWidthVariance: 0.18,
      opacityVariance: 0.04,
      glyphVariance: 0.4,
      inkBleed: 0.4,
      wristArc: 0.18,
      fatigueEffect: true,
      positionDisarray: 0.2,
      strokeRoughness: 0.15,
      edgeCrowding: true,
      scratchOutProbability: 0.008,
      scratchOutStyle: 'all',
    },
  },
  {
    id: 'hurried_rush',
    name: '匆忙赶工风',
    badge: '行云流水',
    description: '疾笔书写，较大倾角与行末挤字，带有疲劳舒展与真实划痕',
    config: {
      xVariance: 1.3,
      yVariance: 0.8,
      rotationVariance: 2.2,
      fontSizeVariance: 1.4,
      letterSpacingVariance: 0.9,
      lineTiltVariance: 0.22,
      strokeWidthVariance: 0.25,
      opacityVariance: 0.07,
      glyphVariance: 0.55,
      inkBleed: 0.45,
      wristArc: 0.35,
      fatigueEffect: true,
      positionDisarray: 0.45,
      strokeRoughness: 0.3,
      edgeCrowding: true,
      scratchOutProbability: 0.02,
      scratchOutStyle: 'double_line',
    },
  },
  {
    id: 'standard_homework',
    name: '规范作业风',
    badge: '标准答卷',
    description: '严格吸附横线基准，工整排版，考试与标准作业答卷质感',
    config: {
      xVariance: 0.5,
      yVariance: 0.35,
      rotationVariance: 0.8,
      fontSizeVariance: 0.5,
      letterSpacingVariance: 0.3,
      lineTiltVariance: 0.06,
      strokeWidthVariance: 0.12,
      opacityVariance: 0.03,
      glyphVariance: 0.3,
      inkBleed: 0.3,
      wristArc: 0.1,
      fatigueEffect: false,
      positionDisarray: 0.1,
      strokeRoughness: 0.08,
      edgeCrowding: false,
      scratchOutProbability: 0.005,
      scratchOutStyle: 'slash',
    },
  },
];

export function applyPersonaToHandwriting(
  current: HandwritingConfig,
  persona: HandwritingPersona
): HandwritingConfig {
  return {
    ...current,
    ...persona.config,
  };
}
