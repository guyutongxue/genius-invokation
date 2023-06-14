
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1408,
  health: 10,
  energy: 2,
  tags: ["electro", "catalyst", "inazuma"],
})
class YaeMiko {
  
  @Normal
  @Electro(1)
  @Void(2)
  spiritfoxSinEater(c: Context) {
    // 造成1点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>。
  }
  
  @Skill
  @Electro(3)
  yakanEvocationSesshouSakura(c: Context) {
    // 召唤<color=#FFFFFFFF>杀生樱</color>。
  }
  
  @Burst
  @Electro(3)
  @Energy(2)
  greatSecretArtTenkoKenshin(c: Context) {
    // 造成4点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>；如果我方场上存在<color=#FFFFFFFF>杀生樱</color>，则将其消灭，然后生成<color=#FFFFFFFF>天狐霆雷</color>。
  }
}

register(YaeMiko);
