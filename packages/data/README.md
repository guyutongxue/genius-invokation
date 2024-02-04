# `@gi-tcg/data` 标准卡牌数据定义


## 图像数据

使用 AssetStudio 提取原始图像：

```
AssetStudioCLI --silent "<path_to_genshin_impact_games>\YuanShen_Data\StreamingAssets\AssetBundles\blocks" images --types Sprite --game GI --names "^UI_Gcg_(Buff|Cardface|Debuff)|^Skill_|^MonsterSkill_"
```
